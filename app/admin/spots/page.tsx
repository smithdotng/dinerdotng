import { connectDB } from '@/lib/db';
import { Spot, type ISpot } from '@/models/Spot';
import { User } from '@/models/User';
import { isLive, liveFilter, locationOf, typeLabel } from '@/lib/spot';
import { PLANS } from '@/lib/plans';
import { fmtDate } from '@/lib/format';
import { escapeRegex } from '@/lib/helpers';
import { activateSpotAction, toggleSpotFlagAction } from '@/actions/admin';
import { ConfirmButton } from '@/components/ClientBits';

export default async function AdminSpots({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
    const q = await searchParams;
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (q.q) filter.name = new RegExp(escapeRegex(q.q), 'i');
    if (q.status === 'live') Object.assign(filter, liveFilter());
    if (q.status === 'inactive') filter['subscription.status'] = { $ne: 'active' };
    const spots = await Spot.find(filter).sort({ createdAt: -1 }).limit(200).lean<ISpot[]>();
    const owners = Object.fromEntries((await User.find({ _id: { $in: spots.map((s) => s.owner) } }).select('name email').lean()).map((u) => [String(u._id), u]));
    const back = `/admin/spots?q=${encodeURIComponent(q.q || '')}&status=${q.status || ''}`;

    return (
        <div className="card-dn">
            <form className="d-flex gap-2 flex-wrap mb-3" method="get">
                <input className="form-control" style={{ maxWidth: 280 }} name="q" defaultValue={q.q} placeholder="Search spots" />
                <select className="form-select" style={{ maxWidth: 180 }} name="status" defaultValue={q.status || ''}>
                    <option value="">All</option><option value="live">Live</option><option value="inactive">Not active</option>
                </select>
                <button className="btn-dn btn-sm-dn">Filter</button>
            </form>
            <div className="table-responsive"><table className="table-dn">
                <thead><tr><th>Spot</th><th>Owner</th><th>Plan</th><th>Rating</th><th>Flags</th><th>Actions</th></tr></thead>
                <tbody>
                    {spots.map((s) => {
                        const id = String(s._id);
                        const o = owners[String(s.owner)];
                        return (
                            <tr key={id}>
                                <td><a href={`/spots/${s.slug}`} target="_blank"><b>{s.name}</b></a><br /><small className="text-muted-dn">{typeLabel(s)} · {locationOf(s)}</small></td>
                                <td className="small">{o?.name || '—'}<br />{o?.email}</td>
                                <td>{isLive(s) ? <><span className="pill pill-green">{PLANS[s.subscription.plan!].name}</span><br /><small className="text-muted-dn">to {fmtDate(s.subscription.currentPeriodEnd!)}</small></> : <span className="pill pill-muted">Inactive</span>}</td>
                                <td>{s.ratingCount ? `${s.ratingAvg.toFixed(1)} (${s.ratingCount})` : '—'}</td>
                                <td className="small">{s.featuredOverride && <span className="pill pill-featured me-1">Featured</span>}{!s.isPublished && <span className="pill pill-red">Unpublished</span>}</td>
                                <td>
                                    <div className="d-flex gap-1 flex-wrap">
                                        <form action={toggleSpotFlagAction.bind(null, id, 'featuredOverride')}><input type="hidden" name="back" value={back} /><button className="btn-dn-outline btn-sm-dn">{s.featuredOverride ? 'Unfeature' : 'Feature'}</button></form>
                                        <form action={toggleSpotFlagAction.bind(null, id, 'isPublished')}><input type="hidden" name="back" value={back} /><button className="btn-dn-outline btn-sm-dn">{s.isPublished ? 'Unpublish' : 'Publish'}</button></form>
                                        <form action={activateSpotAction.bind(null, id)} className="d-flex gap-1">
                                            <input type="hidden" name="back" value={back} />
                                            <select className="form-select form-select-sm" name="plan" defaultValue="basic"><option value="basic">Basic</option><option value="sweet">Sweet</option></select>
                                            <input className="form-control form-control-sm" name="amount" placeholder="₦ paid" style={{ width: 90 }} />
                                            <ConfirmButton message="Record an offline payment and activate this plan for 30 days?" className="btn-dn btn-sm-dn">Activate</ConfirmButton>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table></div>
        </div>
    );
}
