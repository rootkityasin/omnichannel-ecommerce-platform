// Prisma 7 configuration file
// https://www.prisma.io/docs/orm/reference/prisma-cli-reference#prisma-config-file
require('dotenv').config();

/** @type {import('prisma/config').Config} */
module.exports = {
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
};
