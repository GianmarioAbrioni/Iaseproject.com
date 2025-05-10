/**
 * IASE Project - Test di Persistenza
 * 
 * Questo script verifica il corretto funzionamento del sistema di persistenza
 * per il database in memoria.
 */

import { inMemoryDb } from './in-memory-db.js';

// Dati di test
const testUser = {
  username: 'test_user',
  password: 'password_hash',
  email: 'test@example.com',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
};

const testNft = {
  nftId: '1',
  tokenContract: '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  startDate: new Date(),
  active: true,
  verified: true,
  rarityMultiplier: 1.5
};

/**
 * Test della persistenza
 */
async function runPersistenceTest() {
  console.log('\n🧪 AVVIO TEST PERSISTENZA DATABASE IN MEMORIA\n');
  
  try {
    // 1. Crea dati di test
    console.log('📝 Creazione dati di test...');
    
    // Crea un utente
    const user = await inMemoryDb.createUser(testUser);
    console.log(`✅ Utente creato: ID ${user.id}, wallet ${user.walletAddress}`);
    
    // Crea uno stake NFT
    const stake = await inMemoryDb.createNftStake({
      ...testNft,
      walletAddress: user.walletAddress
    });
    console.log(`✅ Stake NFT creato: ID ${stake.id}, NFT #${stake.nftId}`);
    
    // Crea una ricompensa
    const reward = await inMemoryDb.createStakingReward({
      stakeId: stake.id,
      walletAddress: user.walletAddress,
      amount: 33.33,
      rewardDate: new Date(),
      claimed: false
    });
    console.log(`✅ Ricompensa creata: ID ${reward.id}, Importo: ${reward.amount} IASE`);
    
    // Crea un trait NFT
    const trait = await inMemoryDb.createNftTrait({
      nftId: stake.nftId,
      traitType: 'CARD FRAME',
      value: 'Advanced',
      displayType: null
    });
    console.log(`✅ Trait NFT creato: ID ${trait.id}, Tipo: ${trait.traitType}, Valore: ${trait.value}`);
    
    // 2. Forza il salvataggio
    console.log('\n💾 Forzando il salvataggio dei dati...');
    if (inMemoryDb.persistence) {
      await inMemoryDb.persistence.forceSave();
      console.log('✅ Dati salvati con successo');
    } else {
      console.log('❌ Servizio di persistenza non disponibile');
    }
    
    // 3. Stampa stato attuale del database
    console.log('\n📊 STATO ATTUALE DATABASE:');
    console.log(`- Utenti: ${inMemoryDb.users.length}`);
    console.log(`- Stake NFT: ${inMemoryDb.nftStakes.length}`);
    console.log(`- Ricompense: ${inMemoryDb.stakingRewards.length}`);
    console.log(`- Traits NFT: ${inMemoryDb.nftTraits.length}`);
    
    console.log('\n✅ TEST COMPLETATO CON SUCCESSO\n');
    console.log('Per verificare la persistenza:');
    console.log('1. Riavvia l\'applicazione');
    console.log('2. Esegui lo script server/test-persistence-verify.js');
    
  } catch (error) {
    console.error('❌ ERRORE DURANTE IL TEST:', error);
  }
}

// Esegui il test
runPersistenceTest();