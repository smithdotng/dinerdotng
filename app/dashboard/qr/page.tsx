import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { hasSweet, isLive } from '@/lib/spot';
import { appUrl } from '@/lib/appUrl';
import { menuUrl, qrDataUrl } from '@/lib/qr';
import Logo from '@/components/Logo';
import { CopyButton } from '@/components/ClientBits';

export default async function QrPage() {
    const { spot } = await requireOwnerSpot();
    const url = menuUrl(await appUrl(), spot.slug);
    const dataUrl = await qrDataUrl(url);
    const sweet = hasSweet(spot);
    return (
        <div className="row g-4">
            <div className="col-lg-5">
                <div className="qr-box">
                    <div className="dn-logo justify-content-center mb-2"><Logo height={34} /></div>
                    <h4 className="mb-1">{spot.name}</h4>
                    <p className="text-muted-dn small">Scan to view our menu</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dataUrl} alt={`QR code for ${spot.name} menu`} />
                    <div className="small mt-2" style={{ wordBreak: 'break-all' }}>{url}</div>
                </div>
            </div>
            <div className="col-lg-7">
                {!isLive(spot) && (
                    <div className="alert alert-info"><i className="fas fa-circle-info me-2"></i>Your QR code is ready, but guests will only see the menu once your plan is active. <Link href="/dashboard/billing"><b>Go live</b></Link></div>
                )}
                <div className="card-dn">
                    <h5>Your unique menu link</h5>
                    <div className="d-flex gap-2 mb-3"><input className="form-control" value={url} readOnly /><CopyButton text={url} className="btn-dn-dark btn-sm-dn" /></div>
                    <div className="d-flex gap-2 flex-wrap">
                        <a className="btn-dn" href="/api/qr"><i className="fas fa-download"></i> Download PNG</a>
                        <Link className="btn-dn-outline" href="/print/qr" target="_blank"><i className="fas fa-print"></i> Print table cards</Link>
                        <Link className="btn-dn-outline" href={`/m/${spot.slug}`} target="_blank"><i className="fas fa-mobile-screen"></i> Open menu</Link>
                    </div>
                </div>
                <div className="card-dn">
                    <h5>Per-table QR codes {!sweet && <span className="pill pill-featured ms-1">SWEET</span>}</h5>
                    <p className="text-muted-dn">Give every table its own code so staff know exactly where a guest is sitting when they scan.</p>
                    {sweet ? (
                        <div className="d-flex gap-2 flex-wrap">
                            <Link className="btn-dn-outline" href="/print/qr?tables=1" target="_blank"><i className="fas fa-print"></i> Print a card for every table</Link>
                            <Link className="btn-dn-outline" href="/dashboard/tables">Manage tables</Link>
                        </div>
                    ) : (
                        <Link className="btn-dn" href="/dashboard/billing?plan=sweet"><i className="fas fa-star"></i> Upgrade to Sweet</Link>
                    )}
                </div>
                <div className="card-dn">
                    <h5>Tips</h5>
                    <ul className="text-muted-dn mb-0 small">
                        <li>Print at least 8cm wide so older phones can scan easily.</li>
                        <li>Place codes on every table, at the entrance and on the bar.</li>
                        <li>Your QR never changes — update prices or dishes any time without reprinting.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
