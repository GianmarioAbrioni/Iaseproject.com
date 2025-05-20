import express from "express";
import { createServer } from "http";
import path from "path";
import claimRouter from "./routes/claim.js"; // Assuming .js extension for ES modules
import bodyParser from "body-parser";

/**
 * Registra tutte le rotte necessarie per l'API
 * Importante: Per deployment su Render, le rotte sono implementate direttamente qui
 * @param app L'applicazione Express
 * @returns L'HTTP server
 */
export function registerRoutes(app) {
        console.log(
                "✅ Funzione registerRoutes inizializzata – Inizio registrazione rotte"
        );
        // Assicurati che Express possa analizzare correttamente i JSON e form data
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // Configura CORS per permettere richieste da tutti i domini
        app.use((req, res, next) => {
                res.header("Access-Control-Allow-Origin", "*");
                res.header(
                        "Access-Control-Allow-Methods",
                        "GET, POST, PUT, DELETE, OPTIONS"
                );
                res.header(
                        "Access-Control-Allow-Headers",
                        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
                );
                next();
        });

        // Log delle richieste per debug
        app.use((req, res, next) => {
                console.log(
                        `📝 [${new Date().toISOString()}] ${req.method} ${req.path}`
                );
                next();
        });

        // IMPORTANTE: Registra le rotte esattamente come nel client
        // Registra la route /api/claim
        app.use("/api/claim", claimRouter);

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
                                const targetStake = stakes.find((stake) => {
                                        // Utilizziamo la sintassi con indice per permettere l'accesso a proprietà dinamiche
                                        return (
                                                stake &&
                                                ((stake["nftId"] &&
                                                        stake["nftId"].includes(tokenId)) ||
                                                        (stake.nftId && stake.nftId.includes(tokenId)))
                                        );
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


