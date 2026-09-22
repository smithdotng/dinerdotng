import { paymentReceiptTemplate, subscriptionStatusTemplate, verifyEmailTemplate, welcomeTemplate, type Email, type SubscriptionEvent } from '@/lib/emails';
import { siteUrl } from '@/lib/seo';

const inDays = (d: number) => new Date(Date.now() + d * 864e5);
const events: [SubscriptionEvent, string][] = [
    ['activated', 'Status: live'],
    ['upgraded', 'Status: upgraded to Sweet'],
    ['downgraded', 'Status: moved to Basic'],
    ['expiring', 'Status: ending soon'],
    ['expired', 'Status: expired'],
    ['hidden', 'Status: hidden by admin'],
    ['restored', 'Status: restored']
];

/** Every email the app sends, filled with sample data, for previewing and test sends. */
export function sampleEmails(name = 'Stanley'): { key: string; label: string; email: Email }[] {
    const base = siteUrl();
    return [
        { key: 'verify', label: 'Confirm email', email: verifyEmailTemplate({ name, url: `${base}/verify-email/confirm?token=sample-token-sample-token`, base }) },
        { key: 'welcome', label: 'Welcome', email: welcomeTemplate({ name, base }) },
        {
            key: 'receipt',
            label: 'Payment receipt',
            email: paymentReceiptTemplate({ name, spotName: 'Mama Put Deluxe', plan: 'basic', amount: 2999, regularAmount: 14999, firstCustomerDiscount: true, reference: 'DNG-1790000000000-AB12', transactionId: '4812337', provider: 'flutterwave', paidAt: new Date(), periodStart: new Date(), periodEnd: inDays(30), base })
        },
        ...events.map(([event, label]) => ({
            key: event,
            label,
            email: subscriptionStatusTemplate({ event, name, spotName: 'Mama Put Deluxe', spotSlug: 'mama-put-deluxe-abuja', plan: event === 'upgraded' ? 'sweet' : 'basic', periodEnd: event === 'expired' ? inDays(-1) : event === 'expiring' ? inDays(3) : inDays(30), base })
        }))
    ];
}
