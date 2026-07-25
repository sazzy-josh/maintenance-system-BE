"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const AppError_1 = require("../utils/AppError");
const validate = (schema, target = 'body') => (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return next(new AppError_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
    }
    req[target] = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map