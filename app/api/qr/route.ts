import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Spot } from '@/models/Spot';
import { appUrl } from '@/lib/appUrl';
import { menuUrl, qrPng } from '@/lib/qr';

// Download the owner's menu QR code as a PNG (optionally for a specific table).
export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.redirect(new URL('/login', req.url));
    await connectDB();
    const spot = await Spot.findOne({ owner: user.id }).lean();
    if (!spot) return new Response('No spot', { status: 404 });
    const table = (new URL(req.url).searchParams.get('table') || '').slice(0, 20);
    const png = await qrPng(menuUrl(await appUrl(), spot.slug, table));
    return new Response(new Uint8Array(png), {
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${spot.slug}${table ? `-table-${table.replace(/[^\w-]/g, '')}` : ''}-menu-qr.png"`
        }
    });
}
