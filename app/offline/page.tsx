import Logo from '@/components/Logo';
import RetryButton from './RetryButton';

export const metadata = { title: 'You’re offline', robots: { index: false } };
export const dynamic = 'force-static';

export default function OfflinePage() {
    return (
        <section className="dn-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="container text-center" style={{ maxWidth: 560 }}>
                <div className="d-flex justify-content-center mb-4"><Logo height={46} /></div>
                <div className="step-card p-0 shadow-none" style={{ background: 'none' }}><span className="ic"><i className="fas fa-wifi"></i></span></div>
                <h1 style={{ fontSize: 32 }}>Looks like the network went to buy suya</h1>
                <p className="text-muted-dn">You&apos;re offline right now. Check your connection and try again — the tables will still be here.</p>
                <RetryButton />
            </div>
        </section>
    );
}
