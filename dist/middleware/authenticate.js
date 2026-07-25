"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const AppError_1 = require("../utils/AppError");
const authenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError_1.AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { role: true },
        });
        if (!user) {
            return next(new AppError_1.AppError(401, 'User not found', 'UNAUTHENTICATED'));
        }
        if (!user.isActive) {
            return next(new AppError_1.AppError(403, 'Account is inactive', 'INACTIVE_ACCOUNT'));
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            roleId: user.roleId,
        };
        next();
    }
    catch {
        return next(new AppError_1.AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authenticate.js.map