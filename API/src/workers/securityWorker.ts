import pool from '../config/database.ts';

async function hasTable(connection: any, tableName: string): Promise<boolean> {
    const [rows]: any = await connection.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
         LIMIT 1`,
        [tableName]
    );
    return rows.length > 0;
}

async function hasColumn(connection: any, tableName: string, columnName: string): Promise<boolean> {
    const [rows]: any = await connection.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );
    return rows.length > 0;
}

async function executeSecurityAuditSweep(): Promise<void> {
    console.log('[Security Worker] Initializing automated database protection sweep...');
    let connection;

    try {
        connection = await pool.getConnection();        
        await connection.beginTransaction();

        const canRevokeSessions = await hasTable(connection, 'staff_sessions');
        if (canRevokeSessions) {
            const revokeExpiredSessionsQuery = `
                UPDATE \`staff_sessions\`
                SET \`is_active\` = 0
                WHERE \`is_active\` = 1 
                  AND \`last_accessed_at\` < NOW() - INTERVAL 12 HOUR;
            `;
            const [sessionResult]: any = await connection.execute(revokeExpiredSessionsQuery);
            if (sessionResult.affectedRows > 0) {
                console.warn(`[Security Worker] ALERT: Revoked ${sessionResult.affectedRows} idle or orphaned security tokens.`);
            }
        }

        const canFlagSecurityStatus = await hasColumn(connection, 'staff_users', 'security_status');
        if (canFlagSecurityStatus) {
            const flagAnomaliesQuery = `
                UPDATE \`staff_users\`
                SET \`security_status\` = 'FLAGGED_FOR_REVIEW'
                WHERE \`id\` IN (
                    SELECT \`created_by_staff_id\`
                    FROM \`children_profiles\`
                    WHERE \`created_at\` > NOW() - INTERVAL 1 HOUR
                    GROUP BY \`created_by_staff_id\`
                    HAVING COUNT(DISTINCT \`primary_location_id\`) > 3
                );
            `;
            const [anomalyResult]: any = await connection.execute(flagAnomaliesQuery);
            if (anomalyResult.affectedRows > 0) {
                console.error(`[Security Worker] CRITICAL: Flagged ${anomalyResult.affectedRows} accounts exhibiting anomalous geometric velocity.`);
            }
        }

        await connection.commit();
        console.log('[Security Worker] Security protection sweep concluded successfully.');

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('[Security Worker] Critical Exception triggered during security sweep:', error.message);
    } finally {
        if (connection) connection.release();
    }
}

export function startSecurityHelperThread(): void {
    executeSecurityAuditSweep();

    const THIRTY_MINUTES = 30 * 60 * 1000;
    setInterval(async () => {
        await executeSecurityAuditSweep();
    }, THIRTY_MINUTES);
}
