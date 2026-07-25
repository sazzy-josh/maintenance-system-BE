import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const refresh: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const me: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
