'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Kind = 'success' | 'error' | 'info';
const ICON: Record<Kind, string> = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
const CLS: Record<Kind, string> = { success: 'alert-success', error: 'alert-danger', info: 'alert-info' };

/** One-time messages passed as ?success= / ?error= / ?info= after a Server Action redirect. */
export default function Flash({ messages }: { messages?: Partial<Record<Kind, string>> }) {
    const params = useSearchParams();
    const [items, setItems] = useState<{ kind: Kind; text: string }[]>([]);

    useEffect(() => {
        const found: { kind: Kind; text: string }[] = [];
        (['success', 'error', 'info'] as Kind[]).forEach((k) => {
            const text = messages?.[k] || params.get(k);
            if (text) found.push({ kind: k, text });
        });
        // Stripping the params below re-triggers this effect with no messages — keep what we showed.
        if (!found.length) return;
        setItems(found);
        if (params.get('success') || params.get('error') || params.get('info')) {
            const url = new URL(window.location.href);
            ['success', 'error', 'info'].forEach((k) => url.searchParams.delete(k));
            window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
    }, [params, messages]);

    useEffect(() => {
        if (!items.length) return;
        const t = setTimeout(() => setItems([]), 7000);
        return () => clearTimeout(t);
    }, [items]);

    if (!items.length) return null;
    return (
        <div className="dn-flash" role="status">
            {items.map((m, i) => (
                <div key={i} className={`alert ${CLS[m.kind]}`}>
                    <i className={`fas ${ICON[m.kind]} mt-1`}></i>
                    <div>{m.text}</div>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setItems((x) => x.filter((_, j) => j !== i))}></button>
                </div>
            ))}
        </div>
    );
}
