// src/routes/productoRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    getProductos, 
    createProducto, 
    updateProducto 
} from '../controllers/productoController.js';

const router = express.Router();

// ----------------------------------------------------
// Rutas de Inventario (Productos)
// ----------------------------------------------------

// GET /api/productos: Obtener todos los productos (Acceso para ADMIN y OPERADOR)
router.get(
    '/', 
    protect, 
    getProductos
);

// POST /api/productos: Crear un nuevo producto (Solo ADMIN)
router.post(
    '/', 
    protect, 
    restrictTo(['ADMIN']), 
    createProducto
);

// PUT /api/productos/:id: Actualizar producto (Solo ADMIN)
router.put(
    '/:id', 
    protect, 
    restrictTo(['ADMIN']), 
    updateProducto
);

export default router;