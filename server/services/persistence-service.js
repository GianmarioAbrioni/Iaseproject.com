/**
 * IASE Project - Persistence Service
 * 
 * Questo servizio gestisce il salvataggio e caricamento dei dati in memoria
 * in/da un file JSON per garantire persistenza tra i riavvii dell'applicazione.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ottieni il percorso del file di dati
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'memory-store.json');

// Intervallo di salvataggio automatico (in millisecondi)
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minuti

/**
 * Servizio di persistenza dati su file
 */
export class PersistenceService {
  constructor(memoryDb) {
    this.memoryDb = memoryDb;
    this.lastSaveTime = Date.now();
    this.saveInterval = null;
    
    // Assicura che la directory dei dati esista
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log(`📁 Directory dati creata: ${DATA_DIR}`);
      } catch (error) {
        console.error(`❌ Errore nella creazione della directory dati: ${error.message}`);
      }
    }
  }
  
  /**
   * Inizializza il servizio di persistenza
   */
  init() {
    // Prova a caricare i dati all'avvio
    this.loadData();
    
    // Configura il salvataggio automatico periodico
    this.saveInterval = setInterval(() => {
      this.saveData();
    }, SAVE_INTERVAL);
    
    // Configura salvataggio su uscita dell'app
    process.on('SIGINT', () => {
      console.log('📥 Salvataggio dati prima della chiusura...');
      this.saveData();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('📥 Salvataggio dati prima della chiusura...');
      this.saveData();
      process.exit(0);
    });
    
    console.log(`🔄 Servizio di persistenza inizializzato (salvataggio ogni ${SAVE_INTERVAL/60000} minuti)`);
    return this;
  }
  
  /**
   * Carica i dati dal file JSON nel database in memoria
   */
  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        console.log(`📂 Caricamento dati da ${DATA_FILE}`);
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Popola il database in memoria con i dati caricati
        if (jsonData.users) this.memoryDb.users = jsonData.users;
        if (jsonData.nftStakes) this.memoryDb.nftStakes = jsonData.nftStakes;
        if (jsonData.stakingRewards) this.memoryDb.stakingRewards = jsonData.stakingRewards;
        if (jsonData.nftTraits) this.memoryDb.nftTraits = jsonData.nftTraits;
        
        // Aggiorna i contatori degli ID
        this.memoryDb.nextIds = jsonData.nextIds || this.memoryDb.nextIds;
        
        console.log(`✅ Dati caricati: ${this.memoryDb.users.length} utenti, ${this.memoryDb.nftStakes.length} stake, ${this.memoryDb.stakingRewards.length} ricompense`);
        return true;
      } else {
        console.log('ℹ️ Nessun file dati esistente, inizializzazione database vuoto');
        return false;
      }
    } catch (error) {
      console.error(`❌ Errore nel caricamento dei dati: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Salva i dati dal database in memoria a un file JSON
   */
  saveData() {
    try {
      // Prepara i dati per il salvataggio
      const dataToSave = {
        users: this.memoryDb.users,
        nftStakes: this.memoryDb.nftStakes,
        stakingRewards: this.memoryDb.stakingRewards,
        nftTraits: this.memoryDb.nftTraits,
        nextIds: this.memoryDb.nextIds,
        lastSaveTime: new Date().toISOString()
      };
      
      // Scrivi i dati su file
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
      this.lastSaveTime = Date.now();
      
      console.log(`💾 Dati salvati in ${DATA_FILE} (${this.memoryDb.users.length} utenti, ${this.memoryDb.nftStakes.length} stake, ${this.memoryDb.stakingRewards.length} ricompense)`);
      return true;
    } catch (error) {
      console.error(`❌ Errore nel salvataggio dei dati: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Forza un salvataggio immediato dei dati
   */
  forceSave() {
    return this.saveData();
  }
  
  /**
   * Pulisce i dati salvati (utile per test)
   */
  clearData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        fs.unlinkSync(DATA_FILE);
        console.log(`🗑️ File dati eliminato: ${DATA_FILE}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Errore nell'eliminazione dei dati: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Arresta il servizio di persistenza
   */
  stop() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      
      // Salvataggio finale
      this.saveData();
      console.log('🛑 Servizio di persistenza arrestato');
    }
  }
}