// src/services/mhAuthService.js
import axios from 'axios';
import querystring from 'querystring';

// Cache para almacenar el token y su expiración
let mhTokenCache = {
    token: null,
    expiresAt: 0, // Timestamp de Unix
};

/**
 * Función para obtener el token de Hacienda. Lo recupera del cache si es válido,
 * o llama a la API del MH para obtener uno nuevo si expiró.
 */
export const getMhAuthToken = async () => {

    const NOW = Date.now();
    // 1. Verificar si el token en caché es todavía válido (damos un margen de 1 minuto)
    if (mhTokenCache.token && mhTokenCache.expiresAt > NOW + (60 * 1000)) {
        console.log(' Usando token MH en caché.');
        return mhTokenCache.token;
    }
    
    // 2. Si no hay token o expiró, solicitar uno nuevo al MH
    console.log(' Token MH expirado o no encontrado. Solicitando uno nuevo...');

    const NIT = process.env.MH_AUTH_USER; 
    const CLAVE_API = process.env.MH_AUTH_PWD;
    const authUrl = process.env.MH_AUTH_URL;

    if (!NIT || !CLAVE_API || !authUrl) {
        throw new Error('Variables de entorno MH_AUTH_USER/PWD o MH_AUTH_URL faltantes.');
    }
    
    try {
        // 1. Crear el cuerpo de la petición en formato x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('user', NIT);
        params.append('pwd', CLAVE_API);

        // 2. Ejecutar la petición con el header explícito
        const response = await axios.post(authUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        const tokenData = response.data;
        
        // 3. Almacenar el nuevo token y su expiración en el caché
        const token = tokenData.access_token;
       //  LÓGICA DE MANEJO DE EXPIRACIÓN (La clave del ajuste)
        // 1. Intentamos leer 'expires' o 'expires_in'.
        let expiresInSeconds = tokenData.expires || tokenData.expires_in;
        
        // 2. Definimos un valor de respaldo (24 horas)
        const EXPIRATION_FALLBACK = 86400; 
        let finalExpiresIn;

        // 3. Verificación de seguridad: si el valor es undefined, nulo, o no es un número válido.
        if (typeof expiresInSeconds === 'undefined' || expiresInSeconds === null || isNaN(parseInt(expiresInSeconds))) {
            finalExpiresIn = EXPIRATION_FALLBACK;
            console.warn(` Campo de expiración no encontrado o inválido. Usando ${EXPIRATION_FALLBACK} segundos por defecto.`);
        } else {
            // Convertimos el valor a entero por si viene como string
            finalExpiresIn = parseInt(expiresInSeconds);
        }

        // 4. Calcular el nuevo tiempo de expiración
        mhTokenCache = {
            token: token,
            // Utilizamos finalExpiresIn, que ahora siempre es un número válido
            expiresAt: NOW + (finalExpiresIn * 1000) 
        };

        console.log(` Nuevo token MH obtenido. Válido por ${finalExpiresIn} segundos.`);
        return token;

    } catch (error) {
        console.error(' Error al obtener token de Hacienda (MH):', error.message);
        // Mostrar la respuesta completa si es un error HTTP
        if (error.response) {
            console.error('MH Response Status:', error.response.status);
            console.error('MH Response Data:', error.response.data);
        }
        throw new Error('Fallo en la autenticación con el Ministerio de Hacienda.');
    }
};