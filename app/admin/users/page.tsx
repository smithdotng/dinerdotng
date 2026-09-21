import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Spot } from '@/models/Spot';
import { fmtDate } from '@/lib/format';
import { toggleUserAction } from '@/actions/admin';

export default async function AdminUsers() {
    await connectDB();
    const users = await User.find().sort({ createdAt: -1 }).limit(300).lean();
    const spots = await Spot.find({ owner: { $in: users.map((u) => u._id) } }).select('owner name slug').lean();
    const byOwner = Object.fromEntries(spots.map((s) => [String(s.owner), s]));
    return (
        <div className="card-dn"><div className="table-responsive"><table className="table-dn">
            <thead><tr><th>Name</th><th>Email / phone</th><th>Role</th><th>Spot</th><th>Joined</th><th>Status</th><th></th></tr></thead>
            <tbody>
                {users.map((u) => {
                    const s = byOwner[String(u._id)];
                    return (
                        <tr key={String(u._id)}>
                            <td><b>{u.name}</b></td>
                            <td className="small">{u.email}<br />{u.phone}</td>
                            <td><span className={`pill ${u.role === 'admin' ? 'pill-featured' : 'pill-soft'}`}>{u.role}</span></td>
                            <td>{s ? <a href={`/spots/${s.slug}`} target="_blank">{s.name}</a> : '—'}</td>
                            <td className="small">{fmtDate(u.createdAt)}<br />{u.hasPaid ? 'Paid customer' : 'First-customer eligible'}</td>
                            <td><span className={`pill ${u.isActive ? 'pill-green' : 'pill-red'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
                            <td>{u.role !== 'admin' && <form action={toggleUserAction.bind(null, String(u._id))}><button className="btn-dn-outline btn-sm-dn">{u.isActive ? 'Suspend' : 'Reactivate'}</button></form>}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table></div></div>
    );
}
