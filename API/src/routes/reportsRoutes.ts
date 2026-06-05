import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as reportsService from '../services/reportsService.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function requireNumber(value: unknown, fieldName: string): number {
    const num = Number(value);
    if (value === undefined || value === null || Number.isNaN(num)) {
        throw new HttpError(400, `${fieldName} is required and must be a valid number.`);
    }
    return num;
}

export function createReportsRouter(pool: Pool): Router {
    const router = Router();

    // --- Public Endpoints ---

    router.get('/impact-data', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const yearVal = request.query.year ? Number(request.query.year) : undefined;
            const impactData = await reportsService.getImpactData(pool, yearVal);
            response.status(200).json(impactData);
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.get('/annual', async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const reports = await reportsService.listAnnualReports(pool);
            response.status(200).json({ success: true, reports });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.get('/quarterly', async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const reports = await reportsService.listQuarterlyReports(pool);
            response.status(200).json({ success: true, reports });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.get('/success-stories', async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const stories = await reportsService.listSuccessStories(pool);
            response.status(200).json({ success: true, stories });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    // --- Admin Endpoints: Annual Reports ---

    router.post(
        '/annual',
        requirePermission(pool, 'reports:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const year = requireNumber(request.body.year, 'year');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const fileSize = requireString(request.body.fileSize, 'fileSize');
                const pageCount = requireNumber(request.body.pageCount, 'pageCount');
                const downloadUrl = requireString(request.body.downloadUrl, 'downloadUrl');

                const report = await reportsService.createAnnualReport(
                    pool,
                    id,
                    year,
                    title,
                    description,
                    fileSize,
                    pageCount,
                    downloadUrl
                );
                response.status(201).json({ success: true, message: 'Annual report created successfully.', report });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/annual/:id',
        requirePermission(pool, 'reports:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const year = requireNumber(request.body.year, 'year');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const fileSize = requireString(request.body.fileSize, 'fileSize');
                const pageCount = requireNumber(request.body.pageCount, 'pageCount');
                const downloadUrl = requireString(request.body.downloadUrl, 'downloadUrl');

                const report = await reportsService.updateAnnualReport(
                    pool,
                    id,
                    year,
                    title,
                    description,
                    fileSize,
                    pageCount,
                    downloadUrl
                );
                response.status(200).json({ success: true, message: 'Annual report updated successfully.', report });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/annual/:id',
        requirePermission(pool, 'reports:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await reportsService.deleteAnnualReport(pool, id);
                response.status(200).json({ success: true, message: 'Annual report deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // --- Admin Endpoints: Quarterly Reports ---

    router.post(
        '/quarterly',
        requirePermission(pool, 'reports:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const quarter = requireString(request.body.quarter, 'quarter');
                const title = requireString(request.body.title, 'title');
                const period = requireString(request.body.period, 'period');
                const description = requireString(request.body.description, 'description');
                const fileSize = requireString(request.body.fileSize, 'fileSize');
                const downloadUrl = requireString(request.body.downloadUrl, 'downloadUrl');

                const report = await reportsService.createQuarterlyReport(
                    pool,
                    id,
                    quarter,
                    title,
                    period,
                    description,
                    fileSize,
                    downloadUrl
                );
                response.status(201).json({ success: true, message: 'Quarterly report created successfully.', report });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/quarterly/:id',
        requirePermission(pool, 'reports:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const quarter = requireString(request.body.quarter, 'quarter');
                const title = requireString(request.body.title, 'title');
                const period = requireString(request.body.period, 'period');
                const description = requireString(request.body.description, 'description');
                const fileSize = requireString(request.body.fileSize, 'fileSize');
                const downloadUrl = requireString(request.body.downloadUrl, 'downloadUrl');

                const report = await reportsService.updateQuarterlyReport(
                    pool,
                    id,
                    quarter,
                    title,
                    period,
                    description,
                    fileSize,
                    downloadUrl
                );
                response.status(200).json({ success: true, message: 'Quarterly report updated successfully.', report });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/quarterly/:id',
        requirePermission(pool, 'reports:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await reportsService.deleteQuarterlyReport(pool, id);
                response.status(200).json({ success: true, message: 'Quarterly report deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // --- Admin Endpoints: Success Stories ---

    router.post(
        '/success-stories',
        requirePermission(pool, 'reports:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const impact = requireString(request.body.impact, 'impact');
                const date = requireString(request.body.date, 'date');
                const category = requireString(request.body.category, 'category') as any;

                const story = await reportsService.createSuccessStory(
                    pool,
                    id,
                    title,
                    description,
                    impact,
                    date,
                    category
                );
                response.status(201).json({ success: true, message: 'Success story created successfully.', story });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/success-stories/:id',
        requirePermission(pool, 'reports:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const impact = requireString(request.body.impact, 'impact');
                const date = requireString(request.body.date, 'date');
                const category = requireString(request.body.category, 'category') as any;

                const story = await reportsService.updateSuccessStory(
                    pool,
                    id,
                    title,
                    description,
                    impact,
                    date,
                    category
                );
                response.status(200).json({ success: true, message: 'Success story updated successfully.', story });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/success-stories/:id',
        requirePermission(pool, 'reports:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await reportsService.deleteSuccessStory(pool, id);
                response.status(200).json({ success: true, message: 'Success story deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // --- Admin Endpoints: Impact Metrics ---

    router.get(
        '/metrics',
        requirePermission(pool, 'reports:read'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const yearVal = request.query.year ? Number(request.query.year) : undefined;
                const metrics = await reportsService.listImpactMetrics(pool, yearVal);
                response.status(200).json({ success: true, metrics });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/metrics',
        requirePermission(pool, 'reports:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const label = requireString(request.body.label, 'label');
                const q1Value = requireNumber(request.body.q1Value, 'q1Value');
                const q2Value = requireNumber(request.body.q2Value, 'q2Value');
                const q3Value = requireNumber(request.body.q3Value, 'q3Value');
                const q4Value = requireNumber(request.body.q4Value, 'q4Value');
                const color = requireString(request.body.color, 'color');
                const year = requireNumber(request.body.year, 'year');

                const metric = await reportsService.createImpactMetric(
                    pool,
                    id,
                    label,
                    q1Value,
                    q2Value,
                    q3Value,
                    q4Value,
                    color,
                    year
                );
                response.status(201).json({ success: true, message: 'Impact metric created successfully.', metric });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/metrics/:id',
        requirePermission(pool, 'reports:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const label = requireString(request.body.label, 'label');
                const q1Value = requireNumber(request.body.q1Value, 'q1Value');
                const q2Value = requireNumber(request.body.q2Value, 'q2Value');
                const q3Value = requireNumber(request.body.q3Value, 'q3Value');
                const q4Value = requireNumber(request.body.q4Value, 'q4Value');
                const color = requireString(request.body.color, 'color');
                const year = requireNumber(request.body.year, 'year');

                const metric = await reportsService.updateImpactMetric(
                    pool,
                    id,
                    label,
                    q1Value,
                    q2Value,
                    q3Value,
                    q4Value,
                    color,
                    year
                );
                response.status(200).json({ success: true, message: 'Impact metric updated successfully.', metric });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/metrics/:id',
        requirePermission(pool, 'reports:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await reportsService.deleteImpactMetric(pool, id);
                response.status(200).json({ success: true, message: 'Impact metric deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/annual/:id',
        requirePermission(pool, 'reports:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await reportsService.getAnnualReport(pool, id);
                response.status(200).json({ success: true, report: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/quarterly/:id',
        requirePermission(pool, 'reports:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await reportsService.getQuarterlyReport(pool, id);
                response.status(200).json({ success: true, report: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/success-stories/:id',
        requirePermission(pool, 'reports:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await reportsService.getSuccessStory(pool, id);
                response.status(200).json({ success: true, story: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/metrics/:id',
        requirePermission(pool, 'reports:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await reportsService.getImpactMetric(pool, id);
                response.status(200).json({ success: true, metric: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
