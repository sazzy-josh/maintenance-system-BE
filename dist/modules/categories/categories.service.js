"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.listCategories = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const listCategories = async (includeInactive = false) => {
    return db_1.prisma.requestCategory.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
    });
};
exports.listCategories = listCategories;
const createCategory = async (data) => {
    return db_1.prisma.requestCategory.create({ data });
};
exports.createCategory = createCategory;
const updateCategory = async (id, data) => {
    const category = await db_1.prisma.requestCategory.findUnique({ where: { id } });
    if (!category)
        throw new AppError_1.AppError(404, 'Category not found', 'NOT_FOUND');
    return db_1.prisma.requestCategory.update({ where: { id }, data });
};
exports.updateCategory = updateCategory;
const deleteCategory = async (id) => {
    const category = await db_1.prisma.requestCategory.findUnique({
        where: { id },
        include: { requests: { take: 1 } },
    });
    if (!category)
        throw new AppError_1.AppError(404, 'Category not found', 'NOT_FOUND');
    if (category.requests.length > 0) {
        await db_1.prisma.requestCategory.update({ where: { id }, data: { isActive: false } });
        return { deactivated: true };
    }
    await db_1.prisma.requestCategory.delete({ where: { id } });
    return { deleted: true };
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categories.service.js.map