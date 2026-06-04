import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { VolunteerApplication } from '../types/volunteer.ts';
import { randomUUID } from 'node:crypto';

export async function submitApplication(
    pool: Pool,
    fullName: string,
    emailAddress: string,
    phoneNumber: string,
    volunteerType: 'medical' | 'outreach' | 'education' | 'admin' | 'fundraising' | 'other',
    message: string
): Promise<VolunteerApplication> {
    const trimmedName = fullName.trim();
    const trimmedEmail = emailAddress.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedMsg || !volunteerType) {
        throw new HttpError(400, 'All fields are required.');
    }

    if (!['medical', 'outreach', 'education', 'admin', 'fundraising', 'other'].includes(volunteerType)) {
        throw new HttpError(400, 'Invalid volunteer type.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        throw new HttpError(400, 'Invalid email address format.');
    }

    const id = randomUUID();

    await pool.execute(
        `INSERT INTO volunteer_applications (id, full_name, email_address, phone_number, volunteer_type, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, trimmedName, trimmedEmail, trimmedPhone, volunteerType, trimmedMsg]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, full_name, email_address, phone_number, volunteer_type, message, created_at, last_modified_at
         FROM volunteer_applications WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        fullName: row.full_name,
        emailAddress: row.email_address,
        phoneNumber: row.phone_number,
        volunteerType: row.volunteer_type as any,
        message: row.message,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function listApplications(pool: Pool): Promise<VolunteerApplication[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, full_name, email_address, phone_number, volunteer_type, message, created_at, last_modified_at
         FROM volunteer_applications
         ORDER BY created_at DESC`
    );

    return rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        emailAddress: row.email_address,
        phoneNumber: row.phone_number,
        volunteerType: row.volunteer_type as any,
        message: row.message,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function deleteApplication(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM volunteer_applications WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Volunteer application with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM volunteer_applications WHERE id = ?', [id]);
}
