/**
 * IASE Staking Simulation
 * 
 * Questo script simula il processo di staking di un NFT IASE Units,
 * il calcolo delle ricompense dopo un periodo simulato e il claim delle ricompense.
 */

import { calculateDailyReward, calculateReward } from './services/nft-verification';
import { db } from './db';
import { nftStakes, stakingRewards, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function runSimulation() {
  console.log('🚀 Avvio simulazione staking IASE Units');
  console.log('-------------------------------------------');

  // Creiamo un wallet e un utente di test
  const testWalletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const testNftId = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F_1234';
  const rarityTier = 'Advanced'; // Standard, Advanced, Elite, Prototype
  
  console.log(`👤 Utente: wallet ${testWalletAddress}`);
  console.log(`🖼️ NFT: ${testNftId} (Rarità: ${rarityTier})`);

  // Calcola la ricompensa giornaliera attesa per questo NFT
  const dailyReward = calculateDailyReward(testNftId, rarityTier);
  console.log(`💰 Ricompensa giornaliera: ${dailyReward.toFixed(2)} IASE`);

  // Simula il tempo di staking (3 giorni fa)
  const now = new Date();
  const stakeDate = new Date(now);
  stakeDate.setDate(stakeDate.getDate() - 3); // 3 giorni fa
  const lastVerificationTime = new Date(stakeDate);

  console.log(`📅 Data staking: ${stakeDate.toLocaleString()}`);
  console.log(`📅 Oggi: ${now.toLocaleString()}`);
  console.log(`⏱️ Tempo trascorso: 3 giorni`);

  // Calcola la ricompensa attesa per 3 giorni
  const expectedReward = calculateReward(lastVerificationTime, now, dailyReward);
  console.log(`💰 Ricompensa attesa per 3 giorni: ${expectedReward.toFixed(2)} IASE`);

  // Simula il processo di staking
  console.log('-------------------------------------------');
  console.log('1️⃣ SIMULAZIONE STAKE');
  
  // Controlla se l'utente esiste già nel DB
  let user = await db.select().from(users).where(eq(users.walletAddress, testWalletAddress)).limit(1);
  let userId;
  
  if (user.length === 0) {
    // Crea un utente di test
    const newUser = await db.insert(users).values({
      username: 'test_user',
      password: 'hashed_password', // In un caso reale, questa sarebbe una password hashata
      walletAddress: testWalletAddress
    }).returning();
    
    userId = newUser[0].id;
    console.log(`✅ Utente creato con ID: ${userId}`);
  } else {
    userId = user[0].id;
    console.log(`✅ Utente esistente trovato con ID: ${userId}`);
  }

  // Crea lo stake
  const stake = await db.insert(nftStakes).values({
    userId: userId,
    walletAddress: testWalletAddress,
    nftId: testNftId,
    rarityTier: rarityTier,
    stakingStartTime: stakeDate,
    lastVerificationTime: lastVerificationTime,
    isActive: true,
    dailyRewardRate: dailyReward,
    totalRewardsEarned: 0
  }).returning();

  const stakeId = stake[0].id;
  console.log(`✅ Stake creato con ID: ${stakeId}`);
  console.log(`💰 Ricompensa pendente: ${expectedReward.toFixed(2)} IASE`);

  // Simula il claim
  console.log('-------------------------------------------');
  console.log('2️⃣ SIMULAZIONE CLAIM');

  // Crea una ricompensa
  const reward = await db.insert(stakingRewards).values({
    stakeId: stakeId,
    walletAddress: testWalletAddress,
    amount: expectedReward,
    rewardTime: now,
    transactionHash: '0x' + Math.random().toString(16).substring(2, 34) // hash simulato
  }).returning();

  console.log(`✅ Ricompensa creata con ID: ${reward[0].id}`);
  console.log(`💰 Ricompensa inviata: ${reward[0].amount.toFixed(2)} IASE`);
  console.log(`🧾 Transaction Hash: ${reward[0].transactionHash}`);

  // Aggiorna lo stake dopo il claim
  const updatedStake = await db.update(nftStakes)
    .set({
      totalRewardsEarned: expectedReward,
      lastVerificationTime: now
    })
    .where(eq(nftStakes.id, stakeId))
    .returning();

  console.log(`✅ Stake aggiornato, ricompensa azzerata`);
  console.log(`💰 Ricompensa aggiornata (0.00 IASE)`);
  console.log(`💰 Ricompense totali guadagnate: ${updatedStake[0].totalRewardsEarned.toFixed(2)} IASE`);

  // Simula unstake
  console.log('-------------------------------------------');
  console.log('3️⃣ SIMULAZIONE UNSTAKE');

  const unstaked = await db.update(nftStakes)
    .set({
      isActive: false
    })
    .where(eq(nftStakes.id, stakeId))
    .returning();

  console.log(`✅ NFT rimosso dallo staking`);
  console.log(`🔔 Staking non più attivo: ${unstaked[0].isActive ? 'Sì' : 'No'}`);
  console.log(`📅 Data inizio staking: ${unstaked[0].stakingStartTime.toLocaleString()}`);

  // Pulizia
  console.log('-------------------------------------------');
  console.log('🧹 Pulizia dati di simulazione...');

  // Uncomment these lines to clean up the test data:
  // await db.delete(stakingRewards).where(eq(stakingRewards.stakeId, stakeId));
  // await db.delete(nftStakes).where(eq(nftStakes.id, stakeId));
  
  console.log('✅ Simulazione completata con successo!');
}

// Esegui la simulazione
runSimulation()
  .then(() => {
    console.log('💯 Test completato!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Errore durante la simulazione:', error);
    process.exit(1);
  });