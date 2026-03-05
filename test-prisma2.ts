import { prisma } from './lib/prisma';

async function main() {
    try {
        const user = await prisma.user.findFirst();
        console.log("Success:", user);
    } catch (e) {
        console.error("Error finding user:", e);
    } finally {
        process.exit(0);
    }
}

main();
