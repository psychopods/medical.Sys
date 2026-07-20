import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.USER_ROOT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Log connection-level errors gracefully to prevent uncaught exceptions from crashing the server
pool.on('connection', (connection) => {
    connection.on('error', (err: any) => {
        console.error('MySQL Pool Connection Error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.warn('MySQL Database connection was closed. Attempting reconnect...');
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('MySQL Database has too many connections.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('MySQL Database connection was refused.');
        }
    });
});

export default pool;