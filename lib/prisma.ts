import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { withAccelerate } from '@prisma/extension-accelerate'

const connectionString = `${process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL}`

// Only use the PG adapter if NOT using Accelerate (which handles its own pooling)
const useAdapter = !connectionString.startsWith('prisma://') && !connectionString.startsWith('prisma+postgres://');

let adapter;
if (useAdapter) {
    const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false }
    })
    adapter = new PrismaPg(pool)
}

const globalForPrisma = globalThis as unknown as { prisma: any }

const prismaOptions: any = {
    log: ['error', 'warn'],
};

if (useAdapter && adapter) {
    prismaOptions.adapter = adapter;
} else {
    // Explicitly pass connection string as accelerateUrl for Driver Adapter mode (forced by schema)
    (prismaOptions as any).accelerateUrl = connectionString;
}

const baseClient = new PrismaClient(prismaOptions)

export const prisma = globalForPrisma.prisma || baseClient.$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
