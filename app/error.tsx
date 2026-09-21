'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
    return (
        <section className="dn-section">
            <div className="container text-center" style={{ maxWidth: 640 }}>
                <div className="err-code">500</div>
                <h2 className="mt-2">Something went wrong</h2>
                <p className="text-muted-dn">Something went wrong on our side. Please try again.</p>
                <button className="btn-dn mt-3" onClick={reset}>Try again</button>
            </div>
        </section>
    );
}
