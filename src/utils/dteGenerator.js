// src/utils/dteGenerator.js
// Esta función construye la estructura JSON completa del DTE-01

const AMBIENTE = "00"; // 00: Pruebas | 01: Producción
const TIPO_DOC_ID = "01"; // DTE-01: Factura de Consumidor Final
const VERSION = 3; // Versión actual del esquema DTE

/**
 * Genera el JSON completo del DTE (Factura de Consumidor Final).
 *
 * @param {object} config La fila de la tabla 'configuracion_dte' de la DB.
 * @param {object} cliente La fila de la tabla 'clientes' de la DB.
 * @param {Array} detalles Los detalles de la venta (productos, cantidades).
 * @returns {object} El objeto JSON del DTE listo para ser serializado y firmado.
 */
export const generateDteJson = (config, cliente, detalles) => {
    
    // --- CÁLCULOS CRÍTICOS: SUMAS, IMPUESTOS, DESCUENTOS ---
    
    let totalExento = 0;
    let totalGravado = 0;
    let totalVenta = 0;
    let totalIva = 0;
    
    const cuerpoDocumento = detalles.map((item, index) => {
        const precioUnitario = item.precio;
        const subTotal = item.cantidad * precioUnitario;
        const ivaPorcentaje = 0.13; // 13% IVA
        const ivaItem = subTotal * ivaPorcentaje;

        totalGravado += subTotal;
        totalIva += ivaItem;
        totalVenta += subTotal + ivaItem;

        return {
            "numItem": index + 1,
            "tipoItem": "01", // 01: Bienes, 02: Servicios
            "codigo": item.codigo_producto,
            "codTributo": "20", // 20: Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA)
            "montoTributo": parseFloat(ivaItem.toFixed(2)),
            "uniMedida": 59, // 59: Unidad
            "cantidad": item.cantidad,
            "descripcion": item.nombre_producto,
            "precioUni": parseFloat(precioUnitario.toFixed(5)),
            "montoSujetoGrav": parseFloat(subTotal.toFixed(2)),
            "montoGravado": parseFloat(subTotal.toFixed(2)), // En DTE-01, este es el valor base antes de IVA
            "ventaNoSuj": 0.00,
            "ventaExenta": 0.00,
            "ventaGravada": parseFloat(subTotal.toFixed(2)),
            "psv": parseFloat((subTotal + ivaItem).toFixed(2)) // Precio sujeto a venta
        };
    });

    const totalPagar = totalVenta; // Simplificado, sin anticipos ni retenciones

    // --- CONSTRUCCIÓN DEL JSON FINAL ---
    const dte = {
        "version": VERSION,
        "ambiente": AMBIENTE,
        
        // 1. Identificación del DTE
        "identificacion": {
            "version": VERSION,
            "ambiente": AMBIENTE,
            "tipoDte": TIPO_DOC_ID, // 01: Factura Consumidor Final
            "numeroControl": config.ult_num_control, // El último número de control de la DB
            "codigoGeneracion": config.ult_cod_generacion, // El último Código de Generación de la DB
            "tipoModelo": 1, // 1: Normal
            "tipoOperacion": 1, // 1: Venta
            "tipoContingencia": null, // null: Sin contingencia
            "fecEmi": new Date().toISOString().slice(0, 10), // Fecha YYYY-MM-DD
            "horEmi": new Date().toTimeString().slice(0, 8), // Hora HH:MM:SS
            "tipoMoneda": "USD"
        },

        // 2. Información del Emisor
        "emisor": {
            "nombre": config.nombre_empresa,
            "nit": config.nit_empresa,
            "nrc": config.nrc_empresa,
            "codEstableMh": config.cod_establecimiento,
            "codPuntoVentaMh": config.cod_punto_venta,
            "telefono": config.telefono_empresa,
            "correo": config.correo_empresa,
            "codActividad": config.cod_actividad_economica,
            "descActividad": config.desc_actividad_economica,
            "direccion": {
                "departamento": config.depto_empresa,
                "municipio": config.municipio_empresa,
                "complemento": config.direccion_complemento
            }
        },

        // 3. Información del Receptor (Consumidor Final o Cliente)
        "receptor": {
            "tipoDocumento": cliente.tipo_doc_identificacion, // Ej: 36 (DUI) o 35 (NIT)
            "numDocumento": cliente.num_doc_identificacion,
            "nrc": cliente.nrc_cliente || null, // No requerido para Consumidor Final
            "nombre": cliente.nombre_cliente,
            "telefono": cliente.telefono_cliente || null,
            "correo": cliente.correo_cliente || null,
            "direccion": {
                "departamento": cliente.depto_cliente,
                "municipio": cliente.municipio_cliente,
                "complemento": cliente.direccion_complemento || "Sin complemento"
            }
        },

        // 4. Cuerpo del Documento (Detalles de la venta)
        "cuerpoDocumento": cuerpoDocumento,

        // 5. Resumen de Totales
        "resumen": {
            "totalNoSuj": 0.00,
            "totalExenta": 0.00,
            "totalGravada": parseFloat(totalGravado.toFixed(2)),
            "subTotalVentas": parseFloat(totalVenta.toFixed(2)), // Suma de Gravadas + Exentas + No Sujetas
            "ivaPerci1": 0.00, // Retenciones (no aplica en FCF)
            "ivaReten1": 0.00, // Retenciones (no aplica en FCF)
            "montoTotalOperacion": parseFloat(totalVenta.toFixed(2)),
            "totalIva": parseFloat(totalIva.toFixed(2)),
            "subTotal": parseFloat(totalVenta.toFixed(2)),
            "totalAPagar": parseFloat(totalPagar.toFixed(2)),
            "condicionOperacion": 1 // 1: Contado
        }
    };

    return dte;
};