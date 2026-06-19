import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as contactService from '../services/contactService.ts';
import type { CreateContactSubmissionBody } from '../types/contact.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

export function createContactRouter(pool: Pool): Router {
    const router = Router();

    // --- Public Endpoint ---

    router.post(
        '/submit',
        async (
            request: Request<unknown, unknown, CreateContactSubmissionBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const fullName = requireString(request.body.full_name, 'full_name');
                const emailAddress = requireString(request.body.email_address, 'email_address');
                const subject = requireString(request.body.message_subject, 'message_subject');
                const message = requireString(request.body.message_content, 'message_content');

                const submission = await contactService.submitContactForm(
                    pool,
                    fullName,
                    emailAddress,
                    subject,
                    message
                );

                response.status(201).json({
                    success: true,
                    message: "Message sent successfully! We'll contact you soon.",
                    submission
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // --- Admin Endpoints ---

    router.get(
        '/submissions',
        requirePermission(pool, 'support:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const submissions = await contactService.listContactSubmissions(pool);
                response.status(200).json({ success: true, submissions });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/submissions/:id',
        requirePermission(pool, 'support:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await contactService.deleteContactSubmission(pool, id);
                response.status(200).json({ success: true, message: 'Contact submission deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/submissions',
        requirePermission(pool, 'support:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const fullName = requireString(request.body.fullName || request.body.full_name, 'fullName');
                const emailAddress = requireString(request.body.emailAddress || request.body.email_address, 'emailAddress');
                const subject = requireString(request.body.messageSubject || request.body.message_subject, 'subject');
                const message = requireString(request.body.messageContent || request.body.message_content, 'message');

                const result = await contactService.submitContactFormWithId(
                    pool,
                    id,
                    fullName,
                    emailAddress,
                    subject,
                    message
                );
                response.status(201).json({ success: true, message: 'Contact submission created successfully.', submission: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/submissions/:id',
        requirePermission(pool, 'support:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await contactService.getContactSubmission(pool, id);
                response.status(200).json({ success: true, submission: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/submissions/:id',
        requirePermission(pool, 'support:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const fullName = requireString(request.body.fullName || request.body.full_name, 'fullName');
                const emailAddress = requireString(request.body.emailAddress || request.body.email_address, 'emailAddress');
                const subject = requireString(request.body.messageSubject || request.body.message_subject, 'subject');
                const message = requireString(request.body.messageContent || request.body.message_content, 'message');

                const result = await contactService.updateContactSubmission(
                    pool,
                    id,
                    fullName,
                    emailAddress,
                    subject,
                    message
                );
                response.status(200).json({ success: true, message: 'Contact submission updated successfully.', submission: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
