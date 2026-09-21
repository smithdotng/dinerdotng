import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { reconcilePayment } from '@/lib/subscription';

// Flutterwave webhook: activates a plan even if the owner never returns from checkout.
// Configure in Flutterwave > Settings > Webhooks with the same secret hash as FLW_WEBHOOK_HASH.
export async function POST(req: Request) {
    const hash = process.env.FLW_WEBHOOK_HASH;
    if (!hash || req.headers.get('verif-hash') !== hash) return new Response('Unauthorized', { status: 401 });

    const body = await req.json().catch(() => null);
    const data = body?.data;
    if (!data?.id || !data?.tx_ref) return new Response('ignored', { status: 200 });

    await connectDB();
    const payment = await Payment.findOne({ reference: data.tx_ref });
    if (!payment || payment.status === 'success') return new Response('ok', { status: 200 });

    try {
        await reconcilePayment(payment, String(data.id)); // re-verifies with Flutterwave; never trusts the payload
    } catch (e) {
        console.error('Flutterwave webhook verify failed', e);
        return new Response('retry', { status: 500 });
    }
    return new Response('ok', { status: 200 });
}
