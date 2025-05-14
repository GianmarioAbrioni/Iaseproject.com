/**
 * IASE Project - Bundle ethers.js per Render
 * 
 * Questo file carica ethers.js v5.6 da CDN e lo espone globalmente.
 * Utilizzalo quando non puoi installare ethers.js tramite npm.
 * 
 * Configurazione attuale:
 * - API key Infura: 84ed164327474b4499c085d2e4345a66
 * - NFT Contract: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F
 * - Rewards Contract: 0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F
 * 
 * Script già pronti e configurati con tutti i dati reali.
 * Non è necessaria alcuna configurazione aggiuntiva.
 */

(function() {
  // Verifica se ethers è già definito
  if (typeof window.ethers !== 'undefined') {
    console.log('✅ ethers.js già caricato, versione:', 
      window.ethers.version || (window.ethers.providers ? '~v5' : window.ethers.BrowserProvider ? '~v6' : 'sconosciuta'));
    return;
  }
  
  console.log('🔄 Inizializzazione caricamento ethers.js...');
  
  // Elemento script per caricare ethers.js
  var script = document.createElement('script');
  script.src = "https://cdn.ethers.io/lib/ethers-5.6.umd.min.js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-5MfVLv6jk+DFLhvQlEIFcBe4bCPSA7Qu1W+MoUAM0XrL2BX7OD0EAbaQ/P9kPDSk";
  
  // Gestione eventi
  script.onload = function() {
    console.log('✅ ethers.js v5.6 caricato con successo');
    
    // Notifica il sistema che ethers.js è pronto
    document.dispatchEvent(new CustomEvent('ethers:ready', {
      detail: { version: window.ethers.version || '5.6' }
    }));
  };
  
  script.onerror = function(error) {
    console.error('❌ Errore caricamento ethers.js:', error);
    
    // Prova fallback senza SRI se il caricamento iniziale fallisce
    console.log('⚠️ Tentativo di caricamento fallback...');
    var fallbackScript = document.createElement('script');
    fallbackScript.src = "https://cdn.jsdelivr.net/npm/ethers@5.6.9/dist/ethers.umd.min.js";
    fallbackScript.crossOrigin = "anonymous";
    
    fallbackScript.onload = function() {
      console.log('✅ ethers.js v5.6 caricato con successo (fallback)');
      
      document.dispatchEvent(new CustomEvent('ethers:ready', {
        detail: { version: window.ethers.version || '5.6 (fallback)' }
      }));
    };
    
    fallbackScript.onerror = function() {
      console.error('❌ Errore critico: Impossibile caricare ethers.js da nessuna fonte');
      
      document.dispatchEvent(new CustomEvent('ethers:failed'));
    };
    
    document.head.appendChild(fallbackScript);
  };
  
  // Aggiungi lo script alla pagina
  document.head.appendChild(script);
})();