import app from './app.ts';
import pool from './config/database.ts';
import { startSecurityHelperThread } from './workers/securityWorker.ts';

const PORT = process.env.PORT;

async function bootstrap() {
    try {
        const connection = await pool.getConnection();
        console.log('Connection Pool initialized.');
        connection.release();

        // Fire up the Backend-First Security Helper Thread
        startSecurityHelperThread();
        console.log('Backend Security Helper background thread fully armed and active.');

        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Critical system failure during database initialization:', error);
        process.exit(1);
    }
}

bootstrap();
