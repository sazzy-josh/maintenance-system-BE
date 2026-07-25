import { Request, Response } from 'express';
export declare const getNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUnreadCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markAllRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
