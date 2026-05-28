import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type {
    SyncBiometricPayload,
    SyncChildProfilePayload,
    SyncConflict,
    SyncPushRequestBody
} from '../types/sync.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

function decodeBase64ToBuffer(data: string): Buffer {
    const normalized = data.trim();
    if (!normalized) {
        throw new HttpError(400, 'templateBase64 cannot be empty.');
    }
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (!base64Regex.test(normalized)) {
        throw new HttpError(400, 'templateBase64 must be valid Base64 data.');
    }
    const decoded = Buffer.from(normalized, 'base64');
    if (decoded.length === 0) {
        throw new HttpError(400, 'templateBase64 cannot decode to empty bytes.');
    }
    return decoded;
}

function parseSinceTimestamp(since?: string): Date {
    if (!since) {
        return new Date(0);
    }
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, 'Invalid `since` timestamp. Expected ISO-8601 datetime.');
    }
    return parsed;
}

export async function pushSyncBatch(pool: Pool, payload: SyncPushRequestBody): Promise<{ conflicts: SyncConflict[] }> {
    const children = payload.childrenProfiles ?? [];
    const biometrics = payload.biometricFingerprints ?? [];
    const conflicts: SyncConflict[] = [];

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let childIdx = 0;
        for (const child of children) {
            childIdx++;
            const savepointName = `child_savepoint_${childIdx}`;
            await connection.execute(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(child.id, 'child profile ID');
                validateUUIDv4(child.primaryLocationId, 'primary location ID');
                validateUUIDv4(child.createdByStaffId, 'creator staff ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM children_profiles WHERE id = ? LIMIT 1',
                    [child.id]
                );

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO children_profiles
                        (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            child.id,
                            child.customSerialId,
                            child.fullName,
                            child.gender,
                            child.estimatedBirthYear,
                            child.primaryLocationId,
                            child.createdByStaffId,
                            child.version
                        ]
                    );
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (child.version < localVersion) {
                    conflicts.push({
                        domain: 'children_profiles',
                        id: child.id,
                        reason: `Incoming version ${child.version} is behind server version ${localVersion}.`
                    });
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (child.version === localVersion) {
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE children_profiles
                     SET custom_serial_id = ?, full_name = ?, gender = ?, estimated_birth_year = ?, primary_location_id = ?, created_by_staff_id = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [
                        child.customSerialId,
                        child.fullName,
                        child.gender,
                        child.estimatedBirthYear,
                        child.primaryLocationId,
                        child.createdByStaffId,
                        child.version,
                        child.id,
                        localVersion
                    ]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'children_profiles',
                        id: child.id,
                        reason: 'Concurrent update detected while applying child profile changes.'
                    });
                }
                await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.execute(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'children_profiles',
                    id: child.id,
                    reason: err.message || 'Database error during child profile sync.'
                });
            }
        }

        let bioIdx = 0;
        for (const bio of biometrics) {
            bioIdx++;
            const savepointName = `bio_savepoint_${bioIdx}`;
            await connection.execute(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(bio.id, 'biometric template ID');
                validateUUIDv4(bio.childId, 'child profile ID');
                const templateBytes = decodeBase64ToBuffer(bio.templateBase64);

                if (!Number.isInteger(bio.fingerIndex) || bio.fingerIndex < 1 || bio.fingerIndex > 10) {
                    throw new HttpError(400, 'fingerIndex must be an integer between 1 and 10.');
                }
                if (bio.qualityScore !== null) {
                    if (!Number.isInteger(bio.qualityScore) || bio.qualityScore < 0 || bio.qualityScore > 100) {
                        throw new HttpError(400, 'qualityScore must be an integer between 0 and 100 if provided.');
                    }
                }
                if (bio.status !== 'PENDING' && bio.status !== 'VERIFIED' && bio.status !== 'REJECTED') {
                    throw new HttpError(400, "status must be one of 'PENDING', 'VERIFIED', or 'REJECTED'.");
                }

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT id, version FROM biometric_fingerprints WHERE child_id = ? AND finger_index = ? LIMIT 1',
                    [bio.childId, bio.fingerIndex]
                );

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO biometric_fingerprints
                        (id, child_id, finger_index, template_data, quality_score, status, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [bio.id, bio.childId, bio.fingerIndex, templateBytes, bio.qualityScore, bio.status, bio.version]
                    );
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const current = existingRows[0];
                const localVersion = Number(current.version);
                if (bio.version < localVersion) {
                    conflicts.push({
                        domain: 'biometric_fingerprints',
                        id: String(current.id),
                        reason: `Incoming version ${bio.version} is behind server version ${localVersion}.`
                    });
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (bio.version === localVersion) {
                    await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE biometric_fingerprints
                     SET template_data = ?, quality_score = ?, status = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [templateBytes, bio.qualityScore, bio.status, bio.version, current.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'biometric_fingerprints',
                        id: String(current.id),
                        reason: 'Concurrent update detected while applying biometric template changes.'
                    });
                }
                await connection.execute(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.execute(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'biometric_fingerprints',
                    id: bio.id,
                    reason: err.message || 'Database error during biometric template sync.'
                });
            }
        }

        await connection.commit();
        return { conflicts };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getSyncDelta(pool: Pool, since?: string): Promise<{
    serverTime: string;
    childrenProfiles: SyncChildProfilePayload[];
    biometricFingerprints: SyncBiometricPayload[];
}> {
    const sinceDate = parseSinceTimestamp(since);

    const [childRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, version, last_modified_at
         FROM children_profiles
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [biometricRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, finger_index, template_data, quality_score, status, version, last_modified_at
         FROM biometric_fingerprints
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    return {
        serverTime: new Date().toISOString(),
        childrenProfiles: childRows.map((row) => ({
            id: row.id,
            customSerialId: row.custom_serial_id,
            fullName: row.full_name,
            gender: row.gender,
            estimatedBirthYear: row.estimated_birth_year,
            primaryLocationId: row.primary_location_id,
            createdByStaffId: row.created_by_staff_id,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        biometricFingerprints: biometricRows.map((row) => ({
            id: row.id,
            childId: row.child_id,
            fingerIndex: row.finger_index,
            templateBase64: Buffer.from(row.template_data as Buffer).toString('base64'),
            qualityScore: row.quality_score,
            status: row.status,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        }))
    };
}
