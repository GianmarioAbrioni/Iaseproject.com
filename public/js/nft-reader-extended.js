/**
 * IASE NFT Reader Extended - Versione ottimizzata per Render
 * Adattatore che combina l'approccio ERC721Enumerable e Transfer events
 * 
 * Versione 1.0.0 - 2025-05-15
 * - Tenta prima con tokenOfOwnerByIndex (ERC721Enumerable)
 * - Fallback automatico a eventi Transfer se il contratto non è Enumerable
 * - Completamente compatibile con l'interfaccia esistente
 * - Zero impatto sul funzionamento esistente
 */

// Importa le funzioni originali come base
import { getUserNFTs as getUserNFTsOriginal, 
         getNFTMetadata, 
         loadAllIASENFTs as loadAllIASENFTsOriginal } from './nftReader.js';

// Importa le funzioni basate su eventi Transfer come fallback
import { getUserNFTsViaTransfer, 
         loadAllIASENFTsViaTransfer } from './nft-transfer-reader.js';

/**
 * Legge gli NFT posseduti da un indirizzo wallet
 * Tenta prima con tokenOfOwnerByIndex e fallback a Transfer events
 * @returns {Promise<{address: string, balance: string, nftIds: string[]}>}
 */
export async function getUserNFTs() {
  try {
    console.log("🔍 Initializing NFT reading with auto-fallback...");
    
    // Tenta prima il metodo originale
    const originalResult = await getUserNFTsOriginal();
    
    // Se il metodo originale ha funzionato e ha trovato NFT, usa quello
    if (originalResult && originalResult.nftIds && originalResult.nftIds.length > 0) {
      console.log(`✅ Original Enumerable method successful: found ${originalResult.nftIds.length} NFTs`);
      return originalResult;
    }
    
    // Se il metodo originale non ha trovato NFT, potrebbe essere perché:
    // 1. L'utente non ha NFT (originalResult.balance === "0")
    // 2. Il contratto non implementa ERC721Enumerable (originalResult.balance > 0 ma nftIds è vuoto o null)
    
    // Verifica se il risultato originale indica che l'utente ha NFT ma non li vediamo
    if (originalResult && 
        originalResult.balance && 
        originalResult.balance !== "0" && 
        (!originalResult.nftIds || originalResult.nftIds.length === 0)) {
      
      console.log("⚠️ User has NFTs but Enumerable method failed to list them");
      console.log("🔄 Fallback to Transfer events method...");
      
      // Fallback al metodo con eventi Transfer
      const transferResult = await getUserNFTsViaTransfer();
      
      if (transferResult && transferResult.nftIds && transferResult.nftIds.length > 0) {
        console.log(`✅ Transfer events method successful: found ${transferResult.nftIds.length} NFTs`);
        return transferResult;
      }
    }
    
    // Restituisci il risultato originale in ogni caso, anche se vuoto
    // Questo mantiene la compatibilità con il sistema originale
    return originalResult;
  } catch (error) {
    console.error("❌ Error in getUserNFTs with auto-fallback:", error);
    
    // In caso di errore nel metodo originale, tenta con Transfer events
    try {
      console.log("🔄 Error in original method, trying Transfer events method...");
      return await getUserNFTsViaTransfer();
    } catch (fallbackError) {
      console.error("❌ Both methods failed:", fallbackError);
      return null;
    }
  }
}

// Re-export getNFTMetadata directly since it doesn't depend on ERC721Enumerable
export { getNFTMetadata };

/**
 * Carica tutti gli NFT IASE dal wallet e ne recupera i metadati
 * Versione con fallback automatico
 * @returns {Promise<Array>} - Array di oggetti NFT con tutti i dettagli
 */
export async function loadAllIASENFTs() {
  try {
    console.log("🔄 Starting IASE NFT loading with auto-fallback...");
    
    // Tenta prima il metodo originale
    const originalResult = await loadAllIASENFTsOriginal();
    
    // Se ha trovato NFT, usa quello
    if (originalResult && originalResult.length > 0) {
      console.log(`✅ Original Enumerable method successful: loaded ${originalResult.length} NFTs with metadata`);
      return originalResult;
    }
    
    // Se no, prova con Transfer events
    console.log("⚠️ Original method didn't find NFTs, trying Transfer events method...");
    const transferResult = await loadAllIASENFTsViaTransfer();
    
    if (transferResult && transferResult.length > 0) {
      console.log(`✅ Transfer events method successful: loaded ${transferResult.length} NFTs with metadata`);
      return transferResult;
    }
    
    // Se nessuno dei due ha trovato NFT, restituisci il risultato originale (vuoto)
    console.log("📢 No NFTs found with either method");
    return originalResult;
  } catch (error) {
    console.error("❌ Error in loadAllIASENFTs with auto-fallback:", error);
    
    // In caso di errore nel metodo originale, tenta con Transfer events
    try {
      console.log("🔄 Error in original method, trying Transfer events method...");
      return await loadAllIASENFTsViaTransfer();
    } catch (fallbackError) {
      console.error("❌ Both methods failed:", fallbackError);
      return [];
    }
  }
}