import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!

const createPrismaClient = () => {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var __prisma: undefined | PrismaClient
}

// In development, always recreate the client to pick up schema changes.
// The previous approach cached a stale client in globalThis.
if (process.env.NODE_ENV !== 'production') {
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient()
  }
}

const prisma = globalThis.__prisma ?? createPrismaClient()

export default prisma
