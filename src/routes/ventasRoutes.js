// src/routes/ventasRoutes.js
import { Router } from 'express';
import { emitirDTE } from '../controllers/ventasController.js';
import { protect } from '../middleware/authMiddleware.js'; // Importa middleware de protección JWT

const router = Router();

// Ruta protegida para enviar una nueva venta y emitir el DTE
// Usa el middleware 'protect' para asegurar que solo usuarios autenticados puedan acceder.
router.post('/', protect, emitirDTE);

export default router;