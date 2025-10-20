// config/db.js
import mysql from 'mysql2'; // Cambio

// Crear un pool de conexiones
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL, 
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
});

const promisePool = pool.promise();

console.log('✅ Módulo de MySQL configurado y listo.');

export const query = (sql, params) => promisePool.query(sql, params); // Cambio: export individual
export default { query }; // Cambio: export default