import { PrismaClient } from '../lib/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.SYSTEM_ADMIN
    const password = process.env.SYSTEM_ADMIN_PASSPWORD

    if (!email || !password) {
        console.log('⚠️  SYSTEM_ADMIN or SYSTEM_ADMIN_PASSPWORD not set — skipping seed.')
        return
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
        console.log(`✅ System admin already exists (${email}) — skipping.`)
        return
    }

    await prisma.user.create({
        data: {
            name: 'System',
            lastName: 'Admin',
            email,
            password,
            role: 'SYSTEM_ADMIN',
        },
    })

    console.log(`✅ System admin created: ${email}`)
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
