CREATE TABLE "nft_stakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"nft_id" text NOT NULL,
	"nft_contract_address" text DEFAULT '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F' NOT NULL,
	"rarity_tier" text DEFAULT 'standard' NOT NULL,
	"staking_start_time" timestamp DEFAULT now() NOT NULL,
	"last_verification_time" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_rewards_earned" double precision DEFAULT 0 NOT NULL,
	"daily_reward_rate" double precision NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "nft_traits" (
	"id" serial PRIMARY KEY NOT NULL,
	"nft_id" text NOT NULL,
	"trait_type" text NOT NULL,
	"trait_value" text NOT NULL,
	"reward_multiplier" double precision DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staking_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"stake_id" integer NOT NULL,
	"amount" double precision NOT NULL,
	"reward_time" timestamp DEFAULT now() NOT NULL,
	"wallet_address" text NOT NULL,
	"transaction_hash" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"wallet_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "nft_stakes" ADD CONSTRAINT "nft_stakes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staking_rewards" ADD CONSTRAINT "staking_rewards_stake_id_nft_stakes_id_fk" FOREIGN KEY ("stake_id") REFERENCES "public"."nft_stakes"("id") ON DELETE no action ON UPDATE no action;