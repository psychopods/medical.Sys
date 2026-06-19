import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { IdentityMatchProfile, ResolveIdentityResult } from '../types/identity.ts';

type IdentityLookupRow = RowDataPacket & {
    fingerprint_id: string;
    child_id: string;
    custom_serial_id: string;
    full_name: string;
    gender: 'Male' | 'Female';
    estimated_birth_year: number | null;
    primary_location_id: string;
    created_by_staff_id: string;
    version: number;
};

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

function decodeTemplate(templateBase64: string): Buffer {
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

function toProfile(row: IdentityLookupRow): IdentityMatchProfile {
    return {
        childId: row.child_id,
        customSerialId: row.custom_serial_id,
        fullName: row.full_name,
        gender: row.gender,
        estimatedBirthYear: row.estimated_birth_year,
        primaryLocationId: row.primary_location_id,
        createdByStaffId: row.created_by_staff_id,
        version: row.version
    };
}

async function loadChildProfileById(pool: Pool, childId: string): Promise<IdentityMatchProfile | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, version
         FROM children_profiles
         WHERE id = ?
         LIMIT 1`,
        [childId]
    );

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0];
    return {
        childId: row.id,
        customSerialId: row.custom_serial_id,
        fullName: row.full_name,
        gender: row.gender,
        estimatedBirthYear: row.estimated_birth_year,
        primaryLocationId: row.primary_location_id,
        createdByStaffId: row.created_by_staff_id,
        version: row.version
    };
}

async function findCentralMatchByTemplate(pool: Pool, templateBase64: string): Promise<ResolveIdentityResult> {
    const templateHash = createHash('sha256').update(templateBase64.trim()).digest('hex');

    const [rows] = await pool.execute<IdentityLookupRow[]>(
        `SELECT
            bf.id AS fingerprint_id,
            cp.id AS child_id,
            cp.custom_serial_id,
            cp.full_name,
            cp.gender,
            cp.estimated_birth_year,
            cp.primary_location_id,
            cp.created_by_staff_id,
            cp.version
         FROM biometric_fingerprints bf
         INNER JOIN children_profiles cp ON cp.id = bf.child_id
         WHERE SHA2(bf.template_data, 256) = ?
         ORDER BY bf.last_modified_at DESC
         LIMIT 1`,
        [templateHash]
    );

    if (rows.length === 0) {
        return {
            stage: 'none',
            found: false,
            child: null,
            matchFingerprintId: null,
            message: 'No matching child profile was found in the central registry.'
        };
    }

    const row = rows[0];
    return {
        stage: 'central',
        found: true,
        child: toProfile(row),
        matchFingerprintId: row.fingerprint_id,
        message: 'Central registry match found.'
    };
}

export async function resolveIdentity(
    pool: Pool,
    templateBase64: string,
    localMatched: boolean,
    localChildId: string | null,
    runCentralLookup: boolean
): Promise<ResolveIdentityResult> {
    const templateData = decodeTemplate(templateBase64);

    if (localMatched) {
        if (!localChildId) {
            throw new HttpError(400, 'localChildId is required when localMatched is true.');
        }
        validateUUIDv4(localChildId, 'local child ID');
        const localChild = await loadChildProfileById(pool, localChildId);

        return {
            stage: 'local',
            found: Boolean(localChild),
            child: localChild,
            matchFingerprintId: null,
            message: localChild
                ? 'Local match confirmed and profile loaded from server.'
                : 'Local match reported, but profile was not found on this server copy yet.'
        };
    }

    if (!runCentralLookup) {
        return {
            stage: 'none',
            found: false,
            child: null,
            matchFingerprintId: null,
            message: 'No local match found. Central lookup skipped by client policy.'
        };
    }

    return findCentralMatchByTemplate(pool, templateBase64);
}
