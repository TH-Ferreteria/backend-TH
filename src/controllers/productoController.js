// src/controllers/productoController.js
import db from '../config/db.js';

// ----------------------------------------------------
// [GET] Listar Todos los Productos
// ----------------------------------------------------
export const getProductos = async (req, res) => {
    try {
        // Ordenar por código interno para facilitar la búsqueda
        const sql = 'SELECT * FROM productos ORDER BY codigo_interno ASC';
        const [rows] = await db.query(sql);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ----------------------------------------------------
// [POST] Crear Nuevo Producto
// ----------------------------------------------------
export const createProducto = async (req, res) => {
    const { 
        codigo_interno, nombre, descripcion_corta, marca, categoria, 
        unidad_medida, tipo_venta, iva_porcentaje, precio_unitario, 
        costo_promedio, stock, stock_minimo, ubicacion 
    } = req.body;

    if (!codigo_interno || !nombre || !unidad_medida || !tipo_venta || !precio_unitario) {
        return res.status(400).json({ message: 'Faltan campos obligatorios (código, nombre, unidad, tipo venta, precio).' });
    }

    try {
        const sql = `
            INSERT INTO productos (
                codigo_interno, nombre, descripcion_corta, marca, categoria, 
                unidad_medida, tipo_venta, iva_porcentaje, precio_unitario, 
                costo_promedio, stock, stock_minimo, ubicacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            codigo_interno, nombre, descripcion_corta, marca, categoria, 
            unidad_medida, tipo_venta, iva_porcentaje || 13.00, precio_unitario, 
            costo_promedio || null, stock || 0, stock_minimo || 5, ubicacion
        ]);

        res.status(201).json({ 
            message: 'Producto creado con éxito.', 
            id: result.insertId 
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El código interno (SKU) ya está registrado.' });
        }
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ----------------------------------------------------
// [PUT] Actualizar Producto Existente
// ----------------------------------------------------
export const updateProducto = async (req, res) => {
    const { id } = req.params;
    const { 
        codigo_interno, nombre, descripcion_corta, marca, categoria, 
        unidad_medida, tipo_venta, iva_porcentaje, precio_unitario, 
        costo_promedio, stock, stock_minimo, ubicacion 
    } = req.body;
    
    // Al menos un campo debe estar presente para la actualización
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No se enviaron datos para actualizar.' });
    }

    try {
        const sql = `
            UPDATE productos SET
                codigo_interno = COALESCE(?, codigo_interno),
                nombre = COALESCE(?, nombre),
                descripcion_corta = COALESCE(?, descripcion_corta),
                marca = COALESCE(?, marca),
                categoria = COALESCE(?, categoria),
                unidad_medida = COALESCE(?, unidad_medida),
                tipo_venta = COALESCE(?, tipo_venta),
                iva_porcentaje = COALESCE(?, iva_porcentaje),
                precio_unitario = COALESCE(?, precio_unitario),
                costo_promedio = COALESCE(?, costo_promedio),
                stock = COALESCE(?, stock),
                stock_minimo = COALESCE(?, stock_minimo),
                ubicacion = COALESCE(?, ubicacion)
            WHERE id = ?
        `;
        // Los valores nulos (null) en COALESCE hacen que se mantenga el valor actual
        const [result] = await db.query(sql, [
            codigo_interno, nombre, descripcion_corta, marca, categoria, 
            unidad_medida, tipo_venta, iva_porcentaje, precio_unitario, 
            costo_promedio, stock, stock_minimo, ubicacion, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no se hicieron cambios.' });
        }

        res.status(200).json({ message: 'Producto actualizado con éxito.' });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};