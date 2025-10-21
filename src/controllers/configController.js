// src/controllers/configController.js
import db from '../config/db.js';

/**
 * 1. Obtener la Configuración DTE (GET)
 * Solo debe haber una fila con toda la información.
 */
export const getConfiguracionDTE = async (req, res) => {
    try {
        const sql = 'SELECT * FROM configuracion_dte LIMIT 1';
        const [rows] = await db.query(sql);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay configuración DTE registrada.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener la configuración DTE:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


/**
 * 2. Crear o Actualizar la Configuración DTE (POST/PUT)
 * Si ya existe, la actualiza. Si no existe, la crea.
 */
export const saveOrUpdateConfiguracionDTE = async (req, res) => {
    // Importante: Solo un ADMIN puede modificar esto.
    
    // Extraer todos los campos requeridos de la tabla configuracion_dte
    const { 
        nit_emisor, 
        nrc_emisor, 
        nombre_emisor, 
        correo_emisor, 
        api_url_base, 
        token_api_mh, 
        certificado_path,
        sucursal_codigo,
        punto_venta_codigo
    } = req.body;

    // Validación básica
    if (!nit_emisor || !nrc_emisor || !nombre_emisor || !api_url_base) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para la configuración (NIT, NRC, Nombre, API URL Base).' });
    }
    
    try {
        // A. Verificar si ya existe una fila de configuración
        const [existing] = await db.query('SELECT id FROM configuracion_dte LIMIT 1');
        
        if (existing.length > 0) {
            // B. Si existe (UPDATE)
            const id = existing[0].id;
            const updateSql = `
                UPDATE configuracion_dte SET 
                    nit_emisor = ?, nrc_emisor = ?, nombre_emisor = ?, correo_emisor = ?,
                    api_url_base = ?, token_api_mh = ?, certificado_path = ?,
                    sucursal_codigo = ?, punto_venta_codigo = ?
                WHERE id = ?
            `;
            await db.query(updateSql, [
                nit_emisor, nrc_emisor, nombre_emisor, correo_emisor, api_url_base,
                token_api_mh, certificado_path, sucursal_codigo, punto_venta_codigo, id
            ]);

            return res.status(200).json({ 
                message: 'Configuración DTE actualizada con éxito.', 
                id: id 
            });

        } else {
            // C. Si no existe (INSERT)
            const insertSql = `
                INSERT INTO configuracion_dte 
                (nit_emisor, nrc_emisor, nombre_emisor, correo_emisor, api_url_base, token_api_mh, certificado_path, sucursal_codigo, punto_venta_codigo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(insertSql, [
                nit_emisor, nrc_emisor, nombre_emisor, correo_emisor, api_url_base,
                token_api_mh, certificado_path, sucursal_codigo, punto_venta_codigo
            ]);

            return res.status(201).json({ 
                message: 'Configuración DTE creada con éxito.', 
                id: result.insertId 
            });
        }
    } catch (error) {
        console.error('Error al guardar/actualizar la configuración DTE:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la configuración.' });
    }
};