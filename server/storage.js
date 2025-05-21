/**
 * JavaScript version of storage.ts
 * Used by staking-job.js and nft-verification.js in the cron job environment
 */

  // Import database storage
  class DatabaseStorage {
    constructor() {
      console.log("📦 Utilizzo storage PostgreSQL");
      this.sessionStore = null;
    }

    // Implementazioni vuote per compatibilità
    async getUser(id) {
      return undefined;
    }

    async getUserByUsername(username) {
      return undefined;
    }

    async getUserByWalletAddress(walletAddress) {
      return undefined;
    }

    async createUser(insertUser) {
      return {};
    }

    async updateUserWalletAddress(userId, walletAddress) {
      return undefined;
    }

    async createNftStake(stake) {
      return {};
    }

    async getNftStakesByWallet(walletAddress) {
  try {
    const { pool } = await import('./db.js');

    const result = await pool.query(
      `SELECT "id", "nftId", "walletAddress", "active", "rarityTier", "dailyReward", "startTime",
              "rarityMultiplier", "lastVerificationTime"
       FROM nft_stakes
       WHERE "walletAddress" = $1 AND "active" = true`,
      [walletAddress]
    );

    console.log(`🔍 Trovati ${result.rows?.length || 0} NFT in staking per wallet ${walletAddress}`);
    
    // Converte le date in formato stringa ISO per la serializzazione JSON
    const formattedRows = (result.rows || []).map(row => ({
      ...row,
      startTime: row.startTime ? row.startTime.toISOString() : null,
      lastVerificationTime: row.lastVerificationTime ? row.lastVerificationTime.toISOString() : null
    }));
    
    return formattedRows;
  } catch (err) {
    console.error("❌ Errore nella query getNftStakesByWallet:", err);
    return [];
  }
}

    async getNftStakeById(stakeId) {
      try {
        const { pool } = await import('./db.js');
        
        const result = await pool.query(
          `SELECT * FROM nft_stakes WHERE "id" = $1`,
          [stakeId]
        );
        
        // Se non troviamo lo stake, ritorniamo null
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
    
    async checkNftStakeByTokenId(tokenId, walletAddress) {
      try {
        const { pool } = await import('./db.js');
        
        // Formatta tokenId per supportare sia format semplice che ETH_xxx
        const formattedTokenId = tokenId.startsWith('ETH_') ? tokenId : `ETH_${tokenId}`;
        
        const result = await pool.query(
          `SELECT "id", "nftId", "active", "rarityTier", "dailyReward" 
           FROM nft_stakes 
           WHERE "nftId" = $1 AND "walletAddress" = $2 AND "active" = true`,
          [formattedTokenId, walletAddress]
        );
        
        return {
          isStaked: result.rows && result.rows.length > 0,
          stakeInfo: result.rows && result.rows.length > 0 ? result.rows[0] : null
        };
      } catch (err) {
        console.error(`❌ Errore nella verifica staking per NFT ${tokenId}:`, err);
        return { isStaked: false, stakeInfo: null };
      }
    }

    async updateNftStakeVerification(stakeId) {
      try {
        const { pool } = await import('./db.js');
        
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
        const { pool } = await import('./db.js');
        
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
        const { pool } = await import('./db.js');
        
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

    async createStakingReward(reward) {
      try {
        const { pool } = await import('./db.js');
        
        // Controllo validità dei campi obbligatori
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
        const { pool } = await import('./db.js');
        
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
        const { pool } = await import('./db.js');
        
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
    
    async markRewardsAsClaimed(stakeId) {
      try {
        const { pool } = await import('./db.js');
        
        const result = await pool.query(
          `UPDATE staking_rewards 
           SET "claimed" = true, "claimTxHash" = 'claimed_' || NOW(), "updatedAt" = NOW() 
           WHERE "stakeId" = $1 AND "claimed" = false
           RETURNING *`,
          [stakeId]
        );
        
        console.log(`✅ Marcati come claimed ${result.rowCount} rewards per stakeId ${stakeId}`);
        return result.rows || [];
      } catch (err) {
        console.error(`❌ Errore nella marcatura dei rewards come claimed per stakeId ${stakeId}:`, err);
        return [];
      }
    }

    async createNftTrait(trait) {
      try {
        const { pool } = await import('./db.js');
        
        // Controllo validità dei campi obbligatori
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
        const { pool } = await import('./db.js');
        
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
    
    async getActiveNftStakesByWallet(walletAddress) {
      try {
        const { pool } = await import('./db.js');
        
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
    
    async getClaimedRewardsByStakeId(stakeId) {
      try {
        const { pool } = await import('./db.js');
        
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

    async getRewardsByStakeId(stakeId) {
      return [];
    }

    async getRewardsByWalletAddress(walletAddress) {
      return [];
    }

    async markRewardsAsClaimed(stakeId) {
      return;
    }

    async createNftTrait(trait) {
      return {};
    }

    async getNftTraitsByNftId(nftId) {
      return [];
    }
  }

  storage = new DatabaseStorage();
}

export { storage };