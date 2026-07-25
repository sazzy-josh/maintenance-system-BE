import { Request, Response, NextFunction } from 'express';
export declare const authorize: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
