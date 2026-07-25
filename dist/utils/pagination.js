"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeta = exports.getPagination = void 0;
const getPagination = (page = 1, limit = 10) => {
    const take = Math.min(Number(limit), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    return { skip, take };
};
exports.getPagination = getPagination;
const getMeta = (total, page, limit) => ({
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
});
exports.getMeta = getMeta;
//# sourceMappingURL=pagination.js.map