import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    datasource: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
    }
});
