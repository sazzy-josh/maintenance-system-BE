import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding production essentials...')

  // Roles — upsert so this is safe to re-run
  const roles = [
    { name: 'REQUESTER', description: 'Students and staff who submit maintenance requests' },
    { name: 'OFFICER',   description: 'Maintenance officers who handle and resolve requests' },
    { name: 'ADMIN',     description: 'Administrators who manage the system' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
    console.log(`  ✓ Role: ${role.name}`)
  }

  // Default categories
  const categories = [
    { name: 'Electrical',          description: 'Electrical faults and power issues',              slaHours: 24 },
    { name: 'Plumbing',            description: 'Plumbing and water supply issues',                slaHours: 24 },
    { name: 'HVAC',                description: 'Air conditioning and ventilation issues',         slaHours: 48 },
    { name: 'Structural / Civil',  description: 'Building structure, walls, floors, ceilings',    slaHours: 72 },
    { name: 'Cleaning',            description: 'Cleaning and sanitation requests',                slaHours: 12 },
    { name: 'IT / Network',        description: 'Internet, network and IT infrastructure issues',  slaHours: 24 },
    { name: 'Furniture / Fixtures',description: 'Furniture damage and fixture repairs',            slaHours: 48 },
    { name: 'Hostel Maintenance',  description: 'Hostel-specific maintenance issues',              slaHours: 24 },
    { name: 'Other',               description: 'General maintenance requests',                    slaHours: 48 },
  ]

  for (const cat of categories) {
    await prisma.requestCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isActive: true },
    })
    console.log(`  ✓ Category: ${cat.name}`)
  }

  console.log('✅ Production seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
