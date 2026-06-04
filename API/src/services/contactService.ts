import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { ContactSubmission } from '../types/contact.ts';
import { randomUUID } from 'node:crypto';

export async function submitContactForm(
    pool: Pool,
    fullName: string,
    emailAddress: string,
    subject: string,
    message: string
): Promise<ContactSubmission> {
    const trimmedName = fullName.trim();
    const trimmedEmail = emailAddress.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMsg) {
        throw new HttpError(400, 'All fields are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        throw new HttpError(400, 'Invalid email address format.');
    }

    const id = randomUUID();

    await pool.execute(
        `INSERT INTO contact_submissions (id, full_name, email_address, message_subject, message_content)
         VALUES (?, ?, ?, ?, ?)`,
        [id, trimmedName, trimmedEmail, trimmedSubject, trimmedMsg]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, full_name, email_address, message_subject, message_content, created_at, last_modified_at
         FROM contact_submissions WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        fullName: row.full_name,
        emailAddress: row.email_address,
        messageSubject: row.message_subject,
        messageContent: row.message_content,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function listContactSubmissions(pool: Pool): Promise<ContactSubmission[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, full_name, email_address, message_subject, message_content, created_at, last_modified_at
         FROM contact_submissions
         ORDER BY created_at DESC`
    );

    return rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        emailAddress: row.email_address,
        messageSubject: row.message_subject,
        messageContent: row.message_content,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function deleteContactSubmission(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM contact_submissions WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Contact submission with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM contact_submissions WHERE id = ?', [id]);
}
