import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Spot } from '@/models/Spot';
import { MenuItem } from '@/models/MenuItem';
import { PLANS } from '@/lib/plans';
import { fmtDate, naira } from '@/lib/format';
import { VENUE_IMPORTS } from '@/lib/venueImport';
import { dismissImportNoticeAction, importVenueAction } from '@/actions/admin';
import { ConfirmButton } from '@/components/ClientBits';

export const metadata = { title: 'Import venue' };

export default async function AdminImports() {
    await connectDB();
    const session = await getSession();
    const notice = session.importNotice;
    const rows = await Promise.all(
        VENUE_IMPORTS.map(async (v) => {
            const spot = await Spot.findOne({ slug: v.spot.slug }).select('name slug subscription').lean();
            const live = spot ? await MenuItem.countDocuments({ spot: spot._id }) : 0;
            const prices = v.items.map((i) => i.price);
            return { v, spot, live, min: Math.min(...prices), max: Math.max(...prices) };
        })
    );

    return (
        <>
            {notice && (
                <div className="card-dn mb-3" style={{ borderColor: '#2b8a3e' }}>
                    <h4 className="mb-2"><i className="fas fa-circle-check me-2" style={{ color: '#2b8a3e' }}></i>{notice.spotName} imported</h4>
                    <p className="mb-2">
                        {notice.items} menu items loaded{notice.planActivated ? ' and the plan is active for 30 days' : ''}.{' '}
                        <Link href={`/spots/${notice.slug}`} target="_blank">View the listing</Link> · <Link href={`/m/${notice.slug}`} target="_blank">View the QR menu</Link>
                    </p>
                    {notice.tempPassword ? (
                        <div className="alert alert-warning mb-2">
                            <b>Owner login (shown once):</b> {notice.email} · temporary password <code style={{ fontSize: 16 }}>{notice.tempPassword}</code>
                            <br />Share it with the venue privately and ask them to change it under Settings after logging in.
                        </div>
                    ) : (
                        <p className="text-muted-dn mb-2">The owner account ({notice.email}) already existed, so its password was not changed.</p>
                    )}
                    <form action={dismissImportNoticeAction}><button className="btn-dn-outline btn-sm-dn">I&apos;ve noted this — hide it</button></form>
                </div>
            )}
            <div className="card-dn">
                <h3 className="mb-1">Import venue</h3>
                <p className="text-muted-dn">
                    Curated venue files from <code>content/imports</code>. Importing creates the owner account, listing, menu and plan. Running it again
                    updates the details and replaces the menu with the file&apos;s version; the owner&apos;s password and reviews are untouched.
                </p>
                <div className="table-responsive">
                    <table className="table-dn">
                        <thead><tr><th>Venue</th><th>Menu</th><th>Plan</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                            {rows.map(({ v, spot, live, min, max }) => {
                                const action = importVenueAction.bind(null, v.key);
                                const active = spot?.subscription?.status === 'active';
                                return (
                                    <tr key={v.key}>
                                        <td><b>{v.spot.name}</b><br /><small className="text-muted-dn">{v.spot.area}, {v.spot.city} · {v.owner.email}</small></td>
                                        <td>{v.items.length} items · {v.categories.length} categories<br /><small className="text-muted-dn">{naira(min)} – {naira(max)}</small></td>
                                        <td>{v.plan ? PLANS[v.plan].name : '—'}<br /><small className="text-muted-dn">{v.planAmount ? naira(v.planAmount) : 'Complimentary'}</small></td>
                                        <td>
                                            {spot ? (
                                                <>
                                                    <span className={`pill ${active ? 'pill-featured' : 'pill-soft'}`}>{active ? 'Live' : 'Imported'}</span>
                                                    <br /><small className="text-muted-dn">{live} items live{active && spot.subscription?.currentPeriodEnd ? ` · until ${fmtDate(spot.subscription.currentPeriodEnd)}` : ''}</small>
                                                </>
                                            ) : (
                                                <span className="pill pill-soft">Not imported</span>
                                            )}
                                        </td>
                                        <td>
                                            <form action={action}>
                                                {spot ? (
                                                    <ConfirmButton message={`Update ${v.spot.name} and replace its menu with the file's ${v.items.length} items?`} className="btn-dn-outline btn-sm-dn">
                                                        Re-import
                                                    </ConfirmButton>
                                                ) : (
                                                    <button className="btn-dn btn-sm-dn"><i className="fas fa-file-import"></i> Import</button>
                                                )}
                                            </form>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
