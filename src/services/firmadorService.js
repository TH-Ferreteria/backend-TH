// src/services/firmadorService.js 
import axios from 'axios';

// La URL de firma es FIJA y local.
const FIRMADOR_URL = process.env.LOCAL_FIRMADOR_URL || "http://localhost:8113/firmardocumento"; 

/**
 * Llama al servicio de firma DTE local para firmar el JSON.
 *
 * @param {string} dteJsonString El JSON del DTE serializado (en formato string).
 * @returns {string} La firma digital en formato Base64 devuelta por el servicio.
 */
export const signDTE = async (dteJsonString) => { 
    
    // Necesitamos la contraseña del certificado, la obtendremos del entorno.
    const certPassword = process.env.MH_CERT_PASSWORD; 

    if (!certPassword) {
        throw new Error('Contraseña del certificado MH_CERT_PASSWORD no definida en .env.');
    }
    
    // El servicio del MH espera el JSON completo y la contraseña en el cuerpo
    const payloadToLocalSigner = {
        documento: dteJsonString, 
        password: certPassword 
    };

    try {
        const response = await axios.post(FIRMADOR_URL, payloadToLocalSigner);

        // ASUMIENDO la respuesta estándar del firmador del MH, que es el DTE sellado.
        const dteSellado = response.data;
        
        // La firma Base64 que necesita la API de Hacienda está dentro del objeto sellado.
        const firmaBase64 = dteSellado.firma || dteSellado.SignatureValue; 
        
        if (!firmaBase64) {
             throw new Error("El servicio de firma no devolvió el campo 'firma' o es inválido.");
        }
        
        return firmaBase64;

    } catch (error) {
        console.error('Error al llamar al servicio de firma local:', error.message);
        // El servicio de firma podría devolver un error 500 con un mensaje JSON en error.response.data
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(`Error en el firmador: ${error.response.data.message}`);
        }
        throw new Error(`Fallo en la firma externa. URL: ${FIRMADOR_URL}. Revise el servicio WinSW.`);
    }
};

