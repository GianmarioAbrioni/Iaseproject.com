import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Schema users allineato con le colonne del database
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema nft_stakes allineato con le colonne del database
export const nftStakes = pgTable("nft_stakes", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  nftId: text("nft_id").notNull(),
  nftContractAddress: text("nft_contract_address"),
  stakingStartTime: timestamp("staking_start_time").defaultNow().notNull(),
  lastVerificationTime: timestamp("last_verification_time"),
  isActive: boolean("is_active").default(true).notNull(),
  totalRewardsEarned: doublePrecision("total_rewards_earned").default(0),
  userId: integer("user_id"),
  rarityTier: text("rarity_tier").default("standard").notNull(),
  dailyRewardRate: doublePrecision("daily_reward_rate").default(33.33),
});

// Schema staking_rewards allineato con le colonne reali del database
export const stakingRewards = pgTable("staking_rewards", {
  id: serial("id").primaryKey(),
  stakeId: integer("stakeId").references(() => nftStakes.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  rewardDate: timestamp("rewardDate").defaultNow().notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  claimTxHash: text("claimTxHash"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Schema nft_traits allineato con le colonne del database
export const nftTraits = pgTable("nft_traits", {
  id: serial("id").primaryKey(),
  nftId: text("nft_id").notNull(),
  traitType: text("trait_type").notNull(),
  traitValue: text("trait_value").notNull(),
  rewardMultiplier: doublePrecision("reward_multiplier").default(1.0),
});

// Schema relations
export const nftStakesRelations = relations(nftStakes, ({ many }) => ({
  rewards: many(stakingRewards)
}));

export const stakingRewardsRelations = relations(stakingRewards, ({ many }) => ({
  // Le relazioni vengono ripristinate correttamente
}));

// Insert Schemas aggiornati con i nomi corretti
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertNftStakeSchema = createInsertSchema(nftStakes).pick({
  walletAddress: true,
  nftId: true,
  nftContractAddress: true,
  rarityTier: true,
  isActive: true,
  dailyRewardRate: true,
});

export const insertStakingRewardSchema = createInsertSchema(stakingRewards).pick({
  stakeId: true,
  amount: true,
  claimed: true,
  claimTxHash: true,
  rewardDate: true,
});

export const insertNftTraitSchema = createInsertSchema(nftTraits).pick({
  nftId: true,
  traitType: true, 
  traitValue: true,
  rewardMultiplier: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNftStake = z.infer<typeof insertNftStakeSchema>;
export type NftStake = typeof nftStakes.$inferSelect;

export type InsertStakingReward = z.infer<typeof insertStakingRewardSchema>;
export type StakingReward = typeof stakingRewards.$inferSelect;

export type InsertNftTrait = z.infer<typeof insertNftTraitSchema>;
export type NftTrait = typeof nftTraits.$inferSelect;
