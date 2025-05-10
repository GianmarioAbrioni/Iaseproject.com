/**
 * IASE Project - In-Memory Database
 * 
 * Questa classe implementa un database in memoria per il progetto IASE.
 * Viene utilizzata come alternativa a PostgreSQL per semplificare il deploy.
 * Include persistenza automatica su file per mantenere i dati tra riavvii.
 */

import { PersistenceService } from './services/persistence-service.js';

class InMemoryDB {
  constructor() {
    this.users = [];
    this.nftStakes = [];
    this.stakingRewards = [];
    this.nftTraits = [];
    this.nextIds = {
      users: 1,
      nftStakes: 1,
      stakingRewards: 1,
      nftTraits: 1
    };
    console.log("📋 Database in memoria inizializzato");
    
    // Inizializza il servizio di persistenza
    this.persistence = new PersistenceService(this).init();
  }

  // User operations
  async getUser(id) {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  async getUserByWalletAddress(walletAddress) {
    return this.users.find(user => user.walletAddress === walletAddress);
  }

  async createUser(userData) {
    const newUser = {
      ...userData,
      id: this.nextIds.users++,
      createdAt: new Date()
    };
    this.users.push(newUser);
    
    // Trigger salvataggio dati dopo modifica
    this.triggerSave();
    
    return newUser;
  }
  
  // Trigger salvataggio con throttling
  triggerSave() {
    // Se il servizio di persistenza è disponibile, salva i dati
    // ma non più frequentemente di ogni 60 secondi per evitare troppi I/O
    if (this.persistence && Date.now() - this.persistence.lastSaveTime > 60000) {
      setTimeout(() => this.persistence.saveData(), 100);
    }
  }

  async updateUserWalletAddress(userId, walletAddress) {
    const user = await this.getUser(userId);
    if (user) {
      user.walletAddress = walletAddress;
      this.triggerSave();
      return user;
    }
    return undefined;
  }

  // NFT Staking operations
  async createNftStake(stakeData) {
    const newStake = {
      ...stakeData,
      id: this.nextIds.nftStakes++,
      lastVerification: new Date(),
      createdAt: new Date()
    };
    this.nftStakes.push(newStake);
    this.triggerSave();
    return newStake;
  }

  async getNftStakesByWallet(walletAddress) {
    return this.nftStakes.filter(stake => stake.walletAddress === walletAddress);
  }

  async getNftStakeById(stakeId) {
    return this.nftStakes.find(stake => stake.id === stakeId);
  }

  async updateNftStakeVerification(stakeId) {
    const stake = await this.getNftStakeById(stakeId);
    if (stake) {
      stake.lastVerification = new Date();
      stake.verified = true;
      this.triggerSave();
      return stake;
    }
    return undefined;
  }

  async endNftStake(stakeId) {
    const stake = await this.getNftStakeById(stakeId);
    if (stake) {
      stake.endDate = new Date();
      stake.active = false;
      this.triggerSave();
      return stake;
    }
    return undefined;
  }

  async getAllActiveStakes() {
    return this.nftStakes.filter(stake => stake.active);
  }

  // Rewards operations
  async createStakingReward(rewardData) {
    const newReward = {
      ...rewardData,
      id: this.nextIds.stakingRewards++,
      createdAt: new Date()
    };
    this.stakingRewards.push(newReward);
    this.triggerSave();
    return newReward;
  }

  async getRewardsByStakeId(stakeId) {
    return this.stakingRewards
      .filter(reward => reward.stakeId === stakeId)
      .sort((a, b) => new Date(b.rewardDate) - new Date(a.rewardDate));
  }

  async getRewardsByWalletAddress(walletAddress) {
    return this.stakingRewards
      .filter(reward => reward.walletAddress === walletAddress)
      .sort((a, b) => new Date(b.rewardDate) - new Date(a.rewardDate));
  }

  async markRewardsAsClaimed(stakeId) {
    const rewards = await this.getRewardsByStakeId(stakeId);
    rewards.forEach(reward => {
      reward.claimed = true;
    });
    if (rewards.length > 0) {
      this.triggerSave();
    }
  }

  // NFT Traits operations
  async createNftTrait(traitData) {
    const newTrait = {
      ...traitData,
      id: this.nextIds.nftTraits++,
      createdAt: new Date()
    };
    this.nftTraits.push(newTrait);
    this.triggerSave();
    return newTrait;
  }

  async getNftTraitsByNftId(nftId) {
    return this.nftTraits.filter(trait => trait.nftId === nftId);
  }
}

export const inMemoryDb = new InMemoryDB();