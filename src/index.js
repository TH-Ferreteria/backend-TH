// src/index.js
import path from 'path'; 
import 'dotenv/config.js'; 
import express from 'express'; 
import db from './config/db.js'; 

import authRoutes from './routes/auth.js'; //  RUTAS DE AUTENTICACIÓN

import configRoutes from './routes/configRoutes.js'; //RUTA DE PRUEBA RUTA PROTEGIDA

import clienteRoutes from './routes/clienteRoutes.js'; // RUTAS DE CLIENTES

import { ensureConsumidorFinalExists } from './utils/initDB.js'; // Asegura que el Consumidor Final existe


// Configuración de Express
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

//  Conecta las rutas de autenticación
app.use('/api/auth', authRoutes);

// RUTA DE CONFIGURACIÓN PROTEGIDA
app.use('/api/config', configRoutes);

// CONEXIÓN DE RUTAS DE CLIENTES
app.use('/api/clientes', clienteRoutes); 

// Ruta de prueba para verificar la conexión a la DB
app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution'); 
        
        res.status(200).json({ 
            message: 'API DTE Ferretería funcionando y DB conectada a Aiven.',
            dbStatus: 'OK',
            dbResult: rows[0].solution
        });
    } catch (error) {
        console.error('Error de conexión o consulta a la DB:', error);
        res.status(500).json({ 
            message: 'API funcionando, pero la DB no está accesible.',
            error: error.message
        });
    }
});

// Levantar el servidor y la inicialización de la DB
const startServer = async () => {
    try {
        // 1. Ejecutar la inicialización antes de empezar a recibir peticiones
        await ensureConsumidorFinalExists(); 

        // 2. Levantar el servidor
        app.listen(port, () => {
            console.log(`Servidor Express escuchando en http://localhost:${port}`);
            console.log(`Usando JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 10)}...`);
        });

    } catch (error) {
        console.error('FATAL ERROR: No se pudo iniciar la aplicación.', error.message);
        process.exit(1); // Detener la aplicación si la inicialización falla
    }
}

startServer(); // Llamar a la función de inicio
