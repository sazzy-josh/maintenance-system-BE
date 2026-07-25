import 'dotenv/config'
import http from 'http'
import bcrypt from 'bcryptjs'
import app from './app'
import { initSocket } from './sockets/socket'
import { prisma } from './config/db'

async function bootstrap() {
  // Ensure required roles exist (safe to run on every startup)
  const roles = [
    { name: 'REQUESTER' as const, description: 'Students and staff who submit maintenance requests' },
    { name: 'OFFICER'   as const, description: 'Maintenance officers who handle and resolve requests' },
    { name: 'ADMIN'     as const, description: 'Administrators who manage the system' },
  ]
  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role })
  }

  // Ensure default categories exist
  const categories = [
    { name: 'Electrical',           description: 'Electrical faults and power issues',             slaHours: 24 },
    { name: 'Plumbing',             description: 'Plumbing and water supply issues',               slaHours: 24 },
    { name: 'HVAC',                 description: 'Air conditioning and ventilation issues',        slaHours: 48 },
    { name: 'Structural / Civil',   description: 'Building structure, walls, floors, ceilings',   slaHours: 72 },
    { name: 'Cleaning',             description: 'Cleaning and sanitation requests',               slaHours: 12 },
    { name: 'IT / Network',         description: 'Internet, network and IT infrastructure issues', slaHours: 24 },
    { name: 'Furniture / Fixtures', description: 'Furniture damage and fixture repairs',           slaHours: 48 },
    { name: 'Hostel Maintenance',   description: 'Hostel-specific maintenance issues',             slaHours: 24 },
    { name: 'Other',                description: 'General maintenance requests',                   slaHours: 48 },
  ]
  for (const cat of categories) {
    await prisma.requestCategory.upsert({ where: { name: cat.name }, update: {}, create: { ...cat, isActive: true } })
  }

  // Seed initial admin user if env vars are provided
  const adminEmail    = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName     = process.env.ADMIN_NAME || 'System Admin'
  if (adminEmail && adminPassword) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    if (adminRole) {
      const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
      if (!existing) {
        const hash = await bcrypt.hash(adminPassword, 12)
        await prisma.user.create({
          data: {
            email: adminEmail,
            fullName: adminName,
            matricOrStaffId: 'ADMIN001',
            passwordHash: hash,
            roleId: adminRole.id,
            isActive: true,
          },
        })
        console.log(`✓ Admin user created: ${adminEmail}`)
      }
    }
  }

  console.log('✓ Bootstrap complete')
}

const server = http.createServer(app)
initSocket(server)

const PORT = Number(process.env.PORT) || 5000

bootstrap()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`API docs: http://localhost:${PORT}/api/docs`)
      console.log(`Health: http://localhost:${PORT}/api/v1/health`)
    })
  })
  .catch((err) => {
    console.error('Bootstrap failed:', err)
    process.exit(1)
  })

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close()
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
