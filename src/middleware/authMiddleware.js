// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar si el usuario está autenticado (tiene un JWT válido)
 * y adjuntar los datos del usuario (id, rol) al objeto de petición (req).
 */
export const protect = async (req, res, next) => {
    let token;

    // 1. Verificar si el token existe en la cabecera 'Authorization'
    // El formato esperado es: 'Bearer <TOKEN_JWT>'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extraer solo el token de la cadena 'Bearer <TOKEN>'
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar y Decodificar el Token
            // jwt.verify usa el JWT_SECRET de tu .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Adjuntar datos del usuario (id, rol) a la petición
            // Esto es crucial para saber qué usuario está haciendo la solicitud.
            req.user = {
                id: decoded.id,
                rol: decoded.rol
            };

            // 4. Continuar al siguiente middleware o a la ruta principal
            next();

        } catch (error) {
            console.error('Error de verificación de token:', error.message);
            // El token es inválido, expiró o fue manipulado.
            return res.status(401).json({ message: 'No autorizado, token fallido o expirado.' });
        }
    }

    // Si no hay token en la cabecera
    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no se encontró token.' });
    }
};

/**
 * Middleware para restringir el acceso basado en el rol del usuario (Ej: solo ADMIN).
 * @param {string[]} roles Array de roles permitidos (Ej: ['ADMIN', 'OPERADOR'])
 */
export const restrictTo = (roles) => {
    return (req, res, next) => {
        // req.user.rol ya fue establecido por el middleware 'protect'
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: 'Acceso denegado. No tiene permisos suficientes para esta acción.' 
            });
        }
        next();
    };
};