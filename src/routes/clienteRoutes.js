// src/routes/clienteRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js'; // Los operadores y administradores pueden ver clientes
import { getClientes, createCliente } from '../controllers/clienteController.js';

const router = express.Router();

// ----------------------------------------------------
// Rutas de Clientes
// ----------------------------------------------------

// GET /api/clientes: Listar clientes
router.get(
    '/', 
    protect, 
    getClientes
);

// POST /api/clientes: Crear nuevo cliente
router.post(
    '/', 
    protect, 
    createCliente
);

export default router;