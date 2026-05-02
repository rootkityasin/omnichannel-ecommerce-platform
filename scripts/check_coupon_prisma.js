const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name ILIKE 'coupon'
      ORDER BY column_name;
    `;
    console.log('COLUMNS:', cols);

    console.log('\nAttempting prisma.coupon.findFirst() with include.product...');
    const res = await prisma.coupon.findFirst({
      include: { product: { select: { id: true, name: true } } },
    });
    console.log('RESULT:', res);
  } catch (e) {
    console.error('ERROR:', e && e.message);
    if (e && e.meta) console.error('META:', e.meta);
    if (e && e.cause) console.error('CAUSE:', e.cause);
  } finally {
    await prisma.$disconnect();
  }
}

main();
