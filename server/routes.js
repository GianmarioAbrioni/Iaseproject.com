import express from "express";
import { createServer } from "http";
import path from "path";
import bodyParser from "body-parser";
import { pool } from "./db.js";
import { storage } from "./storage.js";
// Importiamo il job di verifica NFT che normalmente viene eseguito dal cron job
import { processStakingRewards } from "./services/staking-job.js";

/**
 * Registra tutte le rotte necessarie per l'API
 * @param app L'applicazione Express
 * @returns L'HTTP server
 */



/**
 * Configura uno scheduler per eseguire la verifica giornaliera a mezzanotte
 */
function scheduleStakingVerification() {
  console.log("⏰ Configurazione scheduler verifica staking giornaliera");
  
  // Calcola il tempo fino alla prossima mezzanotte
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // domani
    0, 0, 0 // mezzanotte (00:00:00)
  );
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  
  console.log(`⏰ Prossima verifica programmata tra ${hoursUntilMidnight} ore (${midnight.toISOString()})`);
  
  // Programma il primo job
  const timer = setTimeout(() => {
    // Esegui la verifica
    console.log("🕛 È mezzanotte! Avvio verifica staking...");
    
    processStakingRewards()
      .then(() => {
        console.log("✅ Verifica staking completata con successo");
        // Rischedula per il giorno successivo
        scheduleStakingVerification();
      })
      .catch(error => {
        console.error("❌ Errore durante la verifica dello staking:", error);
        // Rischedula comunque per il giorno successivo, anche in caso di errore
        scheduleStakingVerification();
      });
      
  }, msUntilMidnight);
  
  return timer;
}

export function registerRoutes(app) {
  console.log("✅ Funzione registerRoutes inizializzata");

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

  // Eliminiamo il prefix check, non è necessario e può causare problemi
  // app.use("/api", (req, res, next) => {
  //   if (!req.path.startsWith("/api")) {
  //     req.url = "/api" + req.url;
  //   }
  //   next();
  // });
        // IMPLEMENTAZIONE DIRETTA DELLE API NECESSARIE PER LO STAKING
        // Nota: Utilizziamo un approccio diretto (senza router) per evitare problemi con i path
        // 1. API per lo staking - /api/stake
        app.post("/api/stake", async (req, res) => {
                try {
                        const { tokenId, address, rarityLevel, dailyReward, stakeDate } =
                                req.body;

                        // Normalizza l'indirizzo per la consistenza
                        const normalizedAddress = address?.toLowerCase() || "";

                        console.log(
                                `🔄 Richiesta di staking ricevuta per NFT #${tokenId} da ${normalizedAddress}`
                        );
                        console.log("📦 Dati staking:", req.body);

                        // Se abbiamo parametri mancanti, restituisci errore
                        if (!tokenId || !address) {
                                return res.status(400).json({
                                        success: false,
                                        error: "Parametri mancanti. tokenId e address sono richiesti.",
                                });
                        }

                        // Determina il tier di rarità per il multiplier corretto
                        let rarityTier = "standard";
                        if (rarityLevel) {
                                // Converti il rarityLevel in un formato compatibile con il database
                                if (rarityLevel.toLowerCase().includes("advanced"))
                                        rarityTier = "advanced";
                                else if (rarityLevel.toLowerCase().includes("elite"))
                                        rarityTier = "elite";
                                else if (rarityLevel.toLowerCase().includes("prototype"))
                                        rarityTier = "prototype";
                        }

                        // Crea un oggetto stake con i dati necessari
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

                        console.log("🔄 Inserimento nel database:", stakeData);

                        // BYPASS COMPLETO: Usiamo direttamente un'interrogazione SQL per salvare nel database
                        const { pool } = await import("./db.js"); // Assuming .js extension for ES modules

console.log("🔍 Dati ricevuti per staking:", JSON.stringify(stakeData, null, 2));
console.log("🧪 Tipi dei dati:");
console.log("walletAddress:", typeof stakeData.walletAddress);
console.log("nftId:", typeof stakeData.nftId);
console.log("rarityMultiplier:", typeof stakeData.rarityMultiplier, stakeData.rarityMultiplier);

                        // Utilizziamo una query SQL nativa con i nomi corretti delle colonne
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

// ✅ Aggiungi questo controllo
if (!result.rows || result.rows.length === 0) {
  console.error("❌ Inserimento fallito: nessuna riga restituita.");
  return res.status(500).json({
    success: false,
    error: "Errore durante il salvataggio dello staking nel database",
    message: "Nessun dato restituito dall'inserimento"
  });
}

                        console.log(
                                "✅ Dati salvati nel database con SQL diretto:",
                                result.rows[0]
                        );
                        
                        // Inizializza record di reward iniziale nella tabella staking_rewards
                        try {
                          // Creiamo un record iniziale di rewards con amount=0
                          const initialReward = {
                            stakeId: result.rows[0].id,
                            amount: 0, // Inizialmente zero, verrà aggiornato dal job di rewards
                          };
                          
                          // Inserimento nella tabella staking_rewards
                          const rewardResult = await pool.query(
                            `INSERT INTO staking_rewards 
                             ("stakeId", "amount", "rewardDate", "claimed") 
                             VALUES ($1, $2, NOW(), false) 
                             RETURNING *`,
                            [initialReward.stakeId, initialReward.amount]
                          );
                          
                          console.log("✅ Record iniziale creato in staking_rewards:", rewardResult.rows[0]);
                        } catch (rewardError) {
                          // Logga l'errore ma non bloccare il flusso principale
                          console.error("⚠️ Errore durante la creazione del record iniziale in staking_rewards:", rewardError);
                        }

                        // Restituisci risposta di successo con i dati salvati
                        res.status(200).json({
                                success: true,
                                message: "Staking registrato con successo nel database",
                                data: {
  id: result.rows[0].id,
  tokenId: stakeData.nftId.split("_")[1], // se vuoi mantenere solo il numero
  address: stakeData.walletAddress,
  rarityLevel,
  rarityTier: stakeData.rarityTier,
  dailyReward: stakeData.dailyReward,
  stakeDate: stakeDate || new Date().toISOString(),
  createdAt: new Date().toISOString()
},
                        });
                } catch (error) {
                        console.error("❌ Errore durante lo staking:", error);

                        // Restituisci errore al client quando il salvataggio fallisce
                        res.status(500).json({
                                success: false,
                                error: "Errore durante il salvataggio dello staking nel database",
                                message: `Database error: ${
                                        error.message || "Unknown database error"
                                }`,
                                details: error,
                        });
                }
        });

        // 2. API per l'unstaking - /api/unstake
        app.post("/api/unstake", async (req, res) => {
                try {
                        const { tokenId, address } = req.body;

                        // Normalizza l'indirizzo per la consistenza
                        const normalizedAddress = address?.toLowerCase() || "";

                        console.log(
                                `Richiesta di unstaking ricevuta per NFT #${tokenId} da ${normalizedAddress}`
                        );
                        console.log("Dati unstaking:", req.body);

                        // Se abbiamo parametri mancanti, restituisci errore
                        if (!tokenId || !address) {
                                return res.status(400).json({
                                        success: false,
                                        error: "Parametri mancanti. tokenId e address sono richiesti.",
                                });
                        }

                        try {
                                // Importa lo storage per aggiornare il database
                                const { storage } = await import("./storage.js"); // Assuming .js extension for ES modules

                                // Cerca lo stake nel database
                                const stakes = await storage.getNftStakesByWallet(
                                        normalizedAddress
                                );

                                // Trova lo stake specifico dell'NFT
                                // I dati ritornati dal database hanno nomi di campo coerenti con il database
                                console.log("Stakes trovati:", JSON.stringify(stakes, null, 2));
                                console.log("TokenId da cercare:", tokenId);
                                
                                const targetStake = stakes.find((stake) => {
                                        // Normalizza i valori di ID per il confronto
                                        const nftIdFromDB = stake.nftId || '';
                                        const searchTokenId = tokenId.toString();
                                        
                                        // Se l'ID nel DB contiene già il prefisso (ETH_)
                                        if (nftIdFromDB.includes('_')) {
                                            // Confronta sia con il valore completo che solo con l'ID numerico
                                            const dbNumericPart = nftIdFromDB.split('_')[1];
                                            return nftIdFromDB.includes(searchTokenId) || 
                                                   dbNumericPart === searchTokenId ||
                                                   nftIdFromDB === `ETH_${searchTokenId}`;
                                        } else {
                                            // Confronto diretto
                                            return nftIdFromDB === searchTokenId || 
                                                   nftIdFromDB.includes(searchTokenId);
                                        }
                                });

                                if (!targetStake) {
                                        return res.status(404).json({
                                                success: false,
                                                error: `Nessuno stake trovato per NFT #${tokenId}`,
                                        });
                                }

                                // Chiama la funzione di unstake sul database
                                const result = await storage.endNftStake(targetStake.id);

                                console.log("✅ NFT unstaked dal database:", result);

                                // Restituisci risposta di successo
                                return res.status(200).json({
                                        success: true,
                                        message: "NFT unstaked con successo",
                                        data: {
                                                id: targetStake.id,
                                                tokenId,
                                                address: normalizedAddress,
                                                unstakeDate: new Date().toISOString(),
                                        },
                                });
                        } catch (dbError) {
                                console.error(
                                        "❌ Errore durante l'unstake dal database:",
                                        dbError
                                );

                                // Restituisci errore
                                return res.status(500).json({
                                        success: false,
                                        error: "Errore durante l'operazione di unstake",
                                        details: dbError.message,
                                });
                        }
                } catch (error) {
                        console.error("Errore durante l'unstaking:", error);
                        res.status(500).json({
                                success: false,
                                error: "Errore durante l'operazione di unstaking",
                        });
                }
        });

        // 3. API per ottenere gli NFT in staking - /api/by-wallet/:address
        app.get("/api/by-wallet/:address", async (req, res) => {
                try {
                        // Ottieni l'indirizzo dal parametro
                        const walletAddress = req.params.address.toLowerCase();
                        console.log(
                                `Endpoint personalizzato: Chiamata a /api/by-wallet/${walletAddress}`
                        );

                        // Cerca gli stake nel database
                        const { storage } = await import("./storage.js"); // Assuming .js extension for ES modules
                        const stakes = await storage.getNftStakesByWallet(walletAddress);

                        // Restituisci i dati con la struttura attesa dai client
                        res.json({ stakes: (stakes || []).map(s => {
  const rawId = s.nftId || s.tokenId || s.id;
  const tokenId = rawId?.includes("_") ? rawId.split("_")[1] : rawId;
  return { tokenId: tokenId?.toString() };
}) });
                } catch (error) {
                        console.error("Errore nell'endpoint personalizzato:", error);
                        res.status(500).json({
                                error: "Errore interno",
                                message:
                                        "Si è verificato un errore durante il recupero degli stake",
                        });
                }
        });

        // 4. Endpoint per gestire le chiamate POST a get-staked-nfts (alternativa a by-wallet)
        app.post("/api/get-staked-nfts", async (req, res) => {
                try {
                        // Ottieni l'indirizzo dal body
                        const walletAddress = req.body.address?.toLowerCase();

                        if (!walletAddress) {
                                return res
                                        .status(400)
                                        .json({ error: "Indirizzo wallet mancante" });
                        }

                        console.log(
                                `Endpoint personalizzato: Chiamata POST a /api/get-staked-nfts per ${walletAddress}`
                        );

                        // Cerca gli stake nel database
                        const { storage } = await import("./storage.js"); // Assuming .js extension for ES modules
                        const stakes = await storage.getNftStakesByWallet(walletAddress);

                        // Restituisci i dati con la struttura attesa dai client
                        res.json({ stakes: stakes || [] });
                } catch (error) {
                        console.error("Errore nell'endpoint personalizzato:", error);
                        res.status(500).json({
                                error: "Errore interno",
                                message:
                                        "Si è verificato un errore durante il recupero degli stake",
                        });
                }
        });

        // 5. API per verificare se un NFT è in staking - /api/check-staked-nft
        app.get("/api/check-staked-nft", async (req, res) => {
                try {
                        // Ottieni i parametri dalla query
                        const tokenId = req.query.token_id;
                        const walletAddress = req.query.wallet_address?.toLowerCase();

                        console.log(`🔍 Verifica se NFT #${tokenId} è in staking per ${walletAddress}`);

                        // Se abbiamo parametri mancanti, restituisci errore
                        if (!tokenId || !walletAddress) {
                                return res.status(400).json({
                                        success: false,
                                        error: "Parametri mancanti. token_id e wallet_address sono richiesti.",
                                });
                        }

                        // Utilizza la nuova funzione specifica per verificare un singolo NFT
                        const { storage } = await import("./storage.js");
                        const stakeStatus = await storage.checkNftStakeByTokenId(tokenId, walletAddress);

                        console.log(`✅ Risultato verifica: NFT #${tokenId} ${stakeStatus.isStaked ? 'è' : 'non è'} in staking`);

                        // Restituisci il risultato con informazioni aggiuntive per debug
                        res.json({
                                success: true,
                                is_staked: stakeStatus.isStaked,
                                stake_info: stakeStatus.isStaked ? {
                                        id: stakeStatus.stakeInfo.id,
                                        token_id: tokenId,
                                        rarity_tier: stakeStatus.stakeInfo.rarityTier,
                                        daily_reward: stakeStatus.stakeInfo.dailyReward,
                                        staking_date: stakeStatus.stakeInfo.startTime || new Date().toISOString(),
                                        active: stakeStatus.stakeInfo.active
                                } : null
                        });
                } catch (error) {
                        console.error("❌ Errore nella verifica dello staking:", error);
                        res.status(500).json({
                                success: false,
                                error: "Errore interno durante la verifica dello staking",
                                message: error.message
                        });
                }
        });

        // Root API endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API server is running",
    timestamp: new Date().toISOString()
  });
});

        // Aggiungi endpoint mark-claimed
        app.post("/api/mark-claimed", async (req, res) => {
          try {
            const { walletAddress, amount } = req.body;
            if (!walletAddress || !amount) {
              return res.status(400).json({
                success: false,
                error: "WalletAddress and amount are required"
              });
            }

            const { storage } = await import("./storage.js");
            await storage.markRewardsAsClaimedByWallet(walletAddress.toLowerCase(), amount);

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

        // Aggiungi endpoint rewards
        app.get("/api/rewards/:walletAddress", async (req, res) => {
          try {
            const walletAddress = req.params.walletAddress.toLowerCase();
            const { storage } = await import("./storage.js");
            const activeStakes = await storage.getActiveNftStakesByWallet(walletAddress);

            const rewards = activeStakes.map(stake => ({
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

        // Logging delle rotte registrate per debug
        console.log("📊 Rotte API registrate:");
        const routes = [];

        app._router.stack.forEach((middleware) => {
                if (middleware.route) {
                        // Route registrate direttamente nell'app
                        const path = middleware.route.path;
                        const methods = Object.keys(middleware.route.methods);
                        routes.push(`${path} [${methods}]`);
                } else if (middleware.name === "router") {
                        // Middleware router
                        middleware.handle.stack.forEach((handler) => {
                                if (handler.route) {
                                        const path = handler.route.path;
                                        const methods = Object.keys(handler.route.methods);
                                        const routerPath =
                                                middleware.regexp
                                                        .toString()
                                                        .match(/^\/\^\\\/([^\\]+)/)?.[1] || "";
                                        routes.push(`${routerPath}${path} [${methods}]`);
                                }
                        });
                }
        });

        // Ordina e stampa le rotte
        routes.sort().forEach((route) => console.log(route));

        // Crea il server HTTP e restituiscilo
        const httpServer = createServer(app);
        return httpServer;
}