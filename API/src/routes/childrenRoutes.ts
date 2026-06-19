import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as childrenService from '../services/childrenService.ts';
import * as clinicalService from '../services/clinicalService.ts';
import type { CreateChildProfileRequestBody, UpdateChildProfileRequestBody, Gender } from '../types/children.ts';

// Helper validations
function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function requireGender(value: unknown): Gender {
    if (value !== 'Male' && value !== 'Female') {
        throw new HttpError(400, "Gender is required and must be either 'Male' or 'Female'.");
    }
    return value as Gender;
}

function parseBirthYear(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const num = Number(value);
    if (!Number.isInteger(num)) {
        throw new HttpError(400, 'Estimated birth year must be an integer.');
    }
    return num;
}

function optionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, 'Value must be a string if provided.');
    }
    return value.trim();
}

function optionalImageString(value: unknown, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, `${fieldName} must be a string.`);
    }
    const trimmed = value.trim();
    if (
        trimmed.length > 0 && 
        !trimmed.startsWith('data:image/') && 
        !trimmed.startsWith('http://') && 
        !trimmed.startsWith('https://')
    ) {
        throw new HttpError(400, `${fieldName} must be a valid base64 image data URL or HTTP/HTTPS URL.`);
    }
    return trimmed;
}

export function createChildrenRouter(pool: Pool): Router {
    const router = Router();

    // 1. CREATE Child Profile
    router.post(
        '/',
        requirePermission(pool, 'children:create'),
        async (
            request: Request<unknown, unknown, CreateChildProfileRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = parseBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');

                // Auto-bind creator staff user ID from session token,
                // but allow explicit payload input for offline synchronization logs
                const sessionStaffId = request.authSession?.staffUserId;
                if (!sessionStaffId) {
                    throw new HttpError(401, 'No active authenticated session staff ID found.');
                }
                const bodyStaffId = optionalString(request.body.createdByStaffId);
                const createdByStaffId = bodyStaffId || sessionStaffId;

                const image1 = optionalImageString(request.body.image1, 'image1');
                const image2 = optionalImageString(request.body.image2, 'image2');
                const image3 = optionalImageString(request.body.image3, 'image3');

                const child = await childrenService.createChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId,
                    createdByStaffId,
                    image1,
                    image2,
                    image3
                );

                response.status(201).json({
                    message: 'Patient profile created successfully.',
                    child
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 2. LIST Child Profiles
    router.get(
        '/',
        requirePermission(pool, 'children:read'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const registrationDateRaw = request.query.registrationDate;
                const registrationDate = typeof registrationDateRaw === 'string' && registrationDateRaw.trim().length > 0
                    ? registrationDateRaw.trim()
                    : undefined;
                const children = await childrenService.listChildProfiles(pool, registrationDate);
                response.status(200).json({ children });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 3. GET Single Child Profile
    router.get(
        '/:id',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const child = await childrenService.getChildProfile(pool, id);

                response.status(200).json({ child });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 4. UPDATE Child Profile
    router.put(
        '/:id',
        requirePermission(pool, 'children:update'),
        async (
            request: Request<{ id: string }, unknown, UpdateChildProfileRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = parseBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');

                const image1 = optionalImageString(request.body.image1, 'image1');
                const image2 = optionalImageString(request.body.image2, 'image2');
                const image3 = optionalImageString(request.body.image3, 'image3');

                const child = await childrenService.updateChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId,
                    image1,
                    image2,
                    image3
                );

                response.status(200).json({
                    message: 'Patient profile updated successfully.',
                    child
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 5. DELETE Child Profile
    router.delete(
        '/:id',
        requirePermission(pool, 'children:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await childrenService.deleteChildProfile(pool, id);

                response.status(200).json({
                    message: 'Patient profile deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // === CLINICAL SUB-RESOURCES ===

    // Baseline
    router.post(
        '/:id/baseline',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const visitDate = requireString(request.body.visitDate, 'visitDate');
                const firstVisit = request.body.firstVisit === true || request.body.firstVisit === 1;
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveBaseline(pool, id, childId, visitDate, firstVisit, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Baseline information saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/baseline',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getBaseline(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/medical-records',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getBaseline(pool, childId);
                response.status(200).json(data ? [data] : []);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Vitals
    router.post(
        '/:id/vitals',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const weight = request.body.weight !== undefined && request.body.weight !== '' ? Number(request.body.weight) : null;
                const height = request.body.height !== undefined && request.body.height !== '' ? Number(request.body.height) : null;
                const bmi = request.body.bmi !== undefined && request.body.bmi !== '' ? Number(request.body.bmi) : null;
                const bmiStatus = optionalString(request.body.bmiStatus);
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);
                const date = requireString(request.body.date, 'date');

                const data = await clinicalService.saveVitals(pool, id, childId, weight, height, bmi, bmiStatus, recordedBy, recordedByName, date);
                response.status(200).json({ success: true, message: 'Vitals saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/vitals',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getVitalsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/nutritional-history',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getVitalsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Medications
    router.post(
        '/:id/medications',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const ntdsMeds = optionalString(request.body.ntdsMeds);
                const antibiotics = optionalString(request.body.antibiotics);
                const otherMeds = optionalString(request.body.otherMeds);
                const dateGiven = requireString(request.body.dateGiven, 'dateGiven');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveMedication(pool, id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Medication record saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/medications',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getMedicationsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Tests
    router.post(
        '/:id/tests',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const testType = requireString(request.body.testType, 'testType');
                const result = requireString(request.body.result, 'result');
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveTest(pool, id, childId, testType, result, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Test result saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/tests',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getTestsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/tests-history',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getTestsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Services
    router.post(
        '/:id/medical-services',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const servicesList = Array.isArray(request.body.services) ? request.body.services.join(', ') : requireString(request.body.services, 'services');
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveService(pool, id, childId, 'medical', servicesList, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Medical services saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/:id/social-services',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const servicesList = Array.isArray(request.body.services) ? request.body.services.join(', ') : requireString(request.body.services, 'services');
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveService(pool, id, childId, 'social', servicesList, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Social services saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/:id/education',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const servicesList = Array.isArray(request.body.education) ? request.body.education.join(', ') : requireString(request.body.education, 'education');
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveService(pool, id, childId, 'education', servicesList, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Education record saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/services',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getServicesHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/education-history',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getServicesHistory(pool, childId, 'education');
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Symptoms
    router.post(
        '/:id/symptoms',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const symptoms = optionalString(request.body.symptoms);
                const visitNotes = optionalString(request.body.visitNotes);
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveSymptoms(pool, id, childId, symptoms, visitNotes, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Symptoms saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/symptoms',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getSymptomsHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Clothing
    router.post(
        '/:id/clothing',
        requirePermission(pool, 'children:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const id = optionalString(request.body.id) || crypto.randomUUID();
                const shoes = optionalString(request.body.shoes);
                const clothes = optionalString(request.body.clothes);
                const date = requireString(request.body.date, 'date');
                const recordedBy = optionalString(request.body.recordedBy);
                const recordedByName = optionalString(request.body.recordedByName);

                const data = await clinicalService.saveClothing(pool, id, childId, shoes, clothes, date, recordedBy, recordedByName);
                response.status(200).json({ success: true, message: 'Clothing saved successfully.', data });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id/clothing',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.id, 'id');
                const data = await clinicalService.getClothingHistory(pool, childId);
                response.status(200).json(data);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
