-- Schema Creation for IASE Project
-- Questo script crea lo schema del database iniziale per IASE Project

-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "walletAddress" VARCHAR(42),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Stakes Table
CREATE TABLE IF NOT EXISTS "nft_stakes" (
    "id" SERIAL PRIMARY KEY,
    "nftId" VARCHAR(255) NOT NULL,
    "walletAddress" VARCHAR(42) NOT NULL,
    "startTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP,
    "active" BOOLEAN DEFAULT TRUE,
    "lastVerificationTime" TIMESTAMP,
    "rarityTier" VARCHAR(50) DEFAULT 'Standard',
    "rarityMultiplier" NUMERIC(5,2) DEFAULT 1.0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staking Rewards Table
CREATE TABLE IF NOT EXISTS "staking_rewards" (
    "id" SERIAL PRIMARY KEY,
    "stakeId" INTEGER NOT NULL REFERENCES "nft_stakes"("id"),
    "amount" NUMERIC(20,8) NOT NULL,
    "rewardDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "claimed" BOOLEAN DEFAULT FALSE,
    "claimTxHash" VARCHAR(66),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Traits Table
CREATE TABLE IF NOT EXISTS "nft_traits" (
    "id" SERIAL PRIMARY KEY,
    "nftId" VARCHAR(255) NOT NULL,
    "traitType" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "nft_stakes_wallet_idx" ON "nft_stakes" ("walletAddress");
CREATE INDEX IF NOT EXISTS "nft_stakes_nft_idx" ON "nft_stakes" ("nftId");
CREATE INDEX IF NOT EXISTS "staking_rewards_stake_idx" ON "staking_rewards" ("stakeId");
CREATE INDEX IF NOT EXISTS "nft_traits_nft_idx" ON "nft_traits" ("nftId");

-- Session Store Table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");