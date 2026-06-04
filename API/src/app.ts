import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import pool from './config/database.ts';
import { createAuthRouter } from './routes/authRoutes.ts';
import { createBiometricsRouter } from './routes/biometricsRoutes.ts';
import { createChildrenRouter } from './routes/childrenRoutes.ts';
import { createIdentityRouter } from './routes/identityRoutes.ts';
import { createLocationsRouter } from './routes/locationsRoutes.ts';
import { createNotificationsRouter } from './routes/notificationsRoutes.ts';
import { createRbacRouter } from './routes/rbacRoutes.ts';
import { createSyncRouter } from './routes/syncDelta.ts';
import { createGalleryRouter } from './routes/galleryRoutes.ts';
import { createReportsRouter } from './routes/reportsRoutes.ts';
import { createVolunteerRouter } from './routes/volunteerRoutes.ts';
import { createContactRouter } from './routes/contactRoutes.ts';
import { HttpError, toHttpError } from './utils/httpError.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
});

app.use('/api/auth', createAuthRouter(pool));
app.use('/api/biometrics', createBiometricsRouter(pool));
app.use('/api/children', createChildrenRouter(pool));
app.use('/api/identity', createIdentityRouter(pool));
app.use('/api/locations', createLocationsRouter(pool));
app.use('/api/notifications', createNotificationsRouter(pool));
app.use('/api/gallery', createGalleryRouter(pool));
app.use('/api/reports', createReportsRouter(pool));
app.use('/api/volunteer', createVolunteerRouter(pool));
app.use('/api/contact', createContactRouter(pool));
app.use('/api', createRbacRouter(pool));
app.use('/api/sync', createSyncRouter(pool));

app.use((_request: Request, _response: Response, next: NextFunction) => {
    next(new HttpError(404, 'Route not found.'));
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const httpError = toHttpError(error);

    response.status(httpError.statusCode).json({
        message: httpError.message
    });
});

export default app;
