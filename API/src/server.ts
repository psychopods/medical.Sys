import app from './app.ts';
import pool from './config/database.ts';

const PORT = process.env.PORT;

async function bootstrap() {
    try {
        const connection = await pool.getConnection();
        console.log('Connection Pool initialized.');
        connection.release();

        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Critical system failure during database initialization:', error);
        process.exit(1);
    }
}

bootstrap();
