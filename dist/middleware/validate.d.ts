import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const validate: (schema: ZodSchema, target?: "body" | "query" | "params") => (req: Request, _res: Response, next: NextFunction) => void;
