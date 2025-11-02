// src/controllers/ventasController.js
import db from '../config/db.js';
import { getMhAuthToken } from '../services/mhAuthService.js';
import { generateDteJson } from '../utils/dteGenerator.js';
import axios from 'axios';
import { signDTE } from '../services/firmadorService.js';

// URL de RECEPCIÓN DTE (Ambiente de Pruebas)
const RECEPCION_URL = process.env.MH_RECEPCION_URL || "https://apitest.dtes.mh.gob.sv/fesv/recepciondte";

/**
 * 1. Procesar Venta, Emitir DTE, Firmar y Enviar a Hacienda
 */
export const emitirDTE = async (req, res) => {
    // Validación mínima de la estructura de la venta (pedido)
    const { cliente_id, detalles } = req.body;
    if (!cliente_id || !detalles || detalles.length === 0) {
        return res.status(400).json({ message: 'Se requiere cliente_id y detalles de la venta.' });
    }

    let mhToken;
    try {
        // --- PREPARACIÓN DE DATOS ---
        const [configRows] = await db.query('SELECT * FROM configuracion_dte LIMIT 1');
        const [clienteRows] = await db.query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
        
        if (configRows.length === 0 || clienteRows.length === 0) {
            return res.status(400).json({ message: 'Configuración DTE o Cliente no encontrados.' });
        }
        const configuracion = configRows[0];
        const cliente = clienteRows[0];
        
        // 1. Obtener Token de Hacienda (Automático con caché)
        mhToken = await getMhAuthToken();
        
        // 2. Construir el JSON del DTE
        const dteJson = generateDteJson(configuracion, cliente, detalles);
        
        // 3. Serializar y Firmar el DTE
        const dteJsonString = JSON.stringify(dteJson);
        const dteSigned = await signDTE(dteJsonString);


        // 4. Codificar el JSON firmado a Base64 (El MH requiere esto)
        // Nota: El MH a menudo requiere el JSON completo del DTE como un string Base64.
        const dteBase64 = Buffer.from(dteJsonString).toString('base64');
        
        // --- ENVÍO A HACIENDA ---

        // 5. Preparar el Payload final para el MH (versión 3.0)
        const payloadToMh = {
            "ambiente": dteJson.ambiente,
            "idEnvio": String(Date.now()), // ID ÚNICO para esta transacción
            "version": dteJson.version,
            "nit": dteJson.emisor.nit,
            "documento": dteBase64, // El JSON del DTE codificado en Base64
            "claveDte": dteJson.identificacion.codigoGeneracion, // Clave de Generación
            "firma": dteSigned
        };

        // 6. Preparar Headers y Enviar a Hacienda
        const headers = {
            'Authorization': `Bearer ${mhToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const response = await axios.post(RECEPCION_URL, payloadToMh, { headers });

        // --- MANEJO DE RESPUESTA Y DB ---
        
        // 7. Guardar el DTE y su Sello de Recepción (Próximo paso en DB)
        // ... Lógica para guardar la respuesta en 'dte_emitidos' y actualizar 'configuracion_dte' ...

        res.status(200).json({
            message: 'DTE enviado a Hacienda (Pruebas).',
            mh_respuesta: response.data,
            dte_enviado: dteJson
        });

    } catch (error) {
        console.error('Error fatal en el proceso de emisión DTE:', error);
        
        if (error.response) {
            return res.status(500).json({
                message: 'Error al comunicarse con la API de Hacienda.',
                status: error.response.status,
                data: error.response.data
            });
        }
        res.status(500).json({ message: error.message || 'Error interno del servidor.' });
    }
};