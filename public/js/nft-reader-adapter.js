/**
 * IASE NFT Reader Adapter
 * Questo script funge da ponte tra il modulo ES6 nftReader.js
 * e il codice non-modulo nella pagina HTML.
 */
import { getUserNFTs, getNFTMetadata, loadAllIASENFTs } from './nftReader.js';

// Espone le funzioni al global scope
window.getUserNFTs = getUserNFTs;
window.getNFTMetadata = getNFTMetadata;
window.loadAllIASENFTs = loadAllIASENFTs;

// Aggiunge un evento per notificare che il reader è pronto
document.dispatchEvent(new CustomEvent('nftreader:ready'));

console.log('✅ NFT Reader Adapter caricato e funzioni esposte in window');