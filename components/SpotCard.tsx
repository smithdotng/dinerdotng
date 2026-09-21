import Link from 'next/link';
import { IMAGES } from '@/lib/images';
import { canTakeReservations, isFeatured, locationOf, priceLabel, typeIcon, typeLabel } from '@/lib/spot';
import type { ISpot } from '@/models/Spot';

export default function SpotCard({ s }: { s: ISpot }) {
    return (
        <Link href={`/spots/${s.slug}`} className="spot-card">
            <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.coverImage || IMAGES.typeCover[s.type]} alt={s.name} loading="lazy" />
                <div className="badges">
                    {isFeatured(s) && <span className="pill pill-featured"><i className="fas fa-crown"></i> Featured</span>}
                    <span className="pill pill-type"><i className={`fas ${typeIcon(s)}`}></i> {typeLabel(s)}</span>
                </div>
            </div>
            <div className="body">
                <h4>{s.name}</h4>
                <div className="meta">
                    <span><i className="fas fa-location-dot text-primary-dn"></i> {locationOf(s) || s.city}</span>
                    <span>{priceLabel(s)}</span>
                </div>
                {s.tagline && <p className="tagline">{s.tagline}</p>}
                <div className="foot">
                    {s.ratingCount ? (
                        <span className="rating-chip">
                            <i className="fas fa-star"></i> {s.ratingAvg.toFixed(1)} <small className="text-muted-dn fw-normal">({s.ratingCount})</small>
                        </span>
                    ) : (
                        <span className="text-muted-dn small">New on Diner.ng</span>
                    )}
                    {canTakeReservations(s) ? (
                        <span className="pill pill-book"><i className="fas fa-calendar-check"></i> Book a table</span>
                    ) : (
                        <span className="pill pill-soft"><i className="fas fa-qrcode"></i> QR menu</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
