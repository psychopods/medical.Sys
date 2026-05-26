import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import pool from './config/database.ts';
import { createAuthRouter } from './routes/authRoutes.ts';
import { createRbacRouter } from './routes/rbacRoutes.ts';
import { HttpError, toHttpError } from './utils/httpError.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
});

app.use('/api/auth', createAuthRouter(pool));
app.use('/api/rbac', createRbacRouter(pool));

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
