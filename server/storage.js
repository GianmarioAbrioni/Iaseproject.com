/**
 * IASE Project - Storage PostgreSQL
 * 
 * Implementazione completa dell'interfaccia di storage usando PostgreSQL.
 */

import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db.js';
// Import database storage
class DatabaseStorage {
  constructor() {
    console.log("📦 Utilizzo storage PostgreSQL");
    
    // Configurazione session store PostgreSQL
    try {
      const PostgresStore = connectPg(session);
      this.sessionStore = new PostgresStore({ 
        pool, 
        createTableIfMissing: true 
      });
      console.log("✅ Session store PostgreSQL configurato correttamente");
    } catch (err) {
      console.error("❌ Errore nella configurazione session store:", err);
      this.sessionStore = null;
    }
  }

  // Funzione per testare la connessione al database
  async testConnection() {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connection test successful:', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // User operations
  async getUser(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nel recupero utente ID ${id}:`, err);
      return undefined;
    }
  }

  async getUserByUsername(username) {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE username = $1`,
        [username]
      );
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nel recupero utente username ${username}:`, err);
      return undefined;
    }
  }

  async getUserByWalletAddress(walletAddress) {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE "walletAddress" = $1`,
        [walletAddress]
      );
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nel recupero utente wallet ${walletAddress}:`, err);
      return undefined;
    }
  }

  async createUser(insertUser) {
    try {
      const result = await pool.query(
        `INSERT INTO users (username, password, "walletAddress", "createdAt") 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [insertUser.username, insertUser.password, insertUser.walletAddress]
      );
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nella creazione utente:`, err);
      return {};
    }
  }

  async updateUserWalletAddress(userId, walletAddress) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET "walletAddress" = $1, "updatedAt" = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [walletAddress, userId]
      );
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nell'aggiornamento wallet per utente ${userId}:`, err);
      return undefined;
    }
  }

  // NFT Staking operations
  async createNftStake(stake) {
    try {
      console.log('⏱️ Tentativo di inserire stake nel database:', JSON.stringify(stake, null, 2));
      
      if (!stake.walletAddress || !stake.nftId) {
        throw new Error('Dati incompleti per lo staking: walletAddress e nftId sono campi obbligatori');
      }
      
      const walletAddress = stake.walletAddress;
      const nftId = stake.nftId;
      const rarityTier = stake.rarityTier || "standard";
      const isActive = true;
      const dailyReward = stake.dailyReward || 33.33;
      
      const result = await pool.query(
        `INSERT INTO nft_stakes 
        ("walletAddress", "nftId", "rarityTier", "active", "dailyReward", "startTime") 
        VALUES ($1, $2, $3, $4, $5, NOW()) 
        RETURNING *`,
        [
          walletAddress, 
          nftId, 
          rarityTier,
          isActive,
          dailyReward
        ]
      );
      
      console.log('✅ Stake inserito con successo nel database:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Errore durante inserimento stake:', error);
      throw error;
    }
  }
  
  async getNftStakesByWallet(walletAddress) {
    try {
      console.log(`Database - Cercando NFT in staking per wallet: ${walletAddress}`);
      
      // Uso LOWER per rendere il confronto case-insensitive
      const result = await pool.query(
        `SELECT * FROM nft_stakes WHERE LOWER("walletAddress") = LOWER($1) AND active = true`,
        [walletAddress]
      );
      
      console.log(`Database - Trovati ${result.rows.length} NFT in staking`);
      
      // Converte le date in formato stringa ISO per la serializzazione JSON
      const formattedRows = (result.rows || []).map(row => ({
        ...row,
        startTime: row.startTime ? row.startTime.toISOString() : null,
        lastVerificationTime: row.lastVerificationTime ? row.lastVerificationTime.toISOString() : null
      }));
      
      return formattedRows;
    } catch (error) {
      console.error("Errore nel recupero degli stake dal database:", error);
      return [];
    }
  }
  
  // Alias per mantenere compatibilità con diverse parti del codice
  async getActiveNftStakesByWallet(walletAddress) {
    console.log(`getActiveNftStakesByWallet chiamato per wallet: ${walletAddress}`);
    
    try {
      // Esegui la stessa query di getNftStakesByWallet ma con più debugging
      const result = await pool.query(
        `SELECT * FROM nft_stakes WHERE LOWER("walletAddress") = LOWER($1) AND active = true`,
        [walletAddress]
      );
      
      console.log(`getActiveNftStakesByWallet: Trovati ${result.rows.length} NFT in staking`);
      
      // Converte le date in formato stringa ISO per la serializzazione JSON
      const formattedRows = (result.rows || []).map(row => ({
        ...row,
        startTime: row.startTime ? row.startTime.toISOString() : null,
        lastVerificationTime: row.lastVerificationTime ? row.lastVerificationTime.toISOString() : null
      }));
      
      return formattedRows;
    } catch (error) {
      console.error("Errore in getActiveNftStakesByWallet:", error);
      return [];
    }
  }
  
  // Recupera le ricompense per un wallet
  async getRewardsByWalletAddress(walletAddress) {
    try {
      console.log(`Cercando ricompense per wallet: ${walletAddress}`);
      
      // Prima otteniamo tutti gli stake attivi per il wallet
      const stakes = await this.getNftStakesByWallet(walletAddress);
      
      if (!stakes || stakes.length === 0) {
        console.log(`Nessuno stake trovato per wallet ${walletAddress}, non ci sono ricompense`);
        return [];
      }
      
      // Otteniamo gli ID degli stake
      const stakeIds = stakes.map(stake => stake.id);
      
      // Recuperiamo tutte le ricompense per gli stake
      const result = await pool.query(
        `SELECT * FROM staking_rewards WHERE "stakeId" = ANY($1)`,
        [stakeIds]
      );
      
      console.log(`Recuperate ${result.rows.length} ricompense per wallet ${walletAddress}`);
      
      // Formatta le date
      const rewards = result.rows.map(row => ({
        ...row,
        rewardDate: row.rewardDate ? row.rewardDate.toISOString() : null,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null
      }));
      
      return rewards;
    } catch (error) {
      console.error(`Errore nel recupero delle ricompense per wallet ${walletAddress}:`, error);
      return [];
    }
  }
  
  async getNftStakeById(stakeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_stakes WHERE "id" = $1`,
        [stakeId]
      );
      
      if (!result.rows || result.rows.length === 0) {
        return null;
      }
      
      // Converte le date in formato ISO string
      const stake = result.rows[0];
      return {
        ...stake,
        startTime: stake.startTime ? stake.startTime.toISOString() : null,
        endTime: stake.endTime ? stake.endTime.toISOString() : null,
        lastVerificationTime: stake.lastVerificationTime ? stake.lastVerificationTime.toISOString() : null,
        createdAt: stake.createdAt ? stake.createdAt.toISOString() : null,
        updatedAt: stake.updatedAt ? stake.updatedAt.toISOString() : null
      };
    } catch (err) {
      console.error("❌ Errore nella query getNftStakeById:", err);
      return null;
    }
  }
  
  async updateNftStakeVerification(stakeId) {
    try {
      const result = await pool.query(
        `UPDATE nft_stakes 
         SET "lastVerificationTime" = NOW() 
         WHERE "id" = $1 AND "active" = true
         RETURNING *`,
        [stakeId]
      );
      
      if (!result.rows || result.rows.length === 0) {
        console.warn(`⚠️ Nessun record aggiornato per stakeId: ${stakeId}`);
        return null;
      }
      
      console.log(`✅ Verifica aggiornata per stakeId ${stakeId}`);
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nell'aggiornamento della verifica per stakeId ${stakeId}:`, err);
      return null;
    }
  }
  
  async endNftStake(stakeId) {
    try {
      const result = await pool.query(
        `UPDATE nft_stakes 
         SET "active" = false, 
             "endTime" = NOW(), 
             "updatedAt" = NOW() 
         WHERE "id" = $1 
         RETURNING *`,
        [stakeId]
      );
      
      if (!result.rows || result.rows.length === 0) {
        console.warn(`⚠️ Nessun record terminato per stakeId: ${stakeId}`);
        return null;
      }
      
      console.log(`✅ Stake terminato per stakeId ${stakeId}`);
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nella terminazione dello stake ${stakeId}:`, err);
      return null;
    }
  }
  
  async getAllActiveStakes() {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_stakes WHERE "active" = true`
      );
      
      console.log(`🔍 Trovati ${result.rows?.length || 0} NFT attivamente in staking`);
      return result.rows || [];
    } catch (err) {
      console.error("❌ Errore nel recupero di tutti gli stake attivi:", err);
      return [];
    }
  }

  // Rewards operations
  async createStakingReward(reward) {
    try {
      if (!reward.stakeId || !reward.amount) {
        console.error("❌ Dati di reward incompleti:", reward);
        return null;
      }
      
      const result = await pool.query(
        `INSERT INTO staking_rewards 
         ("stakeId", "amount", "rewardDate", "claimed") 
         VALUES ($1, $2, NOW(), false) 
         RETURNING *`,
        [reward.stakeId, reward.amount]
      );
      
      if (!result.rows || result.rows.length === 0) {
        console.warn(`⚠️ Nessun reward creato`);
        return null;
      }
      
      console.log(`✅ Reward creato per stakeId ${reward.stakeId}: ${reward.amount} IASE`);
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nella creazione del reward:`, err);
      return null;
    }
  }

  async getRewardsByStakeId(stakeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM staking_rewards 
         WHERE "stakeId" = $1 
         ORDER BY "rewardDate" DESC`,
        [stakeId]
      );
      
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nel recupero rewards per stakeId ${stakeId}:`, err);
      return [];
    }
  }
  
  async getRewardsByWalletAddress(walletAddress) {
    try {
      const result = await pool.query(
        `SELECT r.* 
         FROM staking_rewards r
         JOIN nft_stakes s ON r."stakeId" = s.id
         WHERE s."walletAddress" = $1
         ORDER BY r."rewardDate" DESC`,
        [walletAddress]
      );
      
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nel recupero rewards per wallet ${walletAddress}:`, err);
      return [];
    }
  }
  
  async markRewardsAsClaimed(stakeId, txHash) {
    try {
      // Usa l'hash della transazione se fornito, altrimenti genera un valore
      const claimTxValue = txHash ? txHash : 'claimed_' + Date.now();
      
      const result = await pool.query(
        `UPDATE staking_rewards 
         SET "claimed" = true, "claimTxHash" = $1, "updatedAt" = NOW() 
         WHERE "stakeId" = $2 AND "claimed" = false
         RETURNING *`,
        [claimTxValue, stakeId]
      );
      
      console.log(`✅ Marcati come claimed ${result.rowCount} rewards per stakeId ${stakeId} con txHash: ${claimTxValue}`);
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nella marcatura dei rewards come claimed per stakeId ${stakeId}:`, err);
      return [];
    }
  }
  
  async markRewardsAsClaimedByWallet(walletAddress, amount) {
    try {
      // Prima ottiene gli stake attivi per quell'indirizzo
      const stakes = await this.getActiveNftStakesByWallet(walletAddress);
      
      if (!stakes || stakes.length === 0) {
        console.warn(`⚠️ Nessuno stake attivo trovato per wallet ${walletAddress}`);
        return [];
      }
      
      // Ottiene gli ID di tutti gli stake dell'utente
      const stakeIds = stakes.map(stake => stake.id);
      
      // Marca come claimed tutti i rewards non ancora reclamati per questi stake
      const result = await pool.query(
        `UPDATE staking_rewards 
         SET "claimed" = true, "claimTxHash" = 'claimed_wallet_' || NOW(), "updatedAt" = NOW() 
         WHERE "stakeId" = ANY($1) AND "claimed" = false
         RETURNING *`,
        [stakeIds]
      );
      
      console.log(`✅ Marcati come claimed ${result.rowCount} rewards per wallet ${walletAddress}`);
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nella marcatura dei rewards come claimed per wallet ${walletAddress}:`, err);
      return [];
    }
  }
  
  async getClaimedRewardsByStakeId(stakeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM staking_rewards 
         WHERE "stakeId" = $1 AND "claimed" = true
         ORDER BY "rewardDate" DESC`,
        [stakeId]
      );
      
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nel recupero dei reward già reclamati per stakeId ${stakeId}:`, err);
      return [];
    }
  }
  
  async getActiveNftStakesByWallet(walletAddress) {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_stakes 
         WHERE "walletAddress" = $1 AND "active" = true
         ORDER BY "startTime" DESC`,
        [walletAddress]
      );
      
      // Converte le date in formato stringa ISO per la serializzazione JSON
      const formattedRows = (result.rows || []).map(row => ({
        ...row,
        startTime: row.startTime ? row.startTime.toISOString() : null,
        lastVerificationTime: row.lastVerificationTime ? row.lastVerificationTime.toISOString() : null
      }));
      
      console.log(`✅ Recuperati ${formattedRows.length} stake attivi per wallet ${walletAddress}`);
      return formattedRows;
    } catch (err) {
      console.error(`❌ Errore nel recupero degli stake attivi per wallet ${walletAddress}:`, err);
      return [];
    }
  }
  
  async checkNftStakeByTokenId(tokenId, walletAddress) {
    try {
      console.log(`🔍 Verifica se NFT #${tokenId} è in staking per ${walletAddress}`);
      
      // Prepara il token ID nel formato corretto
      const formattedTokenId = tokenId.includes("_") ? tokenId : `ETH_${tokenId}`;
      
      // Query per verificare se esiste uno stake attivo per il token ID e l'indirizzo
      const result = await pool.query(
        `SELECT * FROM nft_stakes 
         WHERE "nftId" = $1 AND "walletAddress" = $2 AND "active" = true`,
        [formattedTokenId, walletAddress]
      );
      
      // Se abbiamo risultati, l'NFT è in staking
      const isStaked = result.rows && result.rows.length > 0;
      
      console.log(`✅ Verifica completata: NFT #${tokenId} ${isStaked ? 'è' : 'non è'} in staking per ${walletAddress}`);
      
      return {
        isStaked,
        stake: isStaked ? {
          ...result.rows[0],
          startTime: result.rows[0].startTime ? result.rows[0].startTime.toISOString() : null,
          lastVerificationTime: result.rows[0].lastVerificationTime ? result.rows[0].lastVerificationTime.toISOString() : null
        } : null
      };
    } catch (err) {
      console.error(`❌ Errore nella verifica dello staking per NFT #${tokenId}:`, err);
      return { isStaked: false, stake: null };
    }
  }

  // NFT Traits operations
  async createNftTrait(trait) {
    try {
      if (!trait.nftId || !trait.traitType || !trait.value) {
        console.error("❌ Dati di trait incompleti:", trait);
        return null;
      }
      
      const result = await pool.query(
        `INSERT INTO nft_traits 
         ("nftId", "traitType", "value", "createdAt") 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [trait.nftId, trait.traitType, trait.value]
      );
      
      if (!result.rows || result.rows.length === 0) {
        console.warn(`⚠️ Nessun trait creato`);
        return null;
      }
      
      console.log(`✅ Trait creato per NFT ${trait.nftId}: ${trait.traitType}=${trait.value}`);
      return result.rows[0];
    } catch (err) {
      console.error(`❌ Errore nella creazione del trait:`, err);
      return null;
    }
  }
  
  async getNftTraitsByNftId(nftId) {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_traits 
         WHERE "nftId" = $1`,
        [nftId]
      );
      
      return result.rows || [];
    } catch (err) {
      console.error(`❌ Errore nel recupero traits per NFT ${nftId}:`, err);
      return [];
    }
  }
}

// Esportiamo direttamente l'implementazione PostgreSQL
export const storage = new DatabaseStorage();