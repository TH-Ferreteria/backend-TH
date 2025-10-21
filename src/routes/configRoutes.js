// src/routes/configRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

import { 
    getConfiguracionDTE, 
    saveOrUpdateConfiguracionDTE 
} from '../controllers/configController.js'; // Importar las nuevas funciones

const router = express.Router();


// ------------------------------------------------------------------
// RUTAS DE CONFIGURACIÓN DTE (Necesitan ser ADMIN)
// ------------------------------------------------------------------

// [GET] /api/config/dte
// Obtener la configuración actual. Solo usuarios autenticados.
router.get(
    '/dte', 
    protect, 
    getConfiguracionDTE
);

// [POST] /api/config/dte
// Crear o actualizar la configuración DTE. Solo ADMIN.
router.post(
    '/dte', 
    protect, 
    restrictTo(['ADMIN']), // Solo un ADMIN puede tocar estos datos críticos
    saveOrUpdateConfiguracionDTE
);


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