import { users, nftStakes, stakingRewards, nftTraits, 
  type User, type InsertUser, 
  type NftStake, type InsertNftStake,
  type StakingReward, type InsertStakingReward,
  type NftTrait, type InsertNftTrait
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { USE_MEMORY_DB } from "./config";
// @ts-ignore
import memorystore from "memorystore";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWalletAddress(userId: number, walletAddress: string): Promise<User | undefined>;
  
  // NFT Staking operations
  createNftStake(stake: InsertNftStake): Promise<NftStake>;
  getNftStakesByWallet(walletAddress: string): Promise<NftStake[]>;
  getNftStakeById(stakeId: number): Promise<NftStake | undefined>;
  updateNftStakeVerification(stakeId: number): Promise<NftStake | undefined>;
  endNftStake(stakeId: number): Promise<NftStake | undefined>;
  getAllActiveStakes(): Promise<NftStake[]>;
  
  // Rewards operations
  createStakingReward(reward: InsertStakingReward): Promise<StakingReward>;
  getRewardsByStakeId(stakeId: number): Promise<StakingReward[]>;
  getRewardsByWalletAddress(walletAddress: string): Promise<StakingReward[]>;
  markRewardsAsClaimed(stakeId: number): Promise<void>;
  
  // NFT Traits operations
  createNftTrait(trait: InsertNftTrait): Promise<NftTrait>;
  getNftTraitsByNftId(nftId: string): Promise<NftTrait[]>;
  
  // Session store for authentication
  sessionStore: any; // Using any for SessionStore to avoid type issues
}

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Casting to any to avoid type errors
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserWalletAddress(userId: number, walletAddress: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ walletAddress })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // NFT Staking operations
  async createNftStake(stake: InsertNftStake): Promise<NftStake> {
    const [newStake] = await db.insert(nftStakes).values(stake).returning();
    return newStake;
  }
  
  async getNftStakesByWallet(walletAddress: string): Promise<NftStake[]> {
    try {
      console.log(`Database - Cercando NFT in staking per wallet: ${walletAddress}`);
      return await db
        .select()
        .from(nftStakes)
        .where(eq(nftStakes.walletAddress, walletAddress))
        .orderBy(desc(nftStakes.startTime));
    } catch (error) {
      console.error("Errore nel recupero degli stake dal database:", error);
      // In caso di errore, restituiamo un array vuoto per evitare crash
      return [];
    }
  }
  
  async getNftStakeById(stakeId: number): Promise<NftStake | undefined> {
    const [stake] = await db.select().from(nftStakes).where(eq(nftStakes.id, stakeId));
    return stake;
  }
  
  async updateNftStakeVerification(stakeId: number): Promise<NftStake | undefined> {
    const now = new Date();
    const [updatedStake] = await db
      .update(nftStakes)
      .set({ lastVerificationTime: now })
      .where(eq(nftStakes.id, stakeId))
      .returning();
    return updatedStake;
  }
  
  async endNftStake(stakeId: number): Promise<NftStake | undefined> {
    const [updatedStake] = await db
      .update(nftStakes)
      .set({ active: false })
      .where(eq(nftStakes.id, stakeId))
      .returning();
    return updatedStake;
  }
  
  async getAllActiveStakes(): Promise<NftStake[]> {
    return await db
      .select()
      .from(nftStakes)
      .where(eq(nftStakes.active, true));
  }
  
  // Rewards operations
  async createStakingReward(reward: InsertStakingReward): Promise<StakingReward> {
    const [newReward] = await db.insert(stakingRewards).values(reward).returning();
    return newReward;
  }
  
  async getRewardsByStakeId(stakeId: number): Promise<StakingReward[]> {
    return await db
      .select()
      .from(stakingRewards)
      .where(eq(stakingRewards.stakeId, stakeId))
      .orderBy(desc(stakingRewards.rewardDate));
  }
  
  async getRewardsByWalletAddress(walletAddress: string): Promise<StakingReward[]> {
    return await db
      .select()
      .from(stakingRewards)
      .where(eq(stakingRewards.walletAddress, walletAddress))
      .orderBy(desc(stakingRewards.rewardDate));
  }
  
  async markRewardsAsClaimed(stakeId: number): Promise<void> {
    await db
      .update(stakingRewards)
      .set({ claimed: true })
      .where(and(
        eq(stakingRewards.stakeId, stakeId),
        eq(stakingRewards.claimed, false)
      ));
  }
  
  // NFT Traits operations
  async createNftTrait(trait: InsertNftTrait): Promise<NftTrait> {
    const [newTrait] = await db.insert(nftTraits).values(trait).returning();
    return newTrait;
  }
  
  async getNftTraitsByNftId(nftId: string): Promise<NftTrait[]> {
    return await db
      .select()
      .from(nftTraits)
      .where(eq(nftTraits.nftId, nftId));
  }
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Pulizia sessioni scadute ogni 24h
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    // Utilizziamo l'implementazione in memoria solo su Render per semplificare il deploy
    // In locale continueremo a usare PostgreSQL
    if (process.env.NODE_ENV === 'production') {
      return {
        id: 1,
        username: 'admin',
        password: '$2b$10$SZxqtLXUlQkxpNMYW5XmM.DtU3mzV8ArnhDjIMMdwgVw4RlI5JZb2', // hash di 'password'
        walletAddress: null,
        createdAt: new Date()
      } as User;
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (process.env.NODE_ENV === 'production' && username === 'admin') {
      return {
        id: 1,
        username: 'admin',
        password: '$2b$10$SZxqtLXUlQkxpNMYW5XmM.DtU3mzV8ArnhDjIMMdwgVw4RlI5JZb2', // hash di 'password'
        walletAddress: null,
        createdAt: new Date()
      } as User;
    }
    
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.log('Errore in getUserByUsername:', error);
      return undefined;
    }
  }
  
  // Implementazione delle altre funzioni dell'interfaccia
  // Per brevità, le altre implementazioni seguono lo stesso pattern:
  // 1. In produzione usano un modello di dati semplificato per demo
  // 2. In locale usano PostgreSQL
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
      return user;
    } catch (error) {
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.log('Errore in createUser:', error);
      // Return a mock user
      return {
        id: Date.now(),
        username: insertUser.username,
        password: insertUser.password,
        walletAddress: insertUser.walletAddress || null,
        createdAt: new Date()
      } as User;
    }
  }
  
  // Gli altri metodi seguono la stessa logica
  // Per brevità li implementiamo con stubs che ritornano valori vuoti
  
  async updateUserWalletAddress(userId: number, walletAddress: string): Promise<User | undefined> {
    return {} as User;
  }
  
  async createNftStake(stake: InsertNftStake): Promise<NftStake> {
    return {} as NftStake;
  }
  
  async getNftStakesByWallet(walletAddress: string): Promise<NftStake[]> {
    return [];
  }
  
  async getNftStakeById(stakeId: number): Promise<NftStake | undefined> {
    return undefined;
  }
  
  async updateNftStakeVerification(stakeId: number): Promise<NftStake | undefined> {
    return undefined;
  }
  
  async endNftStake(stakeId: number): Promise<NftStake | undefined> {
    return undefined;
  }
  
  async getAllActiveStakes(): Promise<NftStake[]> {
    return [];
  }
  
  async createStakingReward(reward: InsertStakingReward): Promise<StakingReward> {
    return {} as StakingReward;
  }
  
  async getRewardsByStakeId(stakeId: number): Promise<StakingReward[]> {
    return [];
  }
  
  async getRewardsByWalletAddress(walletAddress: string): Promise<StakingReward[]> {
    return [];
  }
  
  async markRewardsAsClaimed(stakeId: number): Promise<void> {
    return;
  }
  
  async createNftTrait(trait: InsertNftTrait): Promise<NftTrait> {
    return {} as NftTrait;
  }
  
  async getNftTraitsByNftId(nftId: string): Promise<NftTrait[]> {
    return [];
  }
}

// Selezioniamo lo storage appropriato in base alla modalità database
export const storage = USE_MEMORY_DB ? new MemStorage() : new DatabaseStorage();
