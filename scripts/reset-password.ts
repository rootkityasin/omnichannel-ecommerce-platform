
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: npx tsx scripts/reset-password.ts <phone> <new_password>");
        process.exit(1);
    }

    const phone = args[0];
    const newPassword = args[1];

    console.log(`Resetting password for user with phone: ${phone}...`);

    const user = await prisma.user.findUnique({
        where: { phone }
    });

    if (!user) {
        console.error(`User with phone ${phone} not found.`);
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    console.log(`✅ Password updated successfully for ${user.name} (${user.phone})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
