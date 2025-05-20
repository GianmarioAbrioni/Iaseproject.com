import { Router } from 'express';
import { createServer } from 'http';
import path from 'path';
import express from 'express';
import stakingRoutes from './routes.js'; // Assuming .js extension for ES modules

// Esporta la funzione registerRoutes usata in server/index.ts
export function registerRoutes(app) {
  // Registra le routes di staking sotto /api/staking
  app.use("/api", stakingRoutes);

  // Endpoint diretto per lo staking (per compatibilità)
  app.post("/api/stake", async (req, res) => {
  try {
    const { tokenId, address, rarityLevel, dailyReward, stakeDate } = req.body;

    // Normalizza l'indirizzo per la consistenza
    const normalizedAddress = address?.toLowerCase() || '';

    console.log(`Richiesta di staking ricevuta per NFT #${tokenId} da ${normalizedAddress}`);
    console.log('Dati staking:', req.body);

    // Se abbiamo parametri mancanti, restituisci errore
    if (!tokenId || !address) {
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti. tokenId e address sono richiesti.'
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
      dailyReward: dailyReward || 33.33 * (
        rarityTier === "standard" ? 1.0 :
        rarityTier === "advanced" ? 1.5 :
        rarityTier === "elite" ? 2.0 :
        rarityTier === "prototype" ? 2.5 : 1.0
      )
    };

    console.log("Inserimento nel database:", stakeData);

    // Inserimento nel database usando la storage API
    const { storage } = await import('./storage.js');
    const savedStake = await storage.createNftStake(stakeData);

    if (!savedStake) {
      console.error("❌ Inserimento fallito: nessun dato restituito.");
      return res.status(500).json({
        success: false,
        error: "Errore durante il salvataggio dello staking nel database",
        message: "Nessun dato restituito dall'inserimento"
      });
    }

    console.log("✅ Dati salvati nel database:", savedStake);

    // Restituisci risposta di successo
    res.status(200).json({
      success: true,
      message: 'Staking registrato con successo nel database',
      data: {
        id: savedStake.id,
        tokenId: stakeData.nftId.split("_")[1], // se vuoi mantenere solo il numero
        address: stakeData.walletAddress,
        rarityLevel,
        rarityTier: stakeData.rarityTier,
        dailyReward: stakeData.dailyReward,
        stakeDate: stakeDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Errore durante lo staking:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'operazione di staking'
    });
  }
});
}

// Note: The original TypeScript code exports 'router' but it is not defined in the provided snippet.
// We are preserving the export statement exactly as requested, but 'router' will be undefined.
export default router;