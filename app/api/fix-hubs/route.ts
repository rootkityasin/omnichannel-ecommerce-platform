import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const defaultHubs = [
            { id: 'dhaka-central', name: 'Dhaka Central Hub', location: 'Dhaka' },
            { id: 'khulna-hub', name: 'Khulna Hub', location: 'Khulna' },
            { id: 'chattogram-hub', name: 'Chattogram Hub', location: 'Chattogram' }
        ];

        const results = [];
        for (const hub of defaultHubs) {
            const created = await prisma.hub.upsert({
                where: { id: hub.id },
                update: {},
                create: hub
            });
            results.push(created);
        }

        return NextResponse.json({
            success: true,
            message: "Successfully seeded Hubs into database!",
            hubs: results
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
}
