'use client';

export default function RetryButton() {
    return <button className="btn-dn mt-2" onClick={() => window.location.reload()}><i className="fas fa-rotate-right"></i> Try again</button>;
}
