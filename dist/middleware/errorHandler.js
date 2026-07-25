"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const errorHandler = (err, req, res, _next) => {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(err.errors && { errors: err.errors }),
        });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = err.meta?.target;
            const field = Array.isArray(target) ? target[0] : 'field';
            return res.status(409).json({
                success: false,
                message: `A record with this ${field} already exists`,
                code: 'DUPLICATE_ENTRY',
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
                code: 'NOT_FOUND',
            });
        }
    }
    console.error(`[${req.headers['x-request-id']}]`, err);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        code: 'INTERNAL_ERROR',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map