"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noContent = exports.created = exports.success = void 0;
const success = (res, data, message = 'Success', statusCode = 200, meta) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta && { meta }),
    });
};
exports.success = success;
const created = (res, data, message = 'Created') => (0, exports.success)(res, data, message, 201);
exports.created = created;
const noContent = (res) => res.status(204).send();
exports.noContent = noContent;
//# sourceMappingURL=response.js.map