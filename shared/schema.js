/**
 * IASE Project - Schema dei dati (versione JavaScript)
 * 
 * Questo file viene utilizzato dal cron job staking-job.js per avere
 * accesso ai tipi di dati utilizzati nell'applicazione.
 */

// Questo file è solo per compatibilità - non contiene implementazioni reali
// poiché nell'implementazione in memoria non usiamo Drizzle ORM

// Esempio di un utente
export const userExample = {
  id: 1,
  username: 'username',
  password: 'hashed_password',
  email: 'email@example.com',
  walletAddress: '0x1234567890abcdef',
  createdAt: new Date()
};

// Esempio di uno stake NFT
export const nftStakeExample = {
  id: 1,
  nftId: '1',
  tokenContract: '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F',
  walletAddress: '0x1234567890abcdef',
  startDate: new Date(),
  endDate: null,
  active: true,
  verified: true,
  lastVerification: new Date(),
  rarityMultiplier: 1.0,
  createdAt: new Date()
};

// Esempio di una ricompensa di staking
export const stakingRewardExample = {
  id: 1,
  stakeId: 1,
  walletAddress: '0x1234567890abcdef',
  amount: 33.33,
  rewardDate: new Date(),
  claimed: false,
  createdAt: new Date()
};

// Esempio di un trait NFT
export const nftTraitExample = {
  id: 1,
  nftId: '1',
  traitType: 'CARD FRAME',
  value: 'Standard',
  displayType: null,
  createdAt: new Date()
};