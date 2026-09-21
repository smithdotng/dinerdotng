import Link from 'next/link';

export default function NotFound() {
    return (
        <section className="dn-section page-offset">
            <div className="container text-center" style={{ maxWidth: 640 }}>
                <div className="err-code">404</div>
                <h2 className="mt-2">We couldn&apos;t find that</h2>
                <p className="text-muted-dn">The page may have moved, or the spot is no longer listed on Diner.ng.</p>
                <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
                    <Link href="/" className="btn-dn"><i className="fas fa-house"></i> Home</Link>
                    <Link href="/explore" className="btn-dn-outline">Explore spots</Link>
                </div>
            </div>
        </section>
    );
}
