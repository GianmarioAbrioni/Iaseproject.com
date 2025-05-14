/**
 * IASE NFT Reader Adapter
 * Questo script funge da ponte tra il modulo ES6 nftReader.js
 * e il codice non-modulo nella pagina HTML.
 * 
 * Versione aggiornata con caricamento dinamico di ethers.js e fallback
 * 
 * Configurato per funzionare automaticamente con:
 * - API key Infura: 84ed164327474b4499c085d2e4345a66
 * - NFT Contract: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F
 * - Rewards Contract: 0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F
 */

// Funzione per caricare dinamicamente ethers.js se non presente
async function ensureEthersLoaded() {
  if (typeof ethers !== 'undefined') {
    console.log('✅ ethers.js già caricato, versione:', 
      ethers.version || (ethers.providers ? '~v5' : ethers.BrowserProvider ? '~v6' : 'sconosciuta'));
    return true;
  }
  
  console.log('⚠️ ethers.js non trovato, tentativo di caricamento dinamico...');
  
  try {
    // Prima prova il caricamento da ethers-bundle.js locale
    if (document.querySelector('script[src*="ethers-bundle.js"]')) {
      console.log('🔍 Individuato ethers-bundle.js, attendo inizializzazione...');
      // Attendi un po' per l'inizializzazione
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (typeof ethers !== 'undefined') {
        console.log('✅ ethers.js caricato da ethers-bundle.js');
        return true;
      }
    }
    
    // Fallback al CDN se necessario
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.ethers.io/lib/ethers-5.6.umd.min.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ ethers.js v5.6 caricato dinamicamente dal CDN");
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Impossibile caricare ethers.js"));
      };
      document.head.appendChild(script);
    });
    return true;
  } catch (error) {
    console.error('❌ Errore caricamento ethers.js:', error);
    return false;
  }
}

// Importa le funzioni dal modulo nftReader.js
import { getUserNFTs, getNFTMetadata, loadAllIASENFTs } from './nftReader.js';

// Wrapper per getUserNFTs con caricamento ethers.js
async function safeGetUserNFTs() {
  if (await ensureEthersLoaded()) {
    return getUserNFTs();
  }
  console.error('❌ Impossibile eseguire getUserNFTs: ethers.js non disponibile');
  return null;
}

// Wrapper per getNFTMetadata con caricamento ethers.js
async function safeGetNFTMetadata(tokenId) {
  if (await ensureEthersLoaded()) {
    return getNFTMetadata(tokenId);
  }
  console.error('❌ Impossibile eseguire getNFTMetadata: ethers.js non disponibile');
  return null;
}

// Wrapper per loadAllIASENFTs con caricamento ethers.js
async function safeLoadAllIASENFTs() {
  if (await ensureEthersLoaded()) {
    return loadAllIASENFTs();
  }
  console.error('❌ Impossibile eseguire loadAllIASENFTs: ethers.js non disponibile');
  return [];
}

// Espone le funzioni wrapped al global scope
window.getUserNFTs = safeGetUserNFTs;
window.getNFTMetadata = safeGetNFTMetadata;
window.loadAllIASENFTs = safeLoadAllIASENFTs;

// Inoltre espone le funzioni originali per accesso diretto
window.nftReader = {
  getUserNFTs,
  getNFTMetadata,
  loadAllIASENFTs,
  ensureEthersLoaded
};

// Inizializza il caricamento di ethers.js all'avvio (non bloccante)
ensureEthersLoaded().then(success => {
  // Aggiunge un evento per notificare che il reader è pronto
  document.dispatchEvent(new CustomEvent('nftreader:ready', {
    detail: { ethersLoaded: success }
  }));
});

console.log('✅ NFT Reader Adapter v2.0 caricato e funzioni esposte in window');