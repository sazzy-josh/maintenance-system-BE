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
const express_1 = require("express");
const categoriesController = __importStar(require("./categories.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1),
    slaHours: zod_1.z.number().int().positive().optional(),
});
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include inactive (admin only)
 *     responses:
 *       200: { description: Categories list }
 */
router.get('/', categoriesController.listCategories);
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     responses:
 *       201: { description: Category created }
 */
router.post('/', (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(categorySchema), categoriesController.createCategory);
/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category updated }
 */
router.patch('/:id', (0, authorize_1.authorize)('ADMIN'), categoriesController.updateCategory);
/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete or deactivate a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category deleted or deactivated }
 */
router.delete('/:id', (0, authorize_1.authorize)('ADMIN'), categoriesController.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.routes.js.map