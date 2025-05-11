import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nftStakes = pgTable("nft_stakes", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  nftId: text("nft_id").notNull(),
  nftContractAddress: text("nft_contract_address").notNull().default("0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F"),
  rarityTier: text("rarity_tier").default("standard").notNull(),  // standard, advanced, elite, prototype
  startTime: timestamp("start_time").defaultNow().notNull(), // allineato con la tabella SQL
  endTime: timestamp("end_time"),
  active: boolean("active").default(true).notNull(), // allineato con la tabella SQL
  lastVerificationTime: timestamp("last_verification_time"),
  rarityMultiplier: doublePrecision("rarity_multiplier").default(1.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const stakingRewards = pgTable("staking_rewards", {
  id: serial("id").primaryKey(),
  stakeId: integer("stakeId").references(() => nftStakes.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  rewardDate: timestamp("rewardDate").defaultNow().notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  claimTxHash: text("claimTxHash"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  walletAddress: text("walletAddress").notNull(),
});

export const nftTraits = pgTable("nft_traits", {
  id: serial("id").primaryKey(),
  nftId: text("nftId").notNull(),
  traitType: text("traitType").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Schema relations
export const nftStakesRelations = relations(nftStakes, ({ one }) => ({
  user: one(users, {
    fields: [nftStakes.userId],
    references: [users.id],
  }),
}));

export const stakingRewardsRelations = relations(stakingRewards, ({ one }) => ({
  stake: one(nftStakes, {
    fields: [stakingRewards.stakeId],
    references: [nftStakes.id],
  }),
}));

// Insert Schemas
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
  rarityMultiplier: true,
  userId: true,
});

export const insertStakingRewardSchema = createInsertSchema(stakingRewards).pick({
  stakeId: true,
  amount: true,
  walletAddress: true,
  claimTxHash: true,
  claimed: true,
});

export const insertNftTraitSchema = createInsertSchema(nftTraits).pick({
  nftId: true,
  traitType: true,
  value: true,
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
