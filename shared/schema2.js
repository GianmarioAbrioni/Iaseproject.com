import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Schema users allineato con le colonne del database
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"), // nullable di default
  walletAddress: text("walletAddress"), // nullable di default
  createdAt: timestamp("createdAt"), // nullable
  updatedAt: timestamp("updatedAt"), // nullable
});

// Schema nft_stakes allineato con le colonne del database reale
export const nftStakes = pgTable("nft_stakes", {
  id: serial("id").primaryKey(),

  nftId: text("nftId").notNull(),
  walletAddress: text("walletAddress").notNull(),

  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),

  active: boolean("active"),
  lastVerificationTime: timestamp("lastVerificationTime"),

  rarityTier: text("rarityTier"),
  rarityMultiplier: doublePrecision("rarityMultiplier"),

  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),

  dailyReward: doublePrecision("dailyReward")
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
  nftId: text("nftId").notNull(),
  traitType: text("traitType").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt")
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
  // nftContractAddress: true, // This field is not in the nftStakes schema definition above
  rarityTier: true,
  // isActive: true, // This field is not in the nftStakes schema definition above (it's 'active')
  // dailyRewardRate: true, // This field is not in the nftStakes schema definition above (it's 'dailyReward')
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
  // traitValue: true, // This field is not in the nftTraits schema definition above (it's 'value')
  // rewardMultiplier: true, // This field is not in the nftTraits schema definition above
});

// Types
// Type definitions are removed as they are TypeScript-specific and have no runtime equivalent in JavaScript.
// export type InsertUser = z.infer<typeof insertUserSchema>;
// export type User = typeof users.$inferSelect;

// export type InsertNftStake = z.infer<typeof insertNftStakeSchema>;
// export type NftStake = typeof nftStakes.$inferSelect;

// export type InsertStakingReward = z.infer<typeof insertStakingRewardSchema>;
// export type StakingReward = typeof stakingRewards.$inferSelect;

// export type InsertNftTrait = z.infer<typeof insertNftTraitSchema>;
// export type NftTrait = typeof nftTraits.$inferSelect;
