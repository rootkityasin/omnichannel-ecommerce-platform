const process = require('process');

try {
    require('dotenv').config();
} catch (e) {
    // dotenv might be pruned in production (standalone), which is fine since orchestrator injects env vars.
}

module.exports = {
    datasource: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
    }
};
