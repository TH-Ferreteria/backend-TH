// src/index.js
import path from 'path'; 
import 'dotenv/config.js'; 
import express from 'express'; 
import db from './config/db.js'; 

import authRoutes from './routes/auth.js'; //  RUTAS DE AUTENTICACIÓN

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

//  Conecta las rutas de autenticación
app.use('/api/auth', authRoutes);

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

app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
    console.log(`Usando JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 10)}...`);
});