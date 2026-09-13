import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const managerPassword = await bcrypt.hash('Manager@1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mydeploy.io' },
    update: {},
    create: {
      email: 'admin@mydeploy.io',
      name: 'Platform Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@mydeploy.io' },
    update: {},
    create: {
      email: 'manager@mydeploy.io',
      name: 'Deployment Manager',
      password: managerPassword,
      role: 'MANAGER',
    },
  })

  console.log('Seeded users:')
  console.log(`  Admin:   ${admin.email}  /  Admin@1234`)
  console.log(`  Manager: ${manager.email}  /  Manager@1234`)
  console.log('\nChange these passwords immediately after first login.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
