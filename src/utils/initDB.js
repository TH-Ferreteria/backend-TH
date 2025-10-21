// src/utils/initDB.js
import db from '../config/db.js';

/**
 * Asegura que el registro de 'CONSUMIDOR FINAL' exista en la tabla clientes.
 * Este cliente es obligatorio para emitir Facturas de Consumidor Final (DTE tipo 01).
 * @returns {number} El ID del cliente genérico.
 */
export const ensureConsumidorFinalExists = async () => {
    try {
        const nombreGenerico = 'CONSUMIDOR FINAL';

        // 1. Intentar buscar el cliente genérico por nombre
        const [existing] = await db.query(
            'SELECT id FROM clientes WHERE nombre_receptor = ? LIMIT 1', 
            [nombreGenerico]
        );

        if (existing.length > 0) {
            console.log(` Cliente genérico (ID: ${existing[0].id}) ya existe.`);
            return existing[0].id;
        }

        // 2. Si no existe, crearlo
        const sql = `
            INSERT INTO clientes (
                nombre_receptor, clasificacion_fiscal, tipo_documento_receptor, numero_documento_receptor
            ) VALUES (?, ?, 'CUI', '00000000')
        `;
        const [result] = await db.query(sql, [
            nombreGenerico, 
            'CONSUMIDOR_FINAL'
        ]);

        console.log(` Cliente genérico creado con ID: ${result.insertId}.`);
        return result.insertId;

    } catch (error) {
        console.error(' Error al asegurar la existencia del Consumidor Final:', error);
        // En un fallo crítico, lanzamos el error para detener la aplicación
        throw new Error('No se pudo inicializar la base de datos: Cliente Consumidor Final');
    }
};