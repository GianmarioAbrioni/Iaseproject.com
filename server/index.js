import express from 'express';
import { registerRoutes } from './server/routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registra le rotte
registerRoutes(app);

// Porta del server Express
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server IASE attivo sulla porta ${PORT}`);
});