import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { ChildProfile, Gender } from '../types/children.ts';

// Helper to validate client-side generated UUIDv4 format
function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

export async function createChildProfile(
    pool: Pool,
    id: string,
    customSerialId: string,
    fullName: string,
    gender: Gender,
    estimatedBirthYear: number | null,
    primaryLocationId: string,
    createdByStaffId: string,
    image1?: string | null,
    image2?: string | null,
    image3?: string | null
): Promise<ChildProfile> {
    // 1. Enforce client-side UUID format
    validateUUIDv4(id, 'patient ID');
    validateUUIDv4(primaryLocationId, 'primary location ID');
    validateUUIDv4(createdByStaffId, 'creator staff ID');

    // 2. Validate Gender
    if (gender !== 'Male' && gender !== 'Female') {
        throw new HttpError(400, "Gender must be either 'Male' or 'Female'.");
    }

    // 3. Validate estimatedBirthYear if provided
    const currentYear = new Date().getFullYear();
    if (estimatedBirthYear !== null) {
        if (!Number.isInteger(estimatedBirthYear) || estimatedBirthYear < 1900 || estimatedBirthYear > currentYear) {
            throw new HttpError(400, `Estimated birth year must be an integer between 1900 and ${currentYear}.`);
        }
    }

    const normalizedFullName = fullName.trim();
    const normalizedSerial = customSerialId.trim();

    if (!normalizedFullName) {
        throw new HttpError(400, 'Full name cannot be empty.');
    }
    if (!normalizedSerial) {
        throw new HttpError(400, 'Custom serial ID cannot be empty.');
    }

    // 4. Verify primary location exists
    const [locationCheck] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM child_locations WHERE id = ? LIMIT 1',
        [primaryLocationId]
    );
    if (locationCheck.length === 0) {
        throw new HttpError(400, `Primary location with ID '${primaryLocationId}' does not exist.`);
    }

    // 5. Verify creator staff user exists
    const [staffCheck] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM staff_users WHERE id = ? LIMIT 1',
        [createdByStaffId]
      );
    if (staffCheck.length === 0) {
        throw new HttpError(400, `Creator staff user with ID '${createdByStaffId}' does not exist.`);
    }

    // 6. Verify customSerialId is unique
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE LOWER(custom_serial_id) = ? LIMIT 1',
        [normalizedSerial.toLowerCase()]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Custom Serial ID '${normalizedSerial}' is already assigned to another patient.`);
    }

    // 7. Insert record
    const createdAt = new Date().toISOString();
    await pool.execute(
        `INSERT INTO children_profiles (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            id,
            normalizedSerial,
            normalizedFullName,
            gender,
            estimatedBirthYear,
            primaryLocationId,
            createdByStaffId,
            image1 ?? null,
            image2 ?? null,
            image3 ?? null
        ]
    );

    return {
        id,
        customSerialId: normalizedSerial,
        fullName: normalizedFullName,
        gender,
        estimatedBirthYear,
        primaryLocationId,
        createdByStaffId,
        image1: image1 ?? null,
        image2: image2 ?? null,
        image3: image3 ?? null,
        version: 1,
        createdAt,
        lastModifiedAt: createdAt
    };
}

export async function listChildProfiles(pool: Pool): Promise<ChildProfile[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, created_at, last_modified_at
         FROM children_profiles
         ORDER BY custom_serial_id`
    );

    return rows.map((row) => ({
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
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    }));
}

export async function getChildProfile(pool: Pool, id: string): Promise<ChildProfile> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, created_at, last_modified_at
         FROM children_profiles
         WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Patient profile with ID '${id}' not found.`);
    }

    return {
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
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    };
}

export async function updateChildProfile(
    pool: Pool,
    id: string,
    customSerialId: string,
    fullName: string,
    gender: Gender,
    estimatedBirthYear: number | null,
    primaryLocationId: string,
    image1?: string | null,
    image2?: string | null,
    image3?: string | null
): Promise<ChildProfile> {
    // 1. Verify existence & fetch version
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT version, created_by_staff_id, image1, image2, image3 FROM children_profiles WHERE id = ? LIMIT 1',
        [id]
    );
    const existingProfile = rows[0];
    if (!existingProfile) {
        throw new HttpError(404, `Patient profile with ID '${id}' not found.`);
    }

    // 2. Validate Gender
    if (gender !== 'Male' && gender !== 'Female') {
        throw new HttpError(400, "Gender must be either 'Male' or 'Female'.");
    }

    // 3. Validate estimatedBirthYear
    const currentYear = new Date().getFullYear();
    if (estimatedBirthYear !== null) {
        if (!Number.isInteger(estimatedBirthYear) || estimatedBirthYear < 1900 || estimatedBirthYear > currentYear) {
            throw new HttpError(400, `Estimated birth year must be an integer between 1900 and ${currentYear}.`);
        }
    }

    const normalizedFullName = fullName.trim();
    const normalizedSerial = customSerialId.trim();

    if (!normalizedFullName) {
        throw new HttpError(400, 'Full name cannot be empty.');
    }
    if (!normalizedSerial) {
        throw new HttpError(400, 'Custom serial ID cannot be empty.');
    }

    // 4. Verify primary location exists
    const [locationCheck] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM child_locations WHERE id = ? LIMIT 1',
        [primaryLocationId]
    );
    if (locationCheck.length === 0) {
        throw new HttpError(400, `Primary location with ID '${primaryLocationId}' does not exist.`);
    }

    // 5. Verify customSerialId is unique (excluding this child)
    const [existingSerials] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE LOWER(custom_serial_id) = ? AND id != ? LIMIT 1',
        [normalizedSerial.toLowerCase(), id]
    );
    if (existingSerials.length > 0) {
        throw new HttpError(409, `Custom Serial ID '${normalizedSerial}' is already assigned to another patient.`);
    }

    // 6. Increment version count for offline synchronization integrity tracking
    const nextVersion = existingProfile.version + 1;

    const finalImage1 = image1 !== undefined ? image1 : existingProfile.image1;
    const finalImage2 = image2 !== undefined ? image2 : existingProfile.image2;
    const finalImage3 = image3 !== undefined ? image3 : existingProfile.image3;

    // 7. Execute Update
    const lastModifiedAt = new Date().toISOString();
    await pool.execute(
        `UPDATE children_profiles
         SET custom_serial_id = ?, full_name = ?, gender = ?, estimated_birth_year = ?, primary_location_id = ?, image1 = ?, image2 = ?, image3 = ?, version = ?
         WHERE id = ?`,
        [
            normalizedSerial,
            normalizedFullName,
            gender,
            estimatedBirthYear,
            primaryLocationId,
            finalImage1 ?? null,
            finalImage2 ?? null,
            finalImage3 ?? null,
            nextVersion,
            id
        ]
    );

    return {
        id,
        customSerialId: normalizedSerial,
        fullName: normalizedFullName,
        gender,
        estimatedBirthYear,
        primaryLocationId,
        createdByStaffId: existingProfile.created_by_staff_id,
        image1: finalImage1 ?? null,
        image2: finalImage2 ?? null,
        image3: finalImage3 ?? null,
        version: nextVersion,
        lastModifiedAt
    };
}

export async function deleteChildProfile(pool: Pool, id: string): Promise<void> {
    // 1. Verify profile exists
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE id = ? LIMIT 1',
        [id]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Patient profile with ID '${id}' not found.`);
    }

    // 2. Perform delete (fingerprints will automatically cascade delete)
    await pool.execute('DELETE FROM children_profiles WHERE id = ?', [id]);
}
