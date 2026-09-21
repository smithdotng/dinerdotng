import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { Reservation, type IReservation } from '@/models/Reservation';
import { Table, type ITable } from '@/models/Table';
import { hasSweet } from '@/lib/spot';
import { fmtDate, fmtTime, todayISO } from '@/lib/format';
import { addBookingAction, updateReservationAction } from '@/actions/owner';
import { Upsell } from '@/components/PlanBanner';
import { AutoSubmitDate, AutoSubmitSelect, Toggle } from '@/components/ClientBits';

const NEXT: Record<string, [string, string, boolean][]> = {
    pending: [['confirmed', 'Confirm', true], ['cancelled', 'Decline', false]],
    confirmed: [['seated', 'Seat', true], ['no_show', 'No-show', false], ['cancelled', 'Cancel', false]],
    seated: [['completed', 'Complete', true]]
};

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
    const { spot } = await requireOwnerSpot();
    if (!hasSweet(spot)) {
        return <Upsell icon="fa-calendar-check" heading="Take reservations online" text="Let guests book a table straight from your Diner.ng page. Confirm bookings, assign tables and track no-shows — all in one place." />;
    }
    const q = await searchParams;
    const view = q.view || 'upcoming';
    const today = todayISO();
    const filter: Record<string, unknown> = { spot: spot._id };
    if (q.date) filter.date = q.date;
    else if (view === 'today') filter.date = today;
    else if (view === 'upcoming') Object.assign(filter, { date: { $gte: today }, status: { $in: ['pending', 'confirmed', 'seated'] } });
    else if (view === 'past') filter.date = { $lt: today };

    const [reservations, tables, todays] = await Promise.all([
        Reservation.find(filter).sort(view === 'past' ? { date: -1, time: -1 } : { date: 1, time: 1 }).limit(200).lean<IReservation[]>(),
        Table.find({ spot: spot._id, active: true }).sort({ label: 1 }).lean<ITable[]>(),
        Reservation.find({ spot: spot._id, date: today }).select('status partySize').lean<IReservation[]>()
    ]);
    const tableById = Object.fromEntries(tables.map((t) => [String(t._id), t]));
    const count = (s: string[]) => todays.filter((r) => s.includes(r.status)).length;
    const guests = todays.filter((r) => !['cancelled', 'no_show'].includes(r.status)).reduce((a, r) => a + r.partySize, 0);
    const backUrl = `/dashboard/reservations?${q.date ? `date=${q.date}` : `view=${view}`}`;
    const tabs = [['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['all', 'All']];

    return (
        <>
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3"><div className="kpi"><span className="ic ic-orange"><i className="fas fa-calendar-day"></i></span><div><b>{count(['pending', 'confirmed', 'seated', 'completed'])}</b><span>Bookings today</span></div></div></div>
                <div className="col-6 col-md-3"><div className="kpi"><span className="ic ic-amber"><i className="fas fa-hourglass-half"></i></span><div><b>{count(['pending'])}</b><span>Awaiting confirmation</span></div></div></div>
                <div className="col-6 col-md-3"><div className="kpi"><span className="ic ic-green"><i className="fas fa-users"></i></span><div><b>{guests}</b><span>Guests expected today</span></div></div></div>
                <div className="col-6 col-md-3"><div className="kpi"><span className="ic ic-red"><i className="fas fa-user-xmark"></i></span><div><b>{count(['no_show'])}</b><span>No-shows today</span></div></div></div>
            </div>
            <div className="card-dn">
                <div className="card-head">
                    <div className="type-tabs">
                        {tabs.map(([k, l]) => <Link key={k} href={`/dashboard/reservations?view=${k}`} className={view === k && !q.date ? 'active' : ''}>{l}</Link>)}
                    </div>
                    <div className="d-flex gap-2 align-items-start flex-wrap">
                        <form method="get"><AutoSubmitDate className="form-control form-control-sm" name="date" defaultValue={q.date || ''} /></form>
                        <Toggle label={<><i className="fas fa-plus"></i> Add booking</>} className="btn-dn btn-sm-dn">
                            <form action={addBookingAction} className="row g-2 mt-2 p-3 w-100" style={{ background: 'var(--dn-cream)', borderRadius: 14, flexBasis: '100%' }}>
                                <div className="col-md-4"><input className="form-control" name="name" placeholder="Guest name" required /></div>
                                <div className="col-md-4"><input className="form-control" name="phone" placeholder="Phone" required /></div>
                                <div className="col-md-4"><input className="form-control" type="date" name="date" defaultValue={today} required /></div>
                                <div className="col-4"><input className="form-control" type="time" name="time" defaultValue="19:00" required /></div>
                                <div className="col-4"><input className="form-control" type="number" name="partySize" defaultValue={2} min={1} required /></div>
                                <div className="col-4"><select className="form-select" name="table" defaultValue=""><option value="">Table…</option>{tables.map((t) => <option key={String(t._id)} value={String(t._id)}>{t.label} ({t.seats})</option>)}</select></div>
                                <div className="col-md-9"><input className="form-control" name="notes" placeholder="Notes (optional)" /></div>
                                <div className="col-md-3"><button className="btn-dn btn-block">Save</button></div>
                            </form>
                        </Toggle>
                    </div>
                </div>
                {!reservations.length ? (
                    <div className="text-center py-5"><i className="fas fa-calendar fa-2x text-primary-dn mb-2"></i><p className="text-muted-dn mb-0">No reservations in this view.</p></div>
                ) : (
                    <div className="table-responsive">
                        <table className="table-dn">
                            <thead><tr><th>Date &amp; time</th><th>Guest</th><th>Party</th><th>Request</th><th>Table</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {reservations.map((r) => {
                                    const id = String(r._id);
                                    const action = updateReservationAction.bind(null, id);
                                    return (
                                        <tr key={id}>
                                            <td><b>{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</b><br />{fmtTime(r.time)}</td>
                                            <td><b>{r.name}</b><br /><a href={`tel:${r.phone}`} className="small">{r.phone}</a><br /><small className="text-muted-dn">#{r.code}</small></td>
                                            <td><i className="fas fa-users text-muted-dn me-1"></i>{r.partySize}</td>
                                            <td className="small" style={{ maxWidth: 200 }}>{[r.seating, r.occasion, r.notes].filter(Boolean).join(' · ') || '—'}</td>
                                            <td>
                                                <form action={action}>
                                                    <input type="hidden" name="back" value={backUrl} />
                                                    <AutoSubmitSelect className="form-select form-select-sm" name="table" defaultValue={r.table ? String(r.table) : ''} style={{ minWidth: 110 }}>
                                                        <option value="">—</option>
                                                        {tables.map((t) => <option key={String(t._id)} value={String(t._id)}>{t.label} ({t.seats})</option>)}
                                                    </AutoSubmitSelect>
                                                </form>
                                                {r.table && !tableById[String(r.table)] && <small className="text-muted-dn">removed table</small>}
                                            </td>
                                            <td><span className={`pill status-${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                                            <td>
                                                <form action={action} className="d-flex gap-1 flex-wrap">
                                                    <input type="hidden" name="back" value={backUrl} />
                                                    {(NEXT[r.status] || []).map(([s, l, primary]) => (
                                                        <button key={s} name="status" value={s} className={`${primary ? 'btn-dn' : 'btn-dn-outline'} btn-sm-dn`}>{l}</button>
                                                    ))}
                                                </form>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <p className="small text-muted-dn">
                <i className="fas fa-link me-1"></i>Guests book at <Link href={`/spots/${spot.slug}#book`} target="_blank">/spots/{spot.slug}</Link>. Adjust booking hours in <Link href="/dashboard/settings">Settings</Link>.
            </p>
        </>
    );
}
