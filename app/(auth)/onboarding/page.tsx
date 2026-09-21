import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Spot } from '@/models/Spot';
import { SPOT_TYPES, SPOT_TYPE_KEYS } from '@/lib/spot';
import { createSpotAction } from '@/actions/auth';

export const metadata = { title: 'Set up your spot' };

export default async function OnboardingPage() {
    const user = await requireAuth();
    await connectDB();
    if (await Spot.exists({ owner: user.id })) redirect('/dashboard');
    return (
        <>
            <span className="section-kicker" style={{ marginLeft: -8 }}>Step 2 of 3</span>
            <h1>Tell us about your spot</h1>
            <p className="text-muted-dn mb-4">You can add photos, your menu and more details from your dashboard.</p>
            <form action={createSpotAction}>
                <div className="mb-3"><label className="form-label">Spot name</label><input className="form-control" name="name" placeholder="e.g. Mama Put Deluxe" required /></div>
                <label className="form-label">What kind of spot is it?</label>
                <div className="plan-picker mb-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' }}>
                    {SPOT_TYPE_KEYS.map((k) => (
                        <div key={k}>
                            <input type="radio" name="type" id={`t-${k}`} value={k} defaultChecked={k === 'restaurant'} />
                            <label htmlFor={`t-${k}`} className="text-center">
                                <i className={`fas ${SPOT_TYPES[k].icon} text-primary-dn d-block mb-1`} style={{ fontSize: 20 }}></i>
                                <b style={{ fontSize: 14 }}>{SPOT_TYPES[k].label}</b>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="mb-3"><label className="form-label">Tagline</label><input className="form-control" name="tagline" maxLength={120} placeholder="Smoky jollof, cold chapman and good vibes" /></div>
                <div className="row g-3 mb-3">
                    <div className="col-sm-6"><label className="form-label">Area / neighbourhood</label><input className="form-control" name="area" placeholder="Wuse 2" /></div>
                    <div className="col-sm-6"><label className="form-label">City</label><input className="form-control" name="city" placeholder="Abuja" required /></div>
                </div>
                <div className="mb-3"><label className="form-label">Street address</label><input className="form-control" name="address" /></div>
                <div className="row g-3 mb-4">
                    <div className="col-sm-6"><label className="form-label">Phone for guests</label><input className="form-control" name="phone" /></div>
                    <div className="col-sm-6"><label className="form-label">State</label><input className="form-control" name="state" placeholder="FCT" /></div>
                </div>
                <button className="btn-dn btn-block btn-lg-dn">Continue to plans <i className="fas fa-arrow-right"></i></button>
            </form>
        </>
    );
}
