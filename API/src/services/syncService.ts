import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type {
    SyncBiometricPayload,
    SyncChildProfilePayload,
    SyncConflict,
    SyncPushRequestBody,
    SyncNotificationPayload,
    SyncNotificationReadPayload,
    SyncMedicalBaselinePayload,
    SyncChildVitalsPayload,
    SyncMedicationsGivenPayload,
    SyncLaboratoryTestsPayload,
    SyncServicesRenderedPayload,
    SyncSymptomsRecordedPayload,
    SyncClothingProvisionsPayload
} from '../types/sync.ts';
import { uploadImageToCloudinary } from './cloudinaryService.ts';

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

function normalizeTemplateBase64(templateData: Buffer | string | null | undefined): string {
    if (templateData === null || templateData === undefined) {
        return '';
    }

    if (Buffer.isBuffer(templateData)) {
        const asText = templateData.toString('utf8').trim();
        if (asText) {
            try {
                decodeBase64ToBuffer(asText);
                return asText;
            } catch {
                return templateData.toString('base64');
            }
        }
        return templateData.toString('base64');
    }

    const asText = String(templateData).trim();
    if (!asText) {
        return '';
    }

    try {
        decodeBase64ToBuffer(asText);
        return asText;
    } catch {
        return Buffer.from(asText, 'binary').toString('base64');
    }
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
    const notificationReads = payload.notificationReads ?? [];
    const medicalBaselines = payload.medicalBaselines ?? [];
    const childVitals = payload.childVitals ?? [];
    const medicationsGiven = payload.medicationsGiven ?? [];
    const laboratoryTests = payload.laboratoryTests ?? [];
    const servicesRendered = payload.servicesRendered ?? [];
    const symptomsRecorded = payload.symptomsRecorded ?? [];
    const clothingProvisions = payload.clothingProvisions ?? [];
    const conflicts: SyncConflict[] = [];

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let childIdx = 0;
        for (const child of children) {
            childIdx++;
            const savepointName = `child_savepoint_${childIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(child.id, 'child profile ID');
                validateUUIDv4(child.primaryLocationId, 'primary location ID');
                validateUUIDv4(child.createdByStaffId, 'creator staff ID');

                const image1 = await uploadImageToCloudinary(child.image1);
                const image2 = await uploadImageToCloudinary(child.image2);
                const image3 = await uploadImageToCloudinary(child.image3);

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM children_profiles WHERE id = ? LIMIT 1',
                    [child.id]
                );

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO children_profiles
                        (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            child.id,
                            child.customSerialId,
                            child.fullName,
                            child.gender,
                            child.estimatedBirthYear,
                            child.primaryLocationId,
                            child.createdByStaffId,
                            image1 ?? null,
                            image2 ?? null,
                            image3 ?? null,
                            child.version
                        ]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (child.version < localVersion) {
                    conflicts.push({
                        domain: 'children_profiles',
                        id: child.id,
                        reason: `Incoming version ${child.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (child.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE children_profiles
                     SET custom_serial_id = ?, full_name = ?, gender = ?, estimated_birth_year = ?, primary_location_id = ?, created_by_staff_id = ?, image1 = ?, image2 = ?, image3 = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [
                        child.customSerialId,
                        child.fullName,
                        child.gender,
                        child.estimatedBirthYear,
                        child.primaryLocationId,
                        child.createdByStaffId,
                        image1 ?? null,
                        image2 ?? null,
                        image3 ?? null,
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
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
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
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(bio.id, 'biometric template ID');
                validateUUIDv4(bio.childId, 'child profile ID');
                decodeBase64ToBuffer(bio.templateBase64);
                const templateData = bio.templateBase64.trim();

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
                        [bio.id, bio.childId, bio.fingerIndex, templateData, bio.qualityScore, bio.status, bio.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
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
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (bio.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE biometric_fingerprints
                     SET template_data = ?, quality_score = ?, status = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [templateData, bio.qualityScore, bio.status, bio.version, current.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'biometric_fingerprints',
                        id: String(current.id),
                        reason: 'Concurrent update detected while applying biometric template changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'biometric_fingerprints',
                    id: bio.id,
                    reason: err.message || 'Database error during biometric template sync.'
                });
            }
        }

        let readIdx = 0;
        for (const read of notificationReads) {
            readIdx++;
            const savepointName = `read_savepoint_${readIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(read.notificationId, 'notification ID');
                validateUUIDv4(read.staffUserId, 'staff user ID');

                const mysqlReadAt = read.readAt 
                    ? new Date(read.readAt).toISOString().slice(0, 19).replace('T', ' ')
                    : new Date().toISOString().slice(0, 19).replace('T', ' ');

                await connection.execute(
                    `INSERT IGNORE INTO notification_reads (notification_id, staff_user_id, read_at)
                     VALUES (?, ?, ?)`,
                    [read.notificationId, read.staffUserId, mysqlReadAt]
                );
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'notification_reads',
                    id: `${read.notificationId}:${read.staffUserId}`,
                    reason: err.message || 'Database error during notification read sync.'
                });
            }
        }

        // --- NEW: Clinical Record Sync Batch Loops ---

        // 1. medical_baselines
        let baselineIdx = 0;
        for (const record of medicalBaselines) {
            baselineIdx++;
            const savepointName = `baseline_savepoint_${baselineIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'medical baseline ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM medical_baselines WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.visitDate ? new Date(record.visitDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO medical_baselines
                        (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, dateStr, record.firstVisit, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'medical_baselines',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE medical_baselines
                     SET child_id = ?, visit_date = ?, first_visit = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, dateStr, record.firstVisit, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'medical_baselines',
                        id: record.id,
                        reason: 'Concurrent update detected while applying medical baseline changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'medical_baselines',
                    id: record.id,
                    reason: err.message || 'Database error during medical baseline sync.'
                });
            }
        }

        // 2. child_vitals
        let vitalsIdx = 0;
        for (const record of childVitals) {
            vitalsIdx++;
            const savepointName = `vitals_savepoint_${vitalsIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'child vitals ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM child_vitals WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO child_vitals
                        (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.weight, record.height, record.bmi, record.bmiStatus ?? null, record.recordedBy ?? null, record.recordedByName ?? null, dateStr, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'child_vitals',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE child_vitals
                     SET child_id = ?, weight = ?, height = ?, bmi = ?, bmi_status = ?, recorded_by = ?, recorded_by_name = ?, date = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.weight, record.height, record.bmi, record.bmiStatus ?? null, record.recordedBy ?? null, record.recordedByName ?? null, dateStr, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'child_vitals',
                        id: record.id,
                        reason: 'Concurrent update detected while applying child vitals changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'child_vitals',
                    id: record.id,
                    reason: err.message || 'Database error during child vitals sync.'
                });
            }
        }

        // 3. medications_given
        let medsIdx = 0;
        for (const record of medicationsGiven) {
            medsIdx++;
            const savepointName = `meds_savepoint_${medsIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'medications given ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM medications_given WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.dateGiven ? new Date(record.dateGiven).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO medications_given
                        (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.ntdsMeds ?? null, record.antibiotics ?? null, record.otherMeds ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'medications_given',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE medications_given
                     SET child_id = ?, ntds_meds = ?, antibiotics = ?, other_meds = ?, date_given = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.ntdsMeds ?? null, record.antibiotics ?? null, record.otherMeds ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'medications_given',
                        id: record.id,
                        reason: 'Concurrent update detected while applying medications given changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'medications_given',
                    id: record.id,
                    reason: err.message || 'Database error during medications given sync.'
                });
            }
        }

        // 4. laboratory_tests
        let labsIdx = 0;
        for (const record of laboratoryTests) {
            labsIdx++;
            const savepointName = `labs_savepoint_${labsIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'laboratory test ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM laboratory_tests WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO laboratory_tests
                        (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.testType, record.result, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'laboratory_tests',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE laboratory_tests
                     SET child_id = ?, test_type = ?, result = ?, date = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.testType, record.result, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'laboratory_tests',
                        id: record.id,
                        reason: 'Concurrent update detected while applying laboratory test changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'laboratory_tests',
                    id: record.id,
                    reason: err.message || 'Database error during laboratory test sync.'
                });
            }
        }

        // 5. services_rendered
        let servicesIdx = 0;
        for (const record of servicesRendered) {
            servicesIdx++;
            const savepointName = `services_savepoint_${servicesIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'services rendered ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM services_rendered WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO services_rendered
                        (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.serviceType, record.servicesList, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'services_rendered',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE services_rendered
                     SET child_id = ?, service_type = ?, services_list = ?, date = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.serviceType, record.servicesList, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'services_rendered',
                        id: record.id,
                        reason: 'Concurrent update detected while applying services rendered changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'services_rendered',
                    id: record.id,
                    reason: err.message || 'Database error during services rendered sync.'
                });
            }
        }

        // 6. symptoms_recorded
        let symptomsIdx = 0;
        for (const record of symptomsRecorded) {
            symptomsIdx++;
            const savepointName = `symptoms_savepoint_${symptomsIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'symptoms recorded ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM symptoms_recorded WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO symptoms_recorded
                        (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.symptoms ?? null, record.visitNotes ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'symptoms_recorded',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE symptoms_recorded
                     SET child_id = ?, symptoms = ?, visit_notes = ?, date = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.symptoms ?? null, record.visitNotes ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'symptoms_recorded',
                        id: record.id,
                        reason: 'Concurrent update detected while applying symptoms recorded changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'symptoms_recorded',
                    id: record.id,
                    reason: err.message || 'Database error during symptoms recorded sync.'
                });
            }
        }

        // 7. clothing_provisions
        let clothingIdx = 0;
        for (const record of clothingProvisions) {
            clothingIdx++;
            const savepointName = `clothing_savepoint_${clothingIdx}`;
            await connection.query(`SAVEPOINT ${savepointName}`);
            try {
                validateUUIDv4(record.id, 'clothing provisions ID');
                validateUUIDv4(record.childId, 'child profile ID');

                const [existingRows] = await connection.execute<RowDataPacket[]>(
                    'SELECT version FROM clothing_provisions WHERE id = ? LIMIT 1',
                    [record.id]
                );

                const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                if (existingRows.length === 0) {
                    await connection.execute(
                        `INSERT INTO clothing_provisions
                        (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, record.childId, record.shoes ?? null, record.clothes ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version]
                    );
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const localVersion = Number(existingRows[0].version);
                if (record.version < localVersion) {
                    conflicts.push({
                        domain: 'clothing_provisions',
                        id: record.id,
                        reason: `Incoming version ${record.version} is behind server version ${localVersion}.`
                    });
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                if (record.version === localVersion) {
                    await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
                    continue;
                }

                const [updateResult] = await connection.execute<ResultSetHeader>(
                    `UPDATE clothing_provisions
                     SET child_id = ?, shoes = ?, clothes = ?, date = ?, recorded_by = ?, recorded_by_name = ?, version = ?
                     WHERE id = ? AND version = ?`,
                    [record.childId, record.shoes ?? null, record.clothes ?? null, dateStr, record.recordedBy ?? null, record.recordedByName ?? null, record.version, record.id, localVersion]
                );
                if (updateResult.affectedRows === 0) {
                    conflicts.push({
                        domain: 'clothing_provisions',
                        id: record.id,
                        reason: 'Concurrent update detected while applying clothing provisions changes.'
                    });
                }
                await connection.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (err: any) {
                await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                conflicts.push({
                    domain: 'clothing_provisions',
                    id: record.id,
                    reason: err.message || 'Database error during clothing provisions sync.'
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
    notifications: SyncNotificationPayload[];
    medicalBaselines: SyncMedicalBaselinePayload[];
    childVitals: SyncChildVitalsPayload[];
    medicationsGiven: SyncMedicationsGivenPayload[];
    laboratoryTests: SyncLaboratoryTestsPayload[];
    servicesRendered: SyncServicesRenderedPayload[];
    symptomsRecorded: SyncSymptomsRecordedPayload[];
    clothingProvisions: SyncClothingProvisionsPayload[];
}> {
    const sinceDate = parseSinceTimestamp(since);

    const [childRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, last_modified_at
         FROM children_profiles
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [biometricRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, finger_index, CAST(template_data AS BINARY) AS template_data, quality_score, status, version, last_modified_at
         FROM biometric_fingerprints
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [notificationRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, last_modified_at
         FROM notifications
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [baselineRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, last_modified_at
         FROM medical_baselines
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [vitalsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, last_modified_at
         FROM child_vitals
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [medsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, last_modified_at
         FROM medications_given
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [labsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, last_modified_at
         FROM laboratory_tests
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [servicesRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, last_modified_at
         FROM services_rendered
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [symptomsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, last_modified_at
         FROM symptoms_recorded
         WHERE last_modified_at > ?
         ORDER BY last_modified_at ASC`,
        [sinceDate]
    );

    const [clothingRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, last_modified_at
         FROM clothing_provisions
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
            image1: row.image1,
            image2: row.image2,
            image3: row.image3,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        biometricFingerprints: biometricRows.map((row) => ({
            id: row.id,
            childId: row.child_id,
            fingerIndex: row.finger_index,
            templateBase64: normalizeTemplateBase64(row.template_data as Buffer | string | null),
            qualityScore: row.quality_score,
            status: row.status,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        notifications: notificationRows.map((row) => ({
            id: row.id,
            type: row.type,
            title: row.title,
            message: row.message,
            targetType: row.target_type,
            targetRoleId: row.target_role_id,
            targetUserId: row.target_user_id,
            createdByStaffId: row.created_by_staff_id,
            expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        medicalBaselines: baselineRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            visitDate: row.visit_date ? new Date(row.visit_date).toISOString().slice(0, 10) : '',
            firstVisit: row.first_visit,
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        childVitals: vitalsRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            weight: row.weight !== null ? Number(row.weight) : null,
            height: row.height !== null ? Number(row.height) : null,
            bmi: row.bmi !== null ? Number(row.bmi) : null,
            bmiStatus: row.bmi_status,
            date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        medicationsGiven: medsRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            ntdsMeds: row.ntds_meds,
            antibiotics: row.antibiotics,
            otherMeds: row.other_meds,
            dateGiven: row.date_given ? new Date(row.date_given).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        laboratoryTests: labsRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            testType: row.test_type,
            result: row.result,
            date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        servicesRendered: servicesRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            serviceType: row.service_type,
            servicesList: row.services_list,
            date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        symptomsRecorded: symptomsRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            symptoms: row.symptoms,
            visitNotes: row.visit_notes,
            date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        })),
        clothingProvisions: clothingRows.map(row => ({
            id: row.id,
            childId: row.child_id,
            shoes: row.shoes,
            clothes: row.clothes,
            date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
            recordedBy: row.recorded_by,
            recordedByName: row.recorded_by_name,
            version: row.version,
            lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
        }))
    };
}
