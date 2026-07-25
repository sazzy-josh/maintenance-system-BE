export declare class AppError extends Error {
    statusCode: number;
    code: string;
    errors?: {
        field: string;
        message: string;
    }[];
    constructor(statusCode: number, message: string, code?: string, errors?: {
        field: string;
        message: string;
    }[]);
}
