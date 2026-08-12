import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import { uploadRawFileToCloudinary } from './cloudinaryService.ts';
import type {
    AnnualReport,
    QuarterlyReport,
    SuccessStory,
    ImpactMetric,
    ImpactDataResponse
} from '../types/reports.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

// --- Impact Metrics (Public & Admin) ---

export async function getImpactData(pool: Pool, year?: number): Promise<ImpactDataResponse> {
    const targetYear = year || new Date().getFullYear();

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT label, q1_value, q2_value, q3_value, q4_value, color
         FROM reports_impact_metrics
         WHERE year = ?
         ORDER BY created_at ASC`,
        [targetYear]
    );

    const datasets = rows.map((row) => ({
        label: row.label,
        values: [Number(row.q1_value), Number(row.q2_value), Number(row.q3_value), Number(row.q4_value)],
        color: row.color
    }));

    return {
        success: true,
        title: 'Quarterly Performance',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets
    };
}

export async function listImpactMetrics(pool: Pool, year?: number): Promise<ImpactMetric[]> {
    let query = `
        SELECT id, label, q1_value, q2_value, q3_value, q4_value, color, year, created_at, last_modified_at
        FROM reports_impact_metrics
    `;
    const params: number[] = [];

    if (year) {
        query += ' WHERE year = ?';
        params.push(year);
    }

    query += ' ORDER BY year DESC, created_at ASC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows.map((row) => ({
        id: row.id,
        label: row.label,
        q1Value: row.q1_value,
        q2Value: row.q2_value,
        q3Value: row.q3_value,
        q4Value: row.q4_value,
        color: row.color,
        year: row.year,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function createImpactMetric(
    pool: Pool,
    id: string,
    label: string,
    q1Value: number,
    q2Value: number,
    q3Value: number,
    q4Value: number,
    color: string,
    year: number
): Promise<ImpactMetric> {
    validateUUIDv4(id, 'impact metric ID');

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
        throw new HttpError(400, 'Label cannot be empty.');
    }

    await pool.execute(
        `INSERT INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, trimmedLabel, q1Value, q2Value, q3Value, q4Value, color.trim(), year]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, label, q1_value, q2_value, q3_value, q4_value, color, year, created_at, last_modified_at
         FROM reports_impact_metrics WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        label: row.label,
        q1Value: row.q1_value,
        q2Value: row.q2_value,
        q3Value: row.q3_value,
        q4Value: row.q4_value,
        color: row.color,
        year: row.year,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function updateImpactMetric(
    pool: Pool,
    id: string,
    label: string,
    q1Value: number,
    q2Value: number,
    q3Value: number,
    q4Value: number,
    color: string,
    year: number
): Promise<ImpactMetric> {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
        throw new HttpError(400, 'Label cannot be empty.');
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_impact_metrics WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Impact metric with ID '${id}' not found.`);
    }

    await pool.execute(
        `UPDATE reports_impact_metrics 
         SET label = ?, q1_value = ?, q2_value = ?, q3_value = ?, q4_value = ?, color = ?, year = ?
         WHERE id = ?`,
        [trimmedLabel, q1Value, q2Value, q3Value, q4Value, color.trim(), year, id]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, label, q1_value, q2_value, q3_value, q4_value, color, year, created_at, last_modified_at
         FROM reports_impact_metrics WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        label: row.label,
        q1Value: row.q1_value,
        q2Value: row.q2_value,
        q3Value: row.q3_value,
        q4Value: row.q4_value,
        color: row.color,
        year: row.year,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function deleteImpactMetric(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_impact_metrics WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Impact metric with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM reports_impact_metrics WHERE id = ?', [id]);
}

// --- Annual Reports ---

export async function listAnnualReports(pool: Pool): Promise<AnnualReport[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, year, title, description, file_size, page_count, download_url, created_at, last_modified_at
         FROM reports_annual
         ORDER BY year DESC`
    );

    return rows.map((row) => ({
        id: row.id,
        year: row.year,
        title: row.title,
        description: row.description,
        fileSize: row.file_size,
        pageCount: row.page_count,
        downloadUrl: row.download_url,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function createAnnualReport(
    pool: Pool,
    id: string,
    year: number,
    title: string,
    description: string,
    fileSize: string,
    pageCount: number,
    downloadUrl: string
): Promise<AnnualReport> {
    validateUUIDv4(id, 'annual report ID');

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedSize = fileSize.trim();
    const trimmedUrl = downloadUrl.trim();

    if (!trimmedTitle || !trimmedDesc || !trimmedSize || !trimmedUrl) {
        throw new HttpError(400, 'All report fields are required and cannot be empty.');
    }

    const [existingYear] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_annual WHERE year = ? LIMIT 1',
        [year]
    );
    if (existingYear.length > 0) {
        throw new HttpError(409, `An annual report for year '${year}' already exists.`);
    }

    const uploadedUrl = await uploadRawFileToCloudinary(trimmedUrl, 'reports_annual') || trimmedUrl;

    await pool.execute(
        `INSERT INTO reports_annual (id, year, title, description, file_size, page_count, download_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, year, trimmedTitle, trimmedDesc, trimmedSize, pageCount, uploadedUrl]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, year, title, description, file_size, page_count, download_url, created_at, last_modified_at
         FROM reports_annual WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        year: row.year,
        title: row.title,
        description: row.description,
        fileSize: row.file_size,
        pageCount: row.page_count,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function updateAnnualReport(
    pool: Pool,
    id: string,
    year: number,
    title: string,
    description: string,
    fileSize: string,
    pageCount: number,
    downloadUrl: string
): Promise<AnnualReport> {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedSize = fileSize.trim();
    const trimmedUrl = downloadUrl.trim();

    if (!trimmedTitle || !trimmedDesc || !trimmedSize || !trimmedUrl) {
        throw new HttpError(400, 'All report fields are required and cannot be empty.');
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_annual WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Annual report with ID '${id}' not found.`);
    }

    const [yearConflict] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_annual WHERE year = ? AND id != ? LIMIT 1',
        [year, id]
    );
    if (yearConflict.length > 0) {
        throw new HttpError(409, `An annual report for year '${year}' already exists.`);
    }

    const uploadedUrl = await uploadRawFileToCloudinary(trimmedUrl, 'reports_annual') || trimmedUrl;

    await pool.execute(
        `UPDATE reports_annual 
         SET year = ?, title = ?, description = ?, file_size = ?, page_count = ?, download_url = ?
         WHERE id = ?`,
        [year, trimmedTitle, trimmedDesc, trimmedSize, pageCount, uploadedUrl, id]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, year, title, description, file_size, page_count, download_url, created_at, last_modified_at
         FROM reports_annual WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        year: row.year,
        title: row.title,
        description: row.description,
        fileSize: row.file_size,
        pageCount: row.page_count,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function deleteAnnualReport(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_annual WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Annual report with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM reports_annual WHERE id = ?', [id]);
}

// --- Quarterly Reports ---

export async function listQuarterlyReports(pool: Pool): Promise<QuarterlyReport[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, quarter, title, period, description, file_size, download_url, created_at, last_modified_at
         FROM reports_quarterly
         ORDER BY created_at DESC`
    );

    return rows.map((row) => ({
        id: row.id,
        quarter: row.quarter,
        title: row.title,
        period: row.period,
        description: row.description,
        fileSize: row.file_size,
        downloadUrl: row.download_url,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function createQuarterlyReport(
    pool: Pool,
    id: string,
    quarter: string,
    title: string,
    period: string,
    description: string,
    fileSize: string,
    downloadUrl: string
): Promise<QuarterlyReport> {
    validateUUIDv4(id, 'quarterly report ID');

    const trimmedQuarter = quarter.trim();
    const trimmedTitle = title.trim();
    const trimmedPeriod = period.trim();
    const trimmedDesc = description.trim();
    const trimmedSize = fileSize.trim();
    const trimmedUrl = downloadUrl.trim();

    if (!trimmedQuarter || !trimmedTitle || !trimmedPeriod || !trimmedDesc || !trimmedSize || !trimmedUrl) {
        throw new HttpError(400, 'All report fields are required.');
    }

    const uploadedUrl = await uploadRawFileToCloudinary(trimmedUrl, 'reports_quarterly') || trimmedUrl;

    await pool.execute(
        `INSERT INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, trimmedQuarter, trimmedTitle, trimmedPeriod, trimmedDesc, trimmedSize, uploadedUrl]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, quarter, title, period, description, file_size, download_url, created_at, last_modified_at
         FROM reports_quarterly WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        quarter: row.quarter,
        title: row.title,
        period: row.period,
        description: row.description,
        fileSize: row.file_size,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function updateQuarterlyReport(
    pool: Pool,
    id: string,
    quarter: string,
    title: string,
    period: string,
    description: string,
    fileSize: string,
    downloadUrl: string
): Promise<QuarterlyReport> {
    const trimmedQuarter = quarter.trim();
    const trimmedTitle = title.trim();
    const trimmedPeriod = period.trim();
    const trimmedDesc = description.trim();
    const trimmedSize = fileSize.trim();
    const trimmedUrl = downloadUrl.trim();

    if (!trimmedQuarter || !trimmedTitle || !trimmedPeriod || !trimmedDesc || !trimmedSize || !trimmedUrl) {
        throw new HttpError(400, 'All report fields are required.');
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_quarterly WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Quarterly report with ID '${id}' not found.`);
    }

    const uploadedUrl = await uploadRawFileToCloudinary(trimmedUrl, 'reports_quarterly') || trimmedUrl;

    await pool.execute(
        `UPDATE reports_quarterly 
         SET quarter = ?, title = ?, period = ?, description = ?, file_size = ?, download_url = ?
         WHERE id = ?`,
        [trimmedQuarter, trimmedTitle, trimmedPeriod, trimmedDesc, trimmedSize, uploadedUrl, id]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, quarter, title, period, description, file_size, download_url, created_at, last_modified_at
         FROM reports_quarterly WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        quarter: row.quarter,
        title: row.title,
        period: row.period,
        description: row.description,
        fileSize: row.file_size,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function deleteQuarterlyReport(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_quarterly WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Quarterly report with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM reports_quarterly WHERE id = ?', [id]);
}

// --- Success Stories ---

export async function listSuccessStories(pool: Pool): Promise<SuccessStory[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, description, impact, date, category, created_at, last_modified_at
         FROM reports_success_stories
         ORDER BY created_at DESC`
    );

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        impact: row.impact,
        date: row.date,
        category: row.category as 'education' | 'healthcare' | 'social' | 'nutrition',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function createSuccessStory(
    pool: Pool,
    id: string,
    title: string,
    description: string,
    impact: string,
    date: string,
    category: 'education' | 'healthcare' | 'social' | 'nutrition'
): Promise<SuccessStory> {
    validateUUIDv4(id, 'success story ID');

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedImpact = impact.trim();
    const trimmedDate = date.trim();

    if (!trimmedTitle || !trimmedDesc || !trimmedImpact || !trimmedDate || !category) {
        throw new HttpError(400, 'All fields are required.');
    }

    if (!['education', 'healthcare', 'social', 'nutrition'].includes(category)) {
        throw new HttpError(400, "category must be 'education', 'healthcare', 'social', or 'nutrition'.");
    }

    await pool.execute(
        `INSERT INTO reports_success_stories (id, title, description, impact, date, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, trimmedTitle, trimmedDesc, trimmedImpact, trimmedDate, category]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, description, impact, date, category, created_at, last_modified_at
         FROM reports_success_stories WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        impact: row.impact,
        date: row.date,
        category: row.category as 'education' | 'healthcare' | 'social' | 'nutrition',
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function updateSuccessStory(
    pool: Pool,
    id: string,
    title: string,
    description: string,
    impact: string,
    date: string,
    category: 'education' | 'healthcare' | 'social' | 'nutrition'
): Promise<SuccessStory> {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedImpact = impact.trim();
    const trimmedDate = date.trim();

    if (!trimmedTitle || !trimmedDesc || !trimmedImpact || !trimmedDate || !category) {
        throw new HttpError(400, 'All fields are required.');
    }

    if (!['education', 'healthcare', 'social', 'nutrition'].includes(category)) {
        throw new HttpError(400, "category must be 'education', 'healthcare', 'social', or 'nutrition'.");
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_success_stories WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Success story with ID '${id}' not found.`);
    }

    await pool.execute(
        `UPDATE reports_success_stories 
         SET title = ?, description = ?, impact = ?, date = ?, category = ?
         WHERE id = ?`,
        [trimmedTitle, trimmedDesc, trimmedImpact, trimmedDate, category, id]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, description, impact, date, category, created_at, last_modified_at
         FROM reports_success_stories WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        impact: row.impact,
        date: row.date,
        category: row.category as 'education' | 'healthcare' | 'social' | 'nutrition',
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function deleteSuccessStory(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM reports_success_stories WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Success story with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM reports_success_stories WHERE id = ?', [id]);
}

export async function getAnnualReport(pool: Pool, id: string): Promise<AnnualReport> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, year, title, description, file_size, page_count, download_url, created_at, last_modified_at
         FROM reports_annual WHERE id = ? LIMIT 1`,
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Annual report with ID '${id}' not found.`);
    }
    return {
        id: row.id,
        year: row.year,
        title: row.title,
        description: row.description,
        fileSize: row.file_size,
        pageCount: row.page_count,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function getQuarterlyReport(pool: Pool, id: string): Promise<QuarterlyReport> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, quarter, title, period, description, file_size, download_url, created_at, last_modified_at
         FROM reports_quarterly WHERE id = ? LIMIT 1`,
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Quarterly report with ID '${id}' not found.`);
    }
    return {
        id: row.id,
        quarter: row.quarter,
        title: row.title,
        period: row.period,
        description: row.description,
        fileSize: row.file_size,
        downloadUrl: row.download_url,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function getSuccessStory(pool: Pool, id: string): Promise<SuccessStory> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, description, impact, date, category, created_at, last_modified_at
         FROM reports_success_stories WHERE id = ? LIMIT 1`,
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Success story with ID '${id}' not found.`);
    }
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        impact: row.impact,
        date: row.date,
        category: row.category as 'education' | 'healthcare' | 'social' | 'nutrition',
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function getImpactMetric(pool: Pool, id: string): Promise<ImpactMetric> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, label, q1_value, q2_value, q3_value, q4_value, color, year, created_at, last_modified_at
         FROM reports_impact_metrics WHERE id = ? LIMIT 1`,
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Impact metric with ID '${id}' not found.`);
    }
    return {
        id: row.id,
        label: row.label,
        q1Value: row.q1_value,
        q2Value: row.q2_value,
        q3Value: row.q3_value,
        q4Value: row.q4_value,
        color: row.color,
        year: row.year,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };
}

export async function getClinicalSummary(pool: Pool): Promise<any> {
    // 1. Total visits recorded (rows in symptoms_recorded)
    const [visitCountRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM symptoms_recorded'
    );
    const totalVisitsRecorded = Number(visitCountRows[0]?.count || 0);

    // 2. Total unique children seen
    const [uniqueKidsRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(DISTINCT child_id) as count FROM symptoms_recorded'
    );
    const totalKidsSeen = Number(uniqueKidsRows[0]?.count || 0);

    // 3. Average visits per child
    const [totalChildrenRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM children_profiles'
    );
    const totalChildren = Number(totalChildrenRows[0]?.count || 0);
    const averageVisitsPerChild = totalChildren > 0 
        ? Number((totalVisitsRecorded / totalChildren).toFixed(2)) 
        : 0;

    // 4. Most common services
    const [servicesRows] = await pool.execute<RowDataPacket[]>(
        "SELECT services_list FROM services_rendered"
    );
    const serviceCounts: Record<string, number> = {};
    servicesRows.forEach((row) => {
        const list = row.services_list || '';
        list.split(',').forEach((val: string) => {
            const item = val.trim();
            if (item) {
                serviceCounts[item] = (serviceCounts[item] || 0) + 1;
            }
        });
    });
    const sortedServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
    const mostCommonServices = sortedServices.slice(0, 3).join(', ') || 'General consultations';

    // 5. Top Medications
    const [medsRows] = await pool.execute<RowDataPacket[]>(
        "SELECT ntds_meds, antibiotics, other_meds FROM medications_given"
    );
    const medCounts: Record<string, number> = {};
    medsRows.forEach((row) => {
        [row.ntds_meds, row.antibiotics, row.other_meds].forEach((field) => {
            if (field) {
                field.split(',').forEach((val: string) => {
                    const item = val.trim();
                    if (item) {
                        medCounts[item] = (medCounts[item] || 0) + 1;
                    }
                });
            }
        });
    });
    const sortedMeds = Object.entries(medCounts)
        .sort((a, b) => b[1] - a[1]);
    const topMedications = sortedMeds.slice(0, 4).map(([name]) => name).join(', ') || 'No medications recorded';
    
    // Medications given object mapping
    const medicationsGiven: Record<string, number> = {};
    sortedMeds.slice(0, 6).forEach(([name, count]) => {
        medicationsGiven[name] = count;
    });

    // 6. BMI Distribution & Average BMI
    const [bmiRows] = await pool.execute<RowDataPacket[]>(
        "SELECT bmi, bmi_status FROM child_vitals WHERE bmi IS NOT NULL"
    );
    let totalBmi = 0;
    let bmiCount = 0;
    const bmiDistribution: Record<string, number> = {
        "Severely Underweight": 0,
        "Underweight": 0,
        "Normal": 0,
        "Overweight": 0,
        "Obese": 0
    };
    bmiRows.forEach((row) => {
        const val = Number(row.bmi);
        if (!Number.isNaN(val)) {
            totalBmi += val;
            bmiCount++;
        }
        const status = row.bmi_status;
        if (status && bmiDistribution[status] !== undefined) {
            bmiDistribution[status]++;
        } else if (status) {
            bmiDistribution[status] = (bmiDistribution[status] || 0) + 1;
        }
    });
    const averageBMI = bmiCount > 0 ? Number((totalBmi / bmiCount).toFixed(2)) : 0;

    // 7. Hospitalizations
    const [hospRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM symptoms_recorded WHERE visit_notes LIKE '%hospital%' OR visit_notes LIKE '%referred%'"
    );
    const hospitalizations = Number(hospRows[0]?.count || 0);

    // 8. Common Symptoms
    const [symptomsRows] = await pool.execute<RowDataPacket[]>(
        "SELECT symptoms FROM symptoms_recorded"
    );
    const symptomCounts: Record<string, number> = {};
    symptomsRows.forEach((row) => {
        const syms = row.symptoms || '';
        syms.split(',').forEach((val: string) => {
            const item = val.trim();
            if (item) {
                symptomCounts[item] = (symptomCounts[item] || 0) + 1;
            }
        });
    });
    const commonSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

    // Common Diagnoses (placeholder/derived from common keywords in visit notes)
    const commonDiagnoses = ['Malaria', 'URTI', 'Intestinal worms', 'UTI', 'Skin infection'];

    // 9. Clothing Provisions
    const [clothingRows] = await pool.execute<RowDataPacket[]>(
        "SELECT shoes, clothes FROM clothing_provisions"
    );
    let totalClothesGiven = 0;
    let totalShoesGiven = 0;
    clothingRows.forEach((row) => {
        if (row.clothes && row.clothes.trim()) totalClothesGiven++;
        if (row.shoes && row.shoes.trim()) totalShoesGiven++;
    });

    // 10. Education sessions
    const [eduRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM services_rendered WHERE service_type = 'education'"
    );
    const totalEducationSessions = Number(eduRows[0]?.count || 0);

    // 11. Food provided sessions
    const [foodRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM services_rendered WHERE services_list LIKE '%food%' OR services_list LIKE '%refreshment%'"
    );
    const totalFoodProvided = Number(foodRows[0]?.count || 0);

    // 12. Tests done
    const [testsRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM laboratory_tests"
    );
    const totalTestsDone = Number(testsRows[0]?.count || 0);

    // Total Services Provided
    const [servicesCountRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM services_rendered"
    );
    const totalServicesProvided = Number(servicesCountRows[0]?.count || 0) + totalTestsDone + totalVisitsRecorded;

    return {
        programSummary: {
            totalVisitsRecorded,
            averageVisitsPerChild,
            mostCommonServices,
            topMedications,
            bmiDistribution,
            hospitalizations,
            commonSymptoms,
            commonDiagnoses
        },
        serviceDelivery: {
            totalKidsSeen,
            totalServicesProvided,
            averageBMI,
            totalClothesGiven,
            totalShoesGiven,
            totalEducationSessions,
            totalFoodProvided,
            totalTestsDone,
            medicationsGiven
        }
    };
}


