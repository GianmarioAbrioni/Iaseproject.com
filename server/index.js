import express from 'express';
import { registerRoutes } from './routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registra le rotte
registerRoutes(app);

// Porta del server Express (usando 10000 come nel deploy originale)
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server IASE API attivo sulla porta ${PORT}`);
});