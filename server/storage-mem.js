/**
 * IASE Project - Storage in memoria
 * 
 * Questo file sostituisce la versione con PostgreSQL per rendere l'app
 * completamente autonoma e compatibile con Render senza configurazioni di database.
 */

import { inMemoryDb } from './in-memory-db.js';
import session from 'express-session';
import memorystore from 'memorystore';

export class MemStorage {
  constructor() {
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Pulizia sessioni scadute ogni 24h
    });
    console.log("🔧 Storage in memoria inizializzato");
  }

  // User operations
  async getUser(id) {
    return await inMemoryDb.getUser(id);
  }

  async getUserByUsername(username) {
    return await inMemoryDb.getUserByUsername(username);
  }

  async getUserByWalletAddress(walletAddress) {
    return await inMemoryDb.getUserByWalletAddress(walletAddress);
  }

  async createUser(userData) {
    return await inMemoryDb.createUser(userData);
  }

  async updateUserWalletAddress(userId, walletAddress) {
    return await inMemoryDb.updateUserWalletAddress(userId, walletAddress);
  }

  // NFT Staking operations
  async createNftStake(stakeData) {
    return await inMemoryDb.createNftStake(stakeData);
  }

  async getNftStakesByWallet(walletAddress) {
    return await inMemoryDb.getNftStakesByWallet(walletAddress);
  }

  async getNftStakeById(stakeId) {
    return await inMemoryDb.getNftStakeById(stakeId);
  }

  async updateNftStakeVerification(stakeId) {
    return await inMemoryDb.updateNftStakeVerification(stakeId);
  }

  async endNftStake(stakeId) {
    return await inMemoryDb.endNftStake(stakeId);
  }

  async getAllActiveStakes() {
    return await inMemoryDb.getAllActiveStakes();
  }

  // Rewards operations
  async createStakingReward(rewardData) {
    return await inMemoryDb.createStakingReward(rewardData);
  }

  async getRewardsByStakeId(stakeId) {
    return await inMemoryDb.getRewardsByStakeId(stakeId);
  }

  async getRewardsByWalletAddress(walletAddress) {
    return await inMemoryDb.getRewardsByWalletAddress(walletAddress);
  }

  async markRewardsAsClaimed(stakeId) {
    await inMemoryDb.markRewardsAsClaimed(stakeId);
  }

  // NFT Traits operations
  async createNftTrait(traitData) {
    return await inMemoryDb.createNftTrait(traitData);
  }

  async getNftTraitsByNftId(nftId) {
    return await inMemoryDb.getNftTraitsByNftId(nftId);
  }
}

export const storage = new MemStorage();