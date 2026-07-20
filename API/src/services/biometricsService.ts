import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type {
    EnrollmentStatus,
    FingerprintTemplateRecord,
    IdentifyOneToManyResult,
    VerifyOneToOneResult
} from '../types/biometrics.ts';

const ALL_FINGER_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type FingerprintRow = RowDataPacket & {
    id: string;
    child_id: string;
    finger_index: number;
    template_data?: Buffer | string | null;
    quality_score: number | null;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    version: number;
    created_at: string | null;
    last_modified_at: string | null;
};

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

function validateFingerIndex(fingerIndex: number): void {
    if (!Number.isInteger(fingerIndex) || fingerIndex < 1 || fingerIndex > 10) {
        throw new HttpError(400, 'fingerIndex must be an integer between 1 and 10.');
    }
}

function validateOptionalQualityScore(qualityScore: number | null): void {
    if (qualityScore === null) {
        return;
    }

    if (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100) {
        throw new HttpError(400, 'qualityScore must be an integer between 0 and 100 if provided.');
    }
}

function decodeTemplateBase64(templateBase64: string): Buffer {
    const normalized = templateBase64.trim();
    if (!normalized) {
        throw new HttpError(400, 'templateBase64 is required.');
    }

    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (!base64Regex.test(normalized)) {
        throw new HttpError(400, 'templateBase64 must be valid Base64 data.');
    }

    const decoded = Buffer.from(normalized, 'base64');
    if (decoded.length === 0) {
        throw new HttpError(400, 'templateBase64 cannot decode to an empty template.');
    }

    return decoded;
}

function normalizeTemplateBase64(templateData: Buffer | string | null | undefined): string | undefined {
    if (templateData === null || templateData === undefined) {
        return undefined;
    }

    if (Buffer.isBuffer(templateData)) {
        const asText = templateData.toString('utf8').trim();
        if (asText) {
            try {
                decodeTemplateBase64(asText);
                return asText;
            } catch {
                return templateData.toString('base64');
            }
        }
        return templateData.toString('base64');
    }

    const asText = String(templateData).trim();
    if (!asText) {
        return undefined;
    }

    try {
        decodeTemplateBase64(asText);
        return asText;
    } catch {
        return Buffer.from(asText, 'binary').toString('base64');
    }
}

async function assertChildExists(pool: Pool, childId: string): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE id = ? LIMIT 1',
        [childId]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Child profile with ID '${childId}' not found.`);
    }
}

function mapFingerprintRow(row: FingerprintRow): FingerprintTemplateRecord {
    return {
        id: row.id,
        childId: row.child_id,
        fingerIndex: row.finger_index,
        templateBase64: normalizeTemplateBase64(row.template_data),
        qualityScore: row.quality_score,
        status: row.status,
        version: row.version,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    };
}

export async function getEnrollmentStatus(pool: Pool, childId: string): Promise<EnrollmentStatus> {
    validateUUIDv4(childId, 'child ID');
    await assertChildExists(pool, childId);

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT DISTINCT finger_index
         FROM biometric_fingerprints
         WHERE child_id = ?
         ORDER BY finger_index`,
        [childId]
    );

    const capturedFingerIndexes = rows.map((row) => Number(row.finger_index));
    const capturedSet = new Set(capturedFingerIndexes);
    const missingFingerIndexes = ALL_FINGER_INDEXES.filter((fingerIndex) => !capturedSet.has(fingerIndex));

    return {
        childId,
        capturedFingerIndexes,
        missingFingerIndexes,
        isComplete: missingFingerIndexes.length === 0
    };
}

export async function enrollFingerprint(
    pool: Pool,
    id: string,
    childId: string,
    fingerIndex: number,
    templateBase64: string,
    qualityScore: number | null
): Promise<{ fingerprint: FingerprintTemplateRecord; enrollment: EnrollmentStatus }> {
    validateUUIDv4(id, 'fingerprint template ID');
    validateUUIDv4(childId, 'child ID');
    validateFingerIndex(fingerIndex);
    validateOptionalQualityScore(qualityScore);
    decodeTemplateBase64(templateBase64);
    const templateData = templateBase64.trim();

    await assertChildExists(pool, childId);

    const [existingRows] = await pool.execute<FingerprintRow[]>(
        `SELECT id, child_id, finger_index, CAST(template_data AS BINARY) AS template_data, quality_score, status, version, created_at, last_modified_at
         FROM biometric_fingerprints
         WHERE child_id = ? AND finger_index = ?
         LIMIT 1`,
        [childId, fingerIndex]
    );

    if (existingRows.length === 0) {
        await pool.execute(
            `INSERT INTO biometric_fingerprints (id, child_id, finger_index, template_data, quality_score, status, version)
             VALUES (?, ?, ?, ?, ?, 'PENDING', 1)`,
            [id, childId, fingerIndex, templateData, qualityScore]
        );
    } else {
        const existing = existingRows[0];
        const nextVersion = existing.version + 1;
        await pool.execute(
            `UPDATE biometric_fingerprints
             SET template_data = ?, quality_score = ?, status = 'PENDING', version = ?
             WHERE id = ?`,
            [templateData, qualityScore, nextVersion, existing.id]
        );
    }

    const [fingerprintRows] = await pool.execute<FingerprintRow[]>(
        `SELECT id, child_id, finger_index, quality_score, status, version, created_at, last_modified_at
         FROM biometric_fingerprints
         WHERE child_id = ? AND finger_index = ?
         LIMIT 1`,
        [childId, fingerIndex]
    );

    const fingerprint = mapFingerprintRow(fingerprintRows[0]);
    const enrollment = await getEnrollmentStatus(pool, childId);
    return { fingerprint, enrollment };
}

export async function listChildFingerprints(
    pool: Pool,
    childId: string
): Promise<{ fingerprints: FingerprintTemplateRecord[]; enrollment: EnrollmentStatus }> {
    const enrollment = await getEnrollmentStatus(pool, childId);

    const [rows] = await pool.execute<FingerprintRow[]>(
        `SELECT id, child_id, finger_index, CAST(template_data AS BINARY) AS template_data, quality_score, status, version, created_at, last_modified_at
         FROM biometric_fingerprints
         WHERE child_id = ?
         ORDER BY finger_index`,
        [childId]
    );

    return {
        fingerprints: rows.map(mapFingerprintRow),
        enrollment
    };
}

async function assertTenFingerEnrollment(pool: Pool, childId: string): Promise<void> {
    const enrollment = await getEnrollmentStatus(pool, childId);
    if (!enrollment.isComplete) {
        throw new HttpError(
            409,
            `Child biometric enrollment is incomplete. Missing finger indexes: ${enrollment.missingFingerIndexes.join(', ')}.`
        );
    }
}

export async function verifyOneToOne(
    pool: Pool,
    childId: string,
    templateBase64: string,
    matched: boolean,
    score: number,
    threshold: number,
    fingerIndex?: number
): Promise<VerifyOneToOneResult> {
    validateUUIDv4(childId, 'child ID');
    decodeTemplateBase64(templateBase64);
    await assertTenFingerEnrollment(pool, childId);

    if (!Number.isFinite(score) || score < 0) {
        throw new HttpError(400, 'score must be a non-negative number.');
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
        throw new HttpError(400, 'threshold must be a non-negative number.');
    }
    if (typeof matched !== 'boolean') {
        throw new HttpError(400, 'matched must be a boolean.');
    }
    if (fingerIndex !== undefined) {
        validateFingerIndex(fingerIndex);
    }

    return {
        matched,
        childId,
        fingerIndex,
        score,
        threshold
    };
}

export async function identifyOneToMany(
    pool: Pool,
    templateBase64: string,
    matched: boolean,
    score: number,
    threshold: number,
    candidateChildId: string | null,
    candidateFingerprintId: string | null
): Promise<IdentifyOneToManyResult> {
    decodeTemplateBase64(templateBase64);

    if (!Number.isFinite(score) || score < 0) {
        throw new HttpError(400, 'score must be a non-negative number.');
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
        throw new HttpError(400, 'threshold must be a non-negative number.');
    }
    if (typeof matched !== 'boolean') {
        throw new HttpError(400, 'matched must be a boolean.');
    }

    if (matched) {
        if (!candidateChildId || !candidateFingerprintId) {
            throw new HttpError(400, 'candidateChildId and candidateFingerprintId are required when matched is true.');
        }
        validateUUIDv4(candidateChildId, 'candidate child ID');
        validateUUIDv4(candidateFingerprintId, 'candidate fingerprint ID');

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT 1 FROM biometric_fingerprints WHERE id = ? AND child_id = ? LIMIT 1',
            [candidateFingerprintId, candidateChildId]
        );
        if (rows.length === 0) {
            throw new HttpError(404, 'Candidate fingerprint record was not found for the provided child.');
        }
    }

    return {
        matched,
        candidateChildId: matched ? candidateChildId : null,
        candidateFingerprintId: matched ? candidateFingerprintId : null,
        score,
        threshold
    };
}

export async function deleteFingerprint(pool: Pool, fingerprintId: string): Promise<void> {
    validateUUIDv4(fingerprintId, 'fingerprint ID');

    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM biometric_fingerprints WHERE id = ? LIMIT 1',
        [fingerprintId]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Fingerprint record with ID '${fingerprintId}' not found.`);
    }

    await pool.execute('DELETE FROM biometric_fingerprints WHERE id = ?', [fingerprintId]);
}

export async function listAllFingerprints(pool: Pool): Promise<FingerprintTemplateRecord[]> {
    const [rows] = await pool.execute<FingerprintRow[]>(
        `SELECT id, child_id, finger_index, CAST(template_data AS BINARY) AS template_data, quality_score, status, version, created_at, last_modified_at
         FROM biometric_fingerprints
         ORDER BY created_at DESC`
    );
    return rows.map(mapFingerprintRow);
}

export async function getFingerprint(pool: Pool, id: string): Promise<FingerprintTemplateRecord> {
    validateUUIDv4(id, 'fingerprint ID');
    const [rows] = await pool.execute<FingerprintRow[]>(
        `SELECT id, child_id, finger_index, CAST(template_data AS BINARY) AS template_data, quality_score, status, version, created_at, last_modified_at
         FROM biometric_fingerprints
         WHERE id = ? LIMIT 1`,
        [id]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Fingerprint record with ID '${id}' not found.`);
    }
    return mapFingerprintRow(rows[0]);
}

export async function updateFingerprint(
    pool: Pool,
    id: string,
    fingerIndex: number,
    templateBase64: string,
    qualityScore: number | null,
    status: 'PENDING' | 'VERIFIED' | 'REJECTED'
): Promise<FingerprintTemplateRecord> {
    validateUUIDv4(id, 'fingerprint ID');
    validateFingerIndex(fingerIndex);
    validateOptionalQualityScore(qualityScore);
    decodeTemplateBase64(templateBase64);
    const templateData = templateBase64.trim();

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
        throw new HttpError(400, "status must be 'PENDING', 'VERIFIED', or 'REJECTED'.");
    }

    const [existing] = await pool.execute<FingerprintRow[]>(
        'SELECT version FROM biometric_fingerprints WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Fingerprint record with ID '${id}' not found.`);
    }

    const nextVersion = existing[0].version + 1;

    await pool.execute(
        `UPDATE biometric_fingerprints
         SET finger_index = ?, template_data = ?, quality_score = ?, status = ?, version = ?
         WHERE id = ?`,
        [fingerIndex, templateData, qualityScore, status, nextVersion, id]
    );

    return getFingerprint(pool, id);
}

