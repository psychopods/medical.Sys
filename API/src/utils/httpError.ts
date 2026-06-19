export class HttpError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

export function toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
        return error;
    }

    if (error instanceof Error) {
        return new HttpError(500, error.message);
    }

    return new HttpError(500, 'Unexpected server error.');
}
