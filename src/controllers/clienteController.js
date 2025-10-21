// src/controllers/clienteController.js
import db from '../config/db.js';

// ----------------------------------------------------
// [GET] Listar Todos los Clientes
// ----------------------------------------------------
export const getClientes = async (req, res) => {
    try {
        const sql = 'SELECT * FROM clientes ORDER BY nombre_receptor ASC';
        const [rows] = await db.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ----------------------------------------------------
// [POST] Crear Nuevo Cliente
// ----------------------------------------------------
export const createCliente = async (req, res) => {
    const {
        tipo_documento_receptor, numero_documento_receptor, nrc_receptor,
        nombre_receptor, direccion, telefono, correo, clasificacion_fiscal
    } = req.body;

    if (!nombre_receptor || !clasificacion_fiscal) {
        return res.status(400).json({ message: 'Nombre del receptor y clasificación fiscal son obligatorios.' });
    }

    // Validación extra: Si es Contribuyente, requiere NIT o NRC
    if (clasificacion_fiscal === 'CONTRIBUYENTE' && !numero_documento_receptor && !nrc_receptor) {
        return res.status(400).json({ message: 'Para CONTRIBUYENTE, se requiere NIT o NRC.' });
    }

    try {
        const sql = `
            INSERT INTO clientes (
                tipo_documento_receptor, numero_documento_receptor, nrc_receptor,
                nombre_receptor, direccion, telefono, correo, clasificacion_fiscal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            tipo_documento_receptor || null, numero_documento_receptor || null, nrc_receptor || null,
            nombre_receptor, direccion || null, telefono || null, correo || null, clasificacion_fiscal
        ]);

        res.status(201).json({ 
            message: 'Cliente creado con éxito.', 
            id: result.insertId 
        });

    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};