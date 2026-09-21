// Minimal Flutterwave Standard (v3) client.
// Docs: https://developer.flutterwave.com/v3.0/docs/flutterwave-standard-1
const BASE = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';

export const flutterwaveEnabled = () => Boolean(process.env.FLW_SECRET_KEY);

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(BASE + path, {
        method,
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 'success') throw new Error(data.message || `Flutterwave error (${res.status})`);
    return data.data as T;
}

/** Create a hosted checkout link. amount is in Naira. */
export const createPaymentLink = (p: {
    txRef: string;
    amount: number;
    redirectUrl: string;
    customer: { email: string; name?: string; phonenumber?: string };
    title?: string;
    description?: string;
    logo?: string;
    meta?: Record<string, unknown>;
}) =>
    call<{ link: string }>('POST', '/payments', {
        tx_ref: p.txRef,
        amount: p.amount,
        currency: 'NGN',
        redirect_url: p.redirectUrl,
        customer: p.customer,
        customizations: { title: p.title || 'Diner.ng', description: p.description, logo: p.logo },
        meta: p.meta
    });

export interface FlwTransaction {
    id: number;
    tx_ref: string;
    status: string; // 'successful' | 'failed' | 'pending'
    amount: number;
    currency: string;
}

/** Always verify server-side before giving value — never trust the redirect's query string alone. */
export const verifyTransaction = (id: string) => call<FlwTransaction>('GET', `/transactions/${encodeURIComponent(id)}/verify`);
export const verifyByReference = (txRef: string) =>
    call<FlwTransaction>('GET', `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`);
