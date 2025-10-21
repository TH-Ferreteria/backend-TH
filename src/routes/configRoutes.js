// src/routes/configRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// ----------------------------------------------------
// RUTA PROTEGIDA DE PRUEBA
// ----------------------------------------------------

// 1. Solo un usuario autenticado (con JWT válido) puede acceder.
router.get(
    '/status', 
    protect, // Aplica el middleware de verificación JWT
    (req, res) => {
        // Si llega aquí, significa que el JWT es válido.
        res.status(200).json({
            message: 'Acceso PROTEGIDO EXITOSO.',
            // Muestra quién hizo la petición (datos inyectados por el middleware 'protect')
            user: req.user 
        });
    }
);


// 2. Ruta protegida SOLO para el rol ADMIN
router.post(
    '/settings', 
    protect,              // Debe estar autenticado
    restrictTo(['ADMIN']), // El rol debe ser 'ADMIN'
    (req, res) => {
        // En esta ruta se implementará el guardado de la configuración DTE
        res.status(200).json({ 
            message: 'Ruta solo para administradores. Listo para guardar configuración DTE.',
            user: req.user
        });
    }
);

export default router;