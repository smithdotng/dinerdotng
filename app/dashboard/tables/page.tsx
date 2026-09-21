import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { Table, type ITable } from '@/models/Table';
import { Reservation, type IReservation } from '@/models/Reservation';
import { hasSweet } from '@/lib/spot';
import { fmtTime, todayISO } from '@/lib/format';
import { addTablesAction, deleteTableAction, updateTableAction } from '@/actions/owner';
import { Upsell } from '@/components/PlanBanner';
import { AutoSubmitSelect, ConfirmButton } from '@/components/ClientBits';

const STATUS_OPTS = [['available', 'Available'], ['reserved', 'Reserved'], ['occupied', 'Occupied'], ['out_of_service', 'Out of service']];

export default async function TablesPage() {
    const { spot } = await requireOwnerSpot();
    if (!hasSweet(spot)) {
        return <Upsell icon="fa-chair" heading="Manage your tables" text="Set up your floor — table numbers, seats and areas (indoor, terrace, VIP) — see what's free at a glance, assign bookings and print a QR code for every table." />;
    }
    const [tables, todays] = await Promise.all([
        Table.find({ spot: spot._id }).sort({ area: 1, label: 1 }).lean<ITable[]>(),
        Reservation.find({ spot: spot._id, date: todayISO(), status: { $in: ['pending', 'confirmed', 'seated'] }, table: { $ne: null } }).sort({ time: 1 }).lean<IReservation[]>()
    ]);
    const byTable: Record<string, IReservation[]> = {};
    todays.forEach((r) => (byTable[String(r.table)] ||= []).push(r));
    const areas = [...new Set(tables.map((t) => t.area))];
    const seats = tables.reduce((s, t) => s + t.seats, 0);

    return (
        <div className="row g-4">
            <div className="col-xl-8">
                <div className="card-dn">
                    <div className="card-head">
                        <h5>Floor ({tables.length} tables · {seats} seats)</h5>
                        {tables.length > 0 && <Link href="/print/qr?tables=1" target="_blank" className="btn-dn-outline btn-sm-dn"><i className="fas fa-qrcode"></i> Print table QRs</Link>}
                    </div>
                    <div className="d-flex gap-2 flex-wrap mb-3 small">
                        <span className="pill pill-green">Available</span><span className="pill pill-amber">Reserved</span><span className="pill pill-red">Occupied</span><span className="pill pill-muted">Out of service</span>
                    </div>
                    {!tables.length && <p className="text-muted-dn">No tables yet — add your first ones using the form.</p>}
                    {areas.map((a) => (
                        <div key={a}>
                            <h6 className="text-uppercase mt-3 mb-2" style={{ letterSpacing: 1, color: 'var(--dn-primary-dark)' }}>{a}</h6>
                            <div className="row g-3">
                                {tables.filter((t) => t.area === a).map((t) => {
                                    const id = String(t._id);
                                    const bk = byTable[id] || [];
                                    return (
                                        <div key={id} className="col-6 col-md-4 col-lg-3">
                                            <div className={`table-tile st-${t.status}`}>
                                                <div className="d-flex justify-content-between align-items-start"><span className="lbl">{t.label}</span><span className="small text-muted-dn"><i className="fas fa-user"></i> {t.seats}</span></div>
                                                {bk.length ? <div className="small mt-1" style={{ color: '#a05a00' }}><i className="fas fa-clock me-1"></i>{bk.map((r) => fmtTime(r.time)).join(', ')}</div> : <div className="small mt-1 text-muted-dn">No bookings today</div>}
                                                <form action={updateTableAction.bind(null, id)} className="mt-2">
                                                    <AutoSubmitSelect className="form-select form-select-sm" name="status" defaultValue={t.status}>
                                                        {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                                    </AutoSubmitSelect>
                                                </form>
                                                <div className="d-flex justify-content-between mt-2">
                                                    <a className="small" href={`/api/qr?table=${encodeURIComponent(t.label)}`}><i className="fas fa-qrcode"></i> QR</a>
                                                    <form action={deleteTableAction.bind(null, id)}><ConfirmButton message={`Remove table ${t.label}?`} className="btn btn-link btn-sm p-0 small text-muted-dn">Remove</ConfirmButton></form>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-xl-4">
                <div className="card-dn">
                    <h5>Add tables</h5>
                    <form action={addTablesAction} className="row g-2">
                        <div className="col-7"><label className="form-label">Label</label><input className="form-control" name="label" placeholder="T1" required /><div className="form-text">Adding several? &quot;T1&quot; × 5 creates T1–T5.</div></div>
                        <div className="col-5"><label className="form-label">How many</label><input className="form-control" type="number" name="qty" defaultValue={1} min={1} max={30} /></div>
                        <div className="col-5"><label className="form-label">Seats</label><input className="form-control" type="number" name="seats" defaultValue={4} min={1} max={50} /></div>
                        <div className="col-7"><label className="form-label">Area</label><input className="form-control" name="area" list="areas" defaultValue="Indoor" />
                            <datalist id="areas">{['Indoor', 'Outdoor', 'Terrace', 'Rooftop', 'VIP', 'Bar', 'Poolside'].map((a) => <option key={a} value={a} />)}</datalist></div>
                        <div className="col-12"><button className="btn-dn btn-block"><i className="fas fa-plus"></i> Add</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
}
