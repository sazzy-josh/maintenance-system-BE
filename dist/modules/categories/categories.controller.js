"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.listCategories = void 0;
const categoriesService = __importStar(require("./categories.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
exports.listCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN';
    const categories = await categoriesService.listCategories(includeInactive);
    return (0, response_1.success)(res, categories);
});
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await categoriesService.createCategory(req.body);
    return (0, response_1.created)(res, category, 'Category created');
});
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    return (0, response_1.success)(res, category, 'Category updated');
});
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await categoriesService.deleteCategory(req.params.id);
    if (result.deactivated) {
        return (0, response_1.success)(res, null, 'Category has requests — deactivated instead of deleted');
    }
    return (0, response_1.success)(res, null, 'Category deleted');
});
//# sourceMappingURL=categories.controller.js.map