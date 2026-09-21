import { requireOwnerSpot } from '@/lib/owner';
import { User } from '@/models/User';
import { hasSweet } from '@/lib/spot';
import { accountSettingsAction, reservationSettingsAction } from '@/actions/owner';

export default async function SettingsPage() {
    const { user, spot } = await requireOwnerSpot();
    const account = await User.findById(user.id).lean();
    const r = spot.reservations;
    return (
        <div className="row g-4">
            <div className="col-xl-6">
                <div className="card-dn">
                    <h5>Reservation settings {!hasSweet(spot) && <span className="pill pill-featured ms-1">SWEET</span>}</h5>
                    <form action={reservationSettingsAction} className="row g-3">
                        <div className="col-12"><label className="d-flex align-items-center gap-2"><input type="checkbox" className="form-check-input m-0" name="enabled" defaultChecked={r.enabled} /> Accept online bookings</label></div>
                        <div className="col-6"><label className="form-label">First booking time</label><input type="time" className="form-control" name="openTime" defaultValue={r.openTime} /></div>
                        <div className="col-6"><label className="form-label">Last booking by</label><input type="time" className="form-control" name="closeTime" defaultValue={r.closeTime} /></div>
                        <div className="col-6"><label className="form-label">Time slots every</label>
                            <select className="form-select" name="slotMinutes" defaultValue={r.slotMinutes}>{[15, 30, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></div>
                        <div className="col-6"><label className="form-label">Largest party online</label><input type="number" className="form-control" name="maxPartySize" min={1} max={50} defaultValue={r.maxPartySize} /></div>
                        <div className="col-12"><label className="form-label">Note shown to guests</label><input className="form-control" name="note" defaultValue={r.note} placeholder="e.g. Tables are held for 15 minutes" /></div>
                        <div className="col-12"><button className="btn-dn">Save reservation settings</button></div>
                    </form>
                </div>
            </div>
            <div className="col-xl-6">
                <div className="card-dn">
                    <h5>Your account</h5>
                    <form action={accountSettingsAction} className="row g-3">
                        <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" name="name" defaultValue={account?.name} required /></div>
                        <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" name="phone" defaultValue={account?.phone} /></div>
                        <div className="col-12"><label className="form-label">Email</label><input className="form-control" defaultValue={account?.email} disabled /></div>
                        <div className="col-md-6"><label className="form-label">Current password</label><input className="form-control" type="password" name="currentPassword" autoComplete="current-password" /></div>
                        <div className="col-md-6"><label className="form-label">New password</label><input className="form-control" type="password" name="newPassword" minLength={8} autoComplete="new-password" /></div>
                        <div className="col-12"><button className="btn-dn">Save account</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
}
