import { requireOwnerSpot } from '@/lib/owner';
import { Table } from '@/models/Table';
import { hasSweet } from '@/lib/spot';
import { appUrl } from '@/lib/appUrl';
import { menuUrl, qrDataUrl } from '@/lib/qr';
import { PrintButton } from '@/components/ClientBits';

export const metadata = { title: 'Print QR table cards' };

export default async function PrintQrPage({ searchParams }: { searchParams: Promise<{ tables?: string; copies?: string }> }) {
    const { spot } = await requireOwnerSpot();
    const sp = await searchParams;
    const base = await appUrl();
    let entries = [{ label: '', url: menuUrl(base, spot.slug) }];
    if (sp.tables && hasSweet(spot)) {
        const tables = await Table.find({ spot: spot._id, active: true }).sort({ area: 1, label: 1 }).lean();
        if (tables.length) entries = tables.map((t) => ({ label: t.label, url: menuUrl(base, spot.slug, t.label) }));
    }
    const perEntry = entries.length > 1 ? 1 : Math.min(12, parseInt(sp.copies || '4', 10) || 4);
    const cards = await Promise.all(entries.map(async (e) => ({ ...e, dataUrl: await qrDataUrl(e.url) })));

    return (
        <div className="qr-print">
            <style>{`
                .qr-print { background:#f3e6d8; min-height:100vh; color:#3b1d0e; }
                .qr-print .bar { padding:14px 20px; background:#fff; display:flex; justify-content:space-between; align-items:center; }
                .qr-print .bar button { background:#e8590c; color:#fff; border:0; padding:10px 22px; border-radius:30px; font-weight:600; }
                .qr-print .sheet { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; padding:20px; max-width:900px; margin:0 auto; }
                .qr-print .card { background:#fff; border-radius:20px; padding:26px 20px; text-align:center; border-top:10px solid #e8590c; break-inside:avoid; }
                .qr-print .card h2 { margin:4px 0 0; font-size:24px; }
                .qr-print .card .s { font-family:'Fraunces',serif; font-style:italic; color:#c2410c; font-size:20px; }
                .qr-print .card img { width:220px; height:220px; margin:10px 0; }
                .qr-print .card .t { display:inline-block; background:#f59f00; font-weight:800; padding:4px 16px; border-radius:30px; margin-bottom:6px; }
                .qr-print .card small { color:#7a6358; display:block; }
                @media print { .qr-print .bar { display:none; } .qr-print { background:#fff; } .qr-print .sheet { padding:0; } .qr-print .card { border:1px solid #eee; border-top:10px solid #e8590c; } }
            `}</style>
            <div className="bar">
                <b>Print preview — {cards.length > 1 ? `${cards.length} table cards` : `${perEntry} copies`}</b>
                <PrintButton />
            </div>
            <div className="sheet">
                {cards.flatMap((c) =>
                    Array.from({ length: perEntry }, (_, i) => (
                        <div className="card" key={`${c.label}-${i}`}>
                            {c.label && <div className="t">Table {c.label}</div>}
                            <h2>{spot.name}</h2>
                            <div className="s">Scan for our menu</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.dataUrl} alt="QR code" />
                            <small>Point your phone camera here · Rate your experience</small>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/logo.png" alt="Diner.ng" style={{ height: 26, width: 'auto', margin: '10px auto 0', display: 'block' }} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
