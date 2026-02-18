
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Find user "Yasin Arafat"
        const user = await prisma.user.findFirst({
            where: {
                name: {
                    contains: 'Yasin',
                    mode: 'insensitive'
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User Yasin not found" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'SUPER_ADMIN' }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
