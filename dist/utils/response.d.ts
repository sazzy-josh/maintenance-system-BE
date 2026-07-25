import { Response } from 'express';
interface Meta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}
export declare const success: (res: Response, data: unknown, message?: string, statusCode?: number, meta?: Meta) => Response<any, Record<string, any>>;
export declare const created: (res: Response, data: unknown, message?: string) => Response<any, Record<string, any>>;
export declare const noContent: (res: Response) => Response<any, Record<string, any>>;
export {};
