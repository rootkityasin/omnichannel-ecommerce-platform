import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { withAccelerate } from '@prisma/extension-accelerate'

const runtimeDatabaseUrl = process.env.PRISMA_DATABASE_URL
const fallbackDatabaseUrl = process.env.DATABASE_URL
const connectionString = runtimeDatabaseUrl || fallbackDatabaseUrl

const sanitizeDbUrl = (value?: string) => {
    if (!value) return ''
    try {
        const parsed = new URL(value)
        return `${parsed.protocol}//${parsed.host}${parsed.pathname}`
    } catch {
        return value
    }
}

if (runtimeDatabaseUrl && fallbackDatabaseUrl && runtimeDatabaseUrl !== fallbackDatabaseUrl) {
    console.warn('[Prisma Config Warning] PRISMA_DATABASE_URL and DATABASE_URL are different.', {
        runtime: sanitizeDbUrl(runtimeDatabaseUrl),
        fallback: sanitizeDbUrl(fallbackDatabaseUrl)
    })
}

if (!connectionString) {
    throw new Error('Database URL missing. Set PRISMA_DATABASE_URL or DATABASE_URL.')
}

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

type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0] & {
    accelerateUrl?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const prismaOptions: PrismaClientOptions = {
    log: ['error', 'warn'],
};

if (useAdapter && adapter) {
    prismaOptions.adapter = adapter;
} else {
    // Explicitly pass connection string as accelerateUrl for Driver Adapter mode (forced by schema)
    prismaOptions.accelerateUrl = connectionString;
}

const baseClient = new PrismaClient(prismaOptions)

export const prisma: PrismaClient =
    globalForPrisma.prisma ||
    (useAdapter ? baseClient : (baseClient.$extends(withAccelerate()) as unknown as PrismaClient))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
