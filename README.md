# IASE Project - Web3 Portal

Portale Web3 ufficiale per IASE Token, progettato per semplificare le interazioni blockchain attraverso tecnologie innovative e interfacce intuitive.

## Caratteristiche

- **Frontend React** con Tailwind CSS e animazioni avanzate
- **Integrazione Web3** per distribuzione token e staking
- **Sistema di verifica NFT** avanzato con analisi dei metadati
- **Calcolo dinamico delle ricompense** basato sui metadati NFT
- **Gestione database flessibile** (memoria o PostgreSQL)
- **Supporto multilingua** e design responsive
- **Configurazione per deployment** compatibile con Render
- **Gestione sessioni avanzata**

## Modalità di Storage

L'applicazione supporta due modalità di storage:

1. **PostgreSQL** (database standard)
2. **In-Memory con persistenza file** (nessun database richiesto)

Il sistema in memoria salva automaticamente i dati su file e li ripristina al riavvio, garantendo persistenza anche senza database.

### Utilizzo modalità Memory-Only

Per avviare l'applicazione senza necessità di PostgreSQL:

```bash
# Avvio in modalità memoria
node server.js
```

Oppure impostando l'ambiente:

```bash
USE_MEMORY_DB=true NODE_ENV=production node -r tsx/register server/index.ts
```

## Smart Contract

- **IASE Token**: `0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE` (BNB Smart Chain)
- **IASE NFT**: `0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F` (Ethereum)
- **Reward Distributor**: `0x38c62fcfb6a6bbce341b41ba6740b07739bf6e1f` (BNB Smart Chain)

## Staking NFT

Il sistema permette lo staking di NFT IASE Units con ricompense basate sulla rarità:

- **Standard**: 1x (33.33 IASE/giorno)
- **Advanced**: 1.5x (50 IASE/giorno)
- **Elite**: 2x (66.66 IASE/giorno)
- **Prototype**: 2.5x (83.33 IASE/giorno)

## Deployment su Render

La configurazione in `render.yaml` è ottimizzata per deployment senza database.