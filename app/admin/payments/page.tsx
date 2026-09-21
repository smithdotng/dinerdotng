import { connectDB } from '@/lib/db';
import { Payment, type IPayment } from '@/models/Payment';
import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { PLANS } from '@/lib/plans';
import { fmtDate, naira } from '@/lib/format';

export default async function AdminPayments() {
    await connectDB();
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(300).lean<IPayment[]>();
    const [spots, users] = await Promise.all([
        Spot.find({ _id: { $in: payments.map((p) => p.spot) } }).select('name').lean(),
        User.find({ _id: { $in: payments.map((p) => p.user) } }).select('email').lean()
    ]);
    const spotName = Object.fromEntries(spots.map((s) => [String(s._id), s.name]));
    const email = Object.fromEntries(users.map((u) => [String(u._id), u.email]));
    return (
        <div className="card-dn"><div className="table-responsive"><table className="table-dn">
            <thead><tr><th>Date</th><th>Spot</th><th>Account</th><th>Plan</th><th>Amount</th><th>Provider</th><th>Reference</th><th>Status</th></tr></thead>
            <tbody>
                {payments.map((p) => (
                    <tr key={String(p._id)}>
                        <td className="small">{fmtDate(p.paidAt || p.createdAt)}</td>
                        <td>{spotName[String(p.spot)] || '—'}</td>
                        <td className="small">{email[String(p.user)] || '—'}</td>
                        <td>{PLANS[p.plan].name}{p.firstCustomerDiscount ? ' · first customer' : ''}</td>
                        <td><b>{naira(p.amount)}</b></td>
                        <td>{p.provider}</td>
                        <td className="small"><code>{p.reference}</code></td>
                        <td><span className={`pill ${p.status === 'success' ? 'pill-green' : p.status === 'failed' ? 'pill-red' : 'pill-amber'}`}>{p.status}</span></td>
                    </tr>
                ))}
                {!payments.length && <tr><td colSpan={8} className="text-center text-muted-dn py-4">No payments yet.</td></tr>}
            </tbody>
        </table></div></div>
    );
}
