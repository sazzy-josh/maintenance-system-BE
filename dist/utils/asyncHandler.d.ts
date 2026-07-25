import { Request, Response, NextFunction } from 'express';
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare const asyncHandler: (fn: AsyncFn) => (req: Request, res: Response, next: NextFunction) => void;
export {};
