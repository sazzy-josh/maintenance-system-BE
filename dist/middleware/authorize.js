"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const AppError_1 = require("../utils/AppError");
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
    if (!roles.includes(req.user.role)) {
        return next(new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=authorize.js.map