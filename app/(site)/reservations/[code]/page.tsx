import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Reservation, type IReservation } from '@/models/Reservation';
import { Spot, type ISpot } from '@/models/Spot';
import { Table, type ITable } from '@/models/Table';
import { fmtDate, fmtTime, telLink } from '@/lib/format';
import { locationOf } from '@/lib/spot';
import { cancelReservationAction } from '@/actions/public';

export const metadata = { title: 'Your reservation', robots: { index: false } };

const HEAD: Record<string, string> = {
    pending: 'Request received!',
    confirmed: "You're booked!",
    seated: 'Enjoy your meal!',
    completed: 'Thanks for visiting!',
    cancelled: 'Reservation cancelled',
    no_show: 'Reservation missed'
};

export default async function ReservationPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    await connectDB();
    const r = await Reservation.findOne({ code: code.toUpperCase() }).lean<IReservation>();
    if (!r) notFound();
    const [spot, table] = await Promise.all([
        Spot.findById(r.spot).lean<ISpot>(),
        r.table ? Table.findById(r.table).lean<ITable>() : null
    ]);
    if (!spot) notFound();
    const ok = !['cancelled', 'no_show'].includes(r.status);
    const cancel = cancelReservationAction.bind(null, r.code);

    return (
        <section className="dn-section page-offset">
            <div className="container" style={{ maxWidth: 640 }}>
                <div className="panel text-center">
                    <div className="step-card p-0 shadow-none" style={{ background: 'none' }}>
                        <span className="ic" style={ok ? undefined : { background: '#adb5bd' }}><i className={`fas ${ok ? 'fa-calendar-check' : 'fa-calendar-xmark'}`}></i></span>
                    </div>
                    <h2 className="mb-1">{HEAD[r.status]}</h2>
                    <p className="text-muted-dn">{r.status === 'pending' ? `${spot.name} will confirm your table shortly. Keep your booking code handy.` : 'Here are your booking details.'}</p>
                    <div className="my-3">
                        <span className="text-muted-dn small d-block">Booking code</span>
                        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: 6, color: 'var(--dn-primary-dark)' }}>{r.code}</span>
                    </div>
                    <span className={`pill status-${r.status} mb-3`}>{r.status.replace('_', ' ').toUpperCase()}</span>
                    <ul className="info-list text-start mt-3">
                        <li><i className="fas fa-store"></i><div><b>{spot.name}</b><br /><small className="text-muted-dn">{spot.address || locationOf(spot)}</small></div></li>
                        <li><i className="fas fa-calendar"></i>{fmtDate(r.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</li>
                        <li><i className="fas fa-clock"></i>{fmtTime(r.time)}</li>
                        <li><i className="fas fa-users"></i>{r.partySize} guest{r.partySize === 1 ? '' : 's'}{r.seating ? ` · ${r.seating}` : ''}</li>
                        {table && <li><i className="fas fa-chair"></i>Table {table.label}</li>}
                        {r.occasion && <li><i className="fas fa-cake-candles"></i>{r.occasion}</li>}
                    </ul>
                    <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
                        <Link href={`/spots/${spot.slug}`} className="btn-dn-outline">Back to {spot.name}</Link>
                        {spot.phone && <a href={telLink(spot.phone)} className="btn-dn"><i className="fas fa-phone"></i> Call</a>}
                    </div>
                    {['pending', 'confirmed'].includes(r.status) && (
                        <details className="mt-4 text-start">
                            <summary className="small text-muted-dn" style={{ cursor: 'pointer' }}>Need to cancel?</summary>
                            <form action={cancel} className="d-flex gap-2 mt-2">
                                <input className="form-control" name="phone" placeholder="Phone number you booked with" required />
                                <button className="btn-dn-dark">Cancel</button>
                            </form>
                        </details>
                    )}
                </div>
            </div>
        </section>
    );
}
