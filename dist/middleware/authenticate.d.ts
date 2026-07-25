import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                roleId: string;
            };
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
