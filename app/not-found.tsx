import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
    return (
        <section className="dn-section">
            <div className="container mb-4"><Link href="/" className="dn-logo"><Logo height={38} /></Link></div>
            <div className="container text-center" style={{ maxWidth: 640 }}>
                <div className="err-code">404</div>
                <h2 className="mt-2">Page not found</h2>
                <p className="text-muted-dn">We couldn&apos;t find that page. It may have moved, or the spot is no longer listed.</p>
                <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
                    <Link href="/" className="btn-dn"><i className="fas fa-house"></i> Home</Link>
                    <Link href="/explore" className="btn-dn-outline">Explore spots</Link>
                </div>
            </div>
        </section>
    );
}
