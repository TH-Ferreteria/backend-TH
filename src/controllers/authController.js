// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js'; // Módulo db.js con mysql2

// Genera un token JWT para un usuario
const generateToken = (userId, userRole) => {
    // JWT_SECRET viene del archivo .env
    return jwt.sign(
        { id: userId, rol: userRole }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' } // El token expira en 1 día
    );
};

// ----------------------------------------------------
// 1. REGISTRO DE USUARIO: POST /api/auth/register
// ----------------------------------------------------
export const registerUser = async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    
    //  Validación simple (debería ser más robusta)
    if (!email || !password || !nombre || !rol) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // 1. Generar Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 2. Insertar en la base de datos
        const sql = 'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)';
        // La sintaxis de mysql2 retorna [results, fields]
        const [result] = await db.query(sql, [nombre, email, password_hash, rol]);

        // 3. Generar JWT para iniciar sesión inmediatamente
        const token = generateToken(result.insertId, rol);

        res.status(201).json({ 
            message: 'Usuario registrado con éxito.', 
            token: token,
            userId: result.insertId 
        });

    } catch (error) {
        // Error 1062 es duplicado (email ya existe) en MySQL
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ----------------------------------------------------
// 2. LOGIN DE USUARIO: POST /api/auth/login
// ----------------------------------------------------
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar el usuario por email
        const sql = 'SELECT id, password_hash, rol FROM usuarios WHERE email = ?';
        const [rows] = await db.query(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = rows[0];

        // 2. Comparar la contraseña ingresada con el hash guardado
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Generar y devolver el JWT
        const token = generateToken(user.id, user.rol);

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            rol: user.rol 
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};