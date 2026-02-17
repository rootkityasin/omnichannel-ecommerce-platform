/* eslint-disable @typescript-eslint/no-require-imports */
 
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking Environment Variables...");
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Present" : "❌ Missing");
    console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Present" : "❌ Missing");
    console.log("AUTH_SECRET:", process.env.AUTH_SECRET ? "✅ Present" : "❌ Missing");

    console.log("\nChecking Database Connection...");
    try {
        await prisma.$connect();
        console.log("✅ Database Connected");
        const userCount = await prisma.user.count();
        console.log("User Count:", userCount);
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
 
