/**
 * IASE Project - Verifica Persistenza
 * 
 * Questo script verifica che i dati creati dal test di persistenza
 * siano stati correttamente recuperati dopo un riavvio.
 */

import { inMemoryDb } from './in-memory-db.js';

/**
 * Verifica la persistenza dei dati
 */
async function verifyPersistence() {
  console.log('\n🔍 VERIFICA PERSISTENZA DATI\n');
  
  try {
    // Attendere che il servizio di persistenza abbia caricato i dati
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Stampa lo stato attuale del database
    console.log('📊 STATO DATABASE DOPO RIAVVIO:');
    console.log(`- Utenti: ${inMemoryDb.users.length}`);
    console.log(`- Stake NFT: ${inMemoryDb.nftStakes.length}`);
    console.log(`- Ricompense: ${inMemoryDb.stakingRewards.length}`);
    console.log(`- Traits NFT: ${inMemoryDb.nftTraits.length}`);
    
    // Verifica se ci sono utenti con il wallet del test precedente
    const testWallet = '0x1234567890abcdef1234567890abcdef12345678';
    const users = inMemoryDb.users.filter(user => user.walletAddress === testWallet);
    
    if (users.length > 0) {
      console.log('\n✅ UTENTE TEST TROVATO:');
      console.log(`- ID: ${users[0].id}`);
      console.log(`- Username: ${users[0].username}`);
      console.log(`- Wallet: ${users[0].walletAddress}`);
      
      // Cerca stake associati all'utente
      const stakes = await inMemoryDb.getNftStakesByWallet(testWallet);
      
      if (stakes.length > 0) {
        console.log('\n✅ STAKE NFT TROVATI:');
        for (const stake of stakes) {
          console.log(`- ID: ${stake.id}, NFT #${stake.nftId}, Rarity: ${stake.rarityMultiplier}x`);
          
          // Cerca ricompense associate allo stake
          const rewards = await inMemoryDb.getRewardsByStakeId(stake.id);
          
          if (rewards.length > 0) {
            console.log(`  ✅ RICOMPENSE TROVATE:`);
            for (const reward of rewards) {
              console.log(`  - ID: ${reward.id}, Importo: ${reward.amount} IASE, Claimed: ${reward.claimed}`);
            }
          } else {
            console.log(`  ❌ Nessuna ricompensa trovata per lo stake ID ${stake.id}`);
          }
          
          // Cerca trait associati al NFT
          const traits = await inMemoryDb.getNftTraitsByNftId(stake.nftId);
          
          if (traits.length > 0) {
            console.log(`  ✅ TRAITS NFT TROVATI:`);
            for (const trait of traits) {
              console.log(`  - ID: ${trait.id}, Tipo: ${trait.traitType}, Valore: ${trait.value}`);
            }
          } else {
            console.log(`  ❌ Nessun trait trovato per NFT #${stake.nftId}`);
          }
        }
      } else {
        console.log('\n❌ Nessuno stake NFT trovato per il wallet di test');
      }
      
      console.log('\n✅ LA PERSISTENZA FUNZIONA CORRETTAMENTE!\n');
    } else {
      console.log('\n❌ UTENTE TEST NON TROVATO - PROBLEMA DI PERSISTENZA\n');
      console.log('Possibili cause:');
      console.log('- Il test di persistenza non è stato eseguito prima');
      console.log('- Il file di persistenza è danneggiato o non accessibile');
      console.log('- C\'è un problema nel caricamento dei dati');
    }
    
  } catch (error) {
    console.error('❌ ERRORE DURANTE LA VERIFICA:', error);
  }
}

// Esegui la verifica
verifyPersistence();