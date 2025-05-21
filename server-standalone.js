import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import { storage } from "./storage.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// *** API ENDPOINTS ***

// Staking API
app.post("/api/stake", async (req, res) => {
  try {
    const { tokenId, address, rarityLevel, dailyReward, stakeDate } = req.body;
    const normalizedAddress = address?.toLowerCase() || '';

    if (!tokenId || !address) {
      return res.status(400).json({ 
        success: false,
        error: 'Parametri mancanti. tokenId e address sono richiesti.'
      });
    }

    let rarityTier = "standard";
    if (rarityLevel) {
      if (rarityLevel.toLowerCase().includes("advanced")) rarityTier = "advanced";
      else if (rarityLevel.toLowerCase().includes("elite")) rarityTier = "elite";
      else if (rarityLevel.toLowerCase().includes("prototype")) rarityTier = "prototype";
    }

    const stakeData = {
      walletAddress: normalizedAddress,
      nftId: `ETH_${tokenId}`,
      rarityTier: rarityTier,
      active: true,
      rarityMultiplier:
        rarityTier === "standard" ? 1.0 :
        rarityTier === "advanced" ? 1.5 :
        rarityTier === "elite" ? 2.0 :
        rarityTier === "prototype" ? 2.5 : 1.0,
      dailyReward: 33.33 * (
        rarityTier === "standard" ? 1.0 :
        rarityTier === "advanced" ? 1.5 :
        rarityTier === "elite" ? 2.0 :
        rarityTier === "prototype" ? 2.5 : 1.0
      )
    };

    const { pool } = await import("./db.js");

    const result = await pool.query(
      `INSERT INTO nft_stakes
        ("walletAddress", "nftId", "rarityTier", "active", "dailyReward", "rarityMultiplier", "startTime")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
      [
        stakeData.walletAddress,
        stakeData.nftId,
        stakeData.rarityTier,
        stakeData.active,
        stakeData.dailyReward,
        stakeData.rarityMultiplier
      ]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Errore durante il salvataggio dello staking nel database"
      });
    }

    res.status(200).json({
      success: true,
      message: "Staking registrato con successo",
      data: {
        id: result.rows[0].id,
        tokenId: stakeData.nftId.split("_")[1],
        address: stakeData.walletAddress,
        rarityLevel,
        rarityTier: stakeData.rarityTier,
        dailyReward: stakeData.dailyReward,
        stakeDate: stakeDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Errore durante lo staking:", error);
    res.status(500).json({
      success: false,
      error: "Errore durante il salvataggio dello staking",
      message: error.message
    });
  }
});

// Unstaking API
app.post("/api/unstake", async (req, res) => {
  try {
    const { tokenId, address } = req.body;
    const normalizedAddress = address?.toLowerCase() || '';

    if (!tokenId || !address) {
      return res.status(400).json({ 
        success: false,
        error: 'Parametri mancanti. tokenId e address sono richiesti.'
      });
    }

    const { pool } = await import("./db.js");

    // Find and update the stake
    const result = await pool.query(
      `UPDATE nft_stakes 
       SET active = false, "endTime" = NOW() 
       WHERE "nftId" = $1 AND "walletAddress" = $2 AND active = true 
       RETURNING *`,
      [`ETH_${tokenId}`, normalizedAddress]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Nessuno stake attivo trovato per NFT #${tokenId}`
      });
    }

    res.status(200).json({
      success: true,
      message: "NFT unstaked con successo",
      data: {
        id: result.rows[0].id,
        tokenId,
        address: normalizedAddress,
        unstakeDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Errore durante l'unstake:", error);
    res.status(500).json({
      success: false,
      error: "Errore durante l'unstake",
      message: error.message
    });
  }
});

// Get staked NFTs by wallet
app.get("/api/by-wallet/:address", async (req, res) => {
  try {
    const walletAddress = req.params.address.toLowerCase();

    const { pool } = await import("./db.js");
    const result = await pool.query(
      `SELECT * FROM nft_stakes WHERE "walletAddress" = $1 AND active = true`,
      [walletAddress]
    );

    const stakes = result.rows.map(s => {
      const rawId = s.nftId;
      const tokenId = rawId?.includes("_") ? rawId.split("_")[1] : rawId;
      return { tokenId: tokenId?.toString() };
    });

    res.json({ stakes });
  } catch (error) {
    console.error("❌ Errore nel recupero degli stake:", error);
    res.status(500).json({
      error: "Errore interno",
      message: "Errore nel recupero degli stake"
    });
  }
});

// Alternative endpoint for getting staked NFTs
app.post("/api/get-staked-nfts", async (req, res) => {
  try {
    const walletAddress = req.body.address?.toLowerCase();

    if (!walletAddress) {
      return res.status(400).json({ error: "Indirizzo wallet mancante" });
    }

    const { pool } = await import("./db.js");
    const result = await pool.query(
      `SELECT * FROM nft_stakes WHERE "walletAddress" = $1 AND active = true`,
      [walletAddress]
    );

    res.json({ stakes: result.rows || [] });
  } catch (error) {
    console.error("❌ Errore nel recupero degli stake:", error);
    res.status(500).json({
      error: "Errore interno",
      message: "Errore nel recupero degli stake"
    });
  }
});

// Check if NFT is staked
app.get("/api/check-staked-nft", async (req, res) => {
  try {
    const { tokenId } = req.query;
    if (!tokenId) {
      return res.status(400).json({
        success: false,
        error: "TokenId is required"
      });
    }

    const { pool } = await import("./db.js");
    const result = await pool.query(
      `SELECT * FROM nft_stakes WHERE "nftId" = $1 AND active = true`,
      [`ETH_${tokenId}`]
    );

    res.json({
      success: true,
      isStaked: result.rows.length > 0,
      stakeInfo: result.rows[0] || null
    });
  } catch (error) {
    console.error("❌ Error checking staked NFT:", error);
    res.status(500).json({
      success: false,
      error: "Error checking staked NFT",
      message: error.message
    });
  }
});

// Get rewards for wallet
app.get("/api/rewards/:walletAddress", async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const { pool } = await import("./db.js");
    const result = await pool.query(
      `SELECT * FROM nft_stakes WHERE "walletAddress" = $1 AND active = true`,
      [walletAddress]
    );

    const rewards = result.rows.map(stake => ({
      nftId: stake.nftId,
      dailyReward: stake.dailyReward,
      totalReward: stake.dailyReward * Math.floor((Date.now() - new Date(stake.startTime).getTime()) / (24 * 60 * 60 * 1000))
    }));

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error("❌ Error getting rewards:", error);
    res.status(500).json({
      success: false,
      error: "Error getting rewards",
      message: error.message
    });
  }
});

// Mark rewards as claimed
app.post("/api/mark-claimed", async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    if (!walletAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: "WalletAddress and amount are required"
      });
    }

    const { pool } = await import("./db.js");
    await pool.query(
      `INSERT INTO reward_claims ("walletAddress", amount, "claimTime") VALUES ($1, $2, NOW())`,
      [walletAddress.toLowerCase(), amount]
    );

    res.json({
      success: true,
      message: "Rewards marked as claimed"
    });
  } catch (error) {
    console.error("❌ Error marking rewards as claimed:", error);
    res.status(500).json({
      success: false,
      error: "Error marking rewards as claimed", 
      message: error.message
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server standalone avviato sulla porta ${PORT}`);
  console.log(`📦 Modalità storage: PostgreSQL`);
});

export default server;