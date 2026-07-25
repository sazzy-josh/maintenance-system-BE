"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./sockets/socket");
const db_1 = require("./config/db");
async function bootstrap() {
    // Ensure required roles exist (safe to run on every startup)
    const roles = [
        { name: 'REQUESTER', description: 'Students and staff who submit maintenance requests' },
        { name: 'OFFICER', description: 'Maintenance officers who handle and resolve requests' },
        { name: 'ADMIN', description: 'Administrators who manage the system' },
    ];
    for (const role of roles) {
        await db_1.prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
    }
    // Ensure default categories exist
    const categories = [
        { name: 'Electrical', description: 'Electrical faults and power issues', slaHours: 24 },
        { name: 'Plumbing', description: 'Plumbing and water supply issues', slaHours: 24 },
        { name: 'HVAC', description: 'Air conditioning and ventilation issues', slaHours: 48 },
        { name: 'Structural / Civil', description: 'Building structure, walls, floors, ceilings', slaHours: 72 },
        { name: 'Cleaning', description: 'Cleaning and sanitation requests', slaHours: 12 },
        { name: 'IT / Network', description: 'Internet, network and IT infrastructure issues', slaHours: 24 },
        { name: 'Furniture / Fixtures', description: 'Furniture damage and fixture repairs', slaHours: 48 },
        { name: 'Hostel Maintenance', description: 'Hostel-specific maintenance issues', slaHours: 24 },
        { name: 'Other', description: 'General maintenance requests', slaHours: 48 },
    ];
    for (const cat of categories) {
        await db_1.prisma.requestCategory.upsert({ where: { name: cat.name }, update: {}, create: { ...cat, isActive: true } });
    }
    console.log('✓ Bootstrap complete');
}
const server = http_1.default.createServer(app_1.default);
(0, socket_1.initSocket)(server);
const PORT = Number(process.env.PORT) || 5000;
bootstrap()
    .then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API docs: http://localhost:${PORT}/api/docs`);
        console.log(`Health: http://localhost:${PORT}/api/v1/health`);
    });
})
    .catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db_1.prisma.$disconnect();
    server.close();
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});
//# sourceMappingURL=server.js.map