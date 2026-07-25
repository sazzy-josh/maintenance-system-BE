import { Request, Response } from 'express';
export declare const getSummary: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getByCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getByOfficer: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMonthlyTrend: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const exportCsv: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const exportPdf: (req: Request, res: Response, next: import("express").NextFunction) => void;
