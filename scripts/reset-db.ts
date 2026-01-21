import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma'; // Import configured instance

async function main() {
    console.log('🗑️  Starting database cleanup...');

    try {
        console.log('Deleting Reviews...');
        await prisma.review.deleteMany();

        console.log('Deleting OrderItems...');
        await prisma.orderItem.deleteMany();

        console.log('Deleting Inventory...');
        await prisma.inventory.deleteMany();

        console.log('Deleting Modifiers...');
        await prisma.modifier.deleteMany();

        console.log('Deleting ComboItems...');
        await prisma.comboItem.deleteMany();

        console.log('Deleting Misc tables (Account, Session, etc)...');
        await prisma.account.deleteMany();
        await prisma.session.deleteMany();
        await prisma.verificationToken.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.freezer.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.heroSlide.deleteMany();
        await prisma.trackingEvent.deleteMany();
        await prisma.trustedDevice.deleteMany();
        await prisma.securityLog.deleteMany();
        await prisma.coupon.deleteMany();
        await prisma.promoCard.deleteMany();

        console.log('Deleting Orders...');
        await prisma.order.deleteMany();

        console.log('Deleting Products...');
        await prisma.product.deleteMany();

        console.log('Deleting ProductSections...');
        await prisma.productSection.deleteMany();

        console.log('Deleting Categories...');
        await prisma.category.deleteMany();

        console.log('Deleting Users...');
        await prisma.user.deleteMany();

        console.log('Deleting Hubs...');
        await prisma.hub.deleteMany();

        console.log('Deleting Configs...');
        await prisma.siteConfig.deleteMany();
        await prisma.paymentConfig.deleteMany();
        await prisma.deliveryConfig.deleteMany();

        console.log('✅ Database cleared.');

        console.log('🌱 Seeding Super Admin...');

        const hashedPassword = await bcrypt.hash('123456', 10);

        await prisma.user.create({
            data: {
                name: 'Super Admin',
                email: 'admin@crabkhai.com',
                password: hashedPassword,
                role: Role.SUPER_ADMIN,
                phone: '01804221161',
            },
        });

        console.log('✅ Super Admin created: admin@crabkhai.com / 123456');

    } catch (error: any) {
        console.error('❌ Error during reset:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
