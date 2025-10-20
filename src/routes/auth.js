// routes/auth.js
import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Ruta pública para registrar un nuevo usuario
router.post('/register', registerUser);

// Ruta pública para el inicio de sesión
router.post('/login', loginUser);

export default router;