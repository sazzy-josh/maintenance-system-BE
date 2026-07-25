import { Request, Response } from 'express';
export declare const assignRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const reassignRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMyAssignments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getRequestAssignments: (req: Request, res: Response, next: import("express").NextFunction) => void;
