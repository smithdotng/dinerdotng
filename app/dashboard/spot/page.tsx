import { requireOwnerSpot } from '@/lib/owner';
import { DAYS, SPOT_TYPES, SPOT_TYPE_KEYS } from '@/lib/spot';
import { IMAGES } from '@/lib/images';
import { addGalleryAction, removeGalleryAction, updateSpotAction, uploadCoverAction } from '@/actions/owner';
import PlanBanner from '@/components/PlanBanner';
import { ConfirmButton, ImageInput } from '@/components/ClientBits';

export default async function SpotPage() {
    const { spot } = await requireOwnerSpot();
    return (
        <>
            <PlanBanner spot={spot} />
            <form action={updateSpotAction}>
                <div className="row g-4">
                    <div className="col-xl-8">
                        <div className="card-dn">
                            <h5>Basic details</h5>
                            <div className="row g-3">
                                <div className="col-md-8"><label className="form-label">Spot name</label><input className="form-control" name="name" defaultValue={spot.name} required /></div>
                                <div className="col-md-4"><label className="form-label">Type</label>
                                    <select className="form-select" name="type" defaultValue={spot.type}>{SPOT_TYPE_KEYS.map((k) => <option key={k} value={k}>{SPOT_TYPES[k].label}</option>)}</select></div>
                                <div className="col-12"><label className="form-label">Tagline</label><input className="form-control" name="tagline" defaultValue={spot.tagline} maxLength={120} /></div>
                                <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" name="description" rows={5} maxLength={2000} defaultValue={spot.description} placeholder="Tell guests what makes your spot special"></textarea></div>
                                <div className="col-md-8"><label className="form-label">Cuisines / specialties</label><input className="form-control" name="cuisines" defaultValue={spot.cuisines.join(', ')} placeholder="Nigerian, Grills, Seafood" /><div className="form-text">Separate with commas</div></div>
                                <div className="col-md-4"><label className="form-label">Price range</label>
                                    <select className="form-select" name="priceRange" defaultValue={spot.priceRange}>
                                        {['Budget', 'Moderate', 'Upscale', 'Fine dining'].map((l, i) => <option key={l} value={i + 1}>{'₦'.repeat(i + 1)} — {l}</option>)}
                                    </select></div>
                            </div>
                        </div>
                        <div className="card-dn">
                            <h5>Location &amp; contacts</h5>
                            <div className="row g-3">
                                <div className="col-12"><label className="form-label">Street address</label><input className="form-control" name="address" defaultValue={spot.address} /></div>
                                <div className="col-md-4"><label className="form-label">Area</label><input className="form-control" name="area" defaultValue={spot.area} /></div>
                                <div className="col-md-4"><label className="form-label">City</label><input className="form-control" name="city" defaultValue={spot.city} required /></div>
                                <div className="col-md-4"><label className="form-label">State</label><input className="form-control" name="state" defaultValue={spot.state} /></div>
                                <div className="col-md-4"><label className="form-label">Phone</label><input className="form-control" name="phone" defaultValue={spot.phone} /></div>
                                <div className="col-md-4"><label className="form-label">WhatsApp</label><input className="form-control" name="whatsapp" defaultValue={spot.whatsapp} /></div>
                                <div className="col-md-4"><label className="form-label">Email</label><input className="form-control" type="email" name="email" defaultValue={spot.email} /></div>
                                <div className="col-md-6"><label className="form-label">Website</label><input className="form-control" name="website" defaultValue={spot.website} /></div>
                                <div className="col-md-6"><label className="form-label">Instagram</label><input className="form-control" name="instagram" defaultValue={spot.instagram} placeholder="@yourspot" /></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4">
                        <div className="card-dn">
                            <h5>Opening hours</h5>
                            {DAYS.map((d) => {
                                const hr = spot.hours.find((x) => x.day === d) || { open: '10:00', close: '22:00', closed: false };
                                return (
                                    <div key={d} className="d-flex align-items-center gap-2 mb-2">
                                        <span style={{ width: 40, fontWeight: 600, fontSize: 14 }}>{d.slice(0, 3)}</span>
                                        <input type="time" className="form-control form-control-sm" name="open" defaultValue={hr.open} />
                                        <input type="time" className="form-control form-control-sm" name="close" defaultValue={hr.close} />
                                        <label className="small d-flex align-items-center gap-1" title="Closed"><input type="checkbox" className="form-check-input m-0" name="closedDays" value={d} defaultChecked={hr.closed} /> Off</label>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="btn-dn btn-block btn-lg-dn mb-4"><i className="fas fa-floppy-disk"></i> Save details</button>
                    </div>
                </div>
            </form>

            <div className="card-dn" id="photos">
                <div className="card-head"><h5>Photos</h5><span className="small text-muted-dn">JPG / PNG / WEBP, max 5MB each</span></div>
                <div className="row g-4">
                    <div className="col-md-6">
                        <label className="form-label">Cover photo</label>
                        <form action={uploadCoverAction}>
                            <input type="hidden" name="kind" value="cover" />
                            <ImageInput name="image" current={spot.coverImage || IMAGES.typeCover[spot.type]} previewClass="cover-prev" required />
                            <button className="btn-dn btn-sm-dn mt-2">Upload cover</button>
                        </form>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Logo</label>
                        <form action={uploadCoverAction}>
                            <input type="hidden" name="kind" value="logo" />
                            {!spot.logo && <div className="text-muted-dn small mb-2">No logo yet</div>}
                            <ImageInput name="image" current={spot.logo} previewClass="spot-logo d-block mb-2" required />
                            <button className="btn-dn btn-sm-dn mt-2">Upload logo</button>
                        </form>
                    </div>
                </div>
                <hr style={{ borderColor: 'var(--dn-line)' }} />
                <label className="form-label">Gallery ({spot.gallery.length}/24)</label>
                <form action={addGalleryAction} className="d-flex gap-2 mb-3">
                    <ImageInput name="images" multiple required /><button className="btn-dn btn-sm-dn text-nowrap">Add photos</button>
                </form>
                <div className="photo-grid">
                    {spot.gallery.map((g) => (
                        <div key={String(g._id)} className="ph">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={g.url} alt="" />
                            <form action={removeGalleryAction.bind(null, String(g._id))}>
                                <ConfirmButton message="Remove this photo?" title="Remove"><i className="fas fa-trash"></i></ConfirmButton>
                            </form>
                        </div>
                    ))}
                    {!spot.gallery.length && <div className="text-muted-dn small">No gallery photos yet — show off your food, your space and your people.</div>}
                </div>
            </div>
        </>
    );
}
