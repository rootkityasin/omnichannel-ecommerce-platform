import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { withAccelerate } from '@prisma/extension-accelerate'

const connectionString = `${process.env.DATABASE_URL}`

// Only use the PG adapter if NOT using Accelerate (which handles its own pooling)
const useAdapter = !connectionString.startsWith('prisma://');

let adapter;
if (useAdapter) {
    const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false }
    })
    adapter = new PrismaPg(pool)
}

const globalForPrisma = globalThis as unknown as { prisma: any }

const baseClient = new PrismaClient({
    adapter: useAdapter ? adapter : undefined,
    log: ['error', 'warn'],
})

export const prisma = globalForPrisma.prisma || baseClient.$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
