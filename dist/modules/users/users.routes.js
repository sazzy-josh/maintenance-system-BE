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
const usersController = __importStar(require("./users.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const validate_1 = require("../../middleware/validate");
const users_schema_1 = require("./users.schema");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Forbidden }
 */
router.get('/', (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(users_schema_1.listUsersSchema, 'query'), usersController.listUsers);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user with any role (admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, matricOrStaffId, password, role]
 *     responses:
 *       201: { description: User created }
 *       403: { description: Forbidden }
 */
router.post('/', (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(users_schema_1.createUserSchema), usersController.createUser);
/**
 * @swagger
 * /users/officers:
 *   get:
 *     summary: Get officers with active job counts (admin only)
 *     tags: [Users]
 *     responses:
 *       200: { description: Officers list }
 */
router.get('/officers', (0, authorize_1.authorize)('ADMIN'), usersController.getOfficers);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User data }
 *       403: { description: Forbidden (non-admin accessing others) }
 *       404: { description: Not found }
 */
router.get('/:id', usersController.getUser);
/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User updated }
 */
router.patch('/:id', (0, validate_1.validate)(users_schema_1.updateUserSchema), usersController.updateUser);
/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Role changed }
 *       403: { description: Forbidden }
 */
router.patch('/:id/role', (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(users_schema_1.changeRoleSchema), usersController.changeRole);
/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Status changed }
 */
router.patch('/:id/status', (0, authorize_1.authorize)('ADMIN'), usersController.changeStatus);
exports.default = router;
//# sourceMappingURL=users.routes.js.map