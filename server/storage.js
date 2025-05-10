/**
 * JavaScript version of storage.ts
 * Used by staking-job.js and nft-verification.js in the cron job environment
 */

import { USE_MEMORY_DB } from './config.js';

// Import appropriate storage implementation based on environment
let storage;

if (USE_MEMORY_DB) {
  // Import in-memory storage
  import('./storage-mem.js').then(module => {
    storage = module.storage;
    console.log("📦 Utilizzo storage in memoria");
  });
} else {
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
      return [];
    }

    async getNftStakeById(stakeId) {
      return undefined;
    }

    async updateNftStakeVerification(stakeId) {
      return undefined;
    }

    async endNftStake(stakeId) {
      return undefined;
    }

    async getAllActiveStakes() {
      return [];
    }

    async createStakingReward(reward) {
      return {};
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