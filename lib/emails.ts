// Branded transactional email templates (table layout + inline styles so they survive Gmail/Outlook).
import { PLANS, type PlanKey } from '@/lib/plans';
import { naira, fmtDate } from '@/lib/format';
import { siteUrl } from '@/lib/seo';

const C = {
    primary: '#E8590C',
    primaryDark: '#C2410C',
    accent: '#F59F00',
    accentSoft: '#FFD8A8',
    cocoa: '#3B1D0E',
    ink: '#2B1A12',
    muted: '#7A6358',
    cream: '#FFF8F0',
    sand: '#FDEBD3',
    line: '#F1DFCC',
    green: '#2B8A3E',
    chili: '#C92A2A'
};
const SANS = "'Jost','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Fraunces',Georgia,'Times New Roman',serif";

export const esc = (s: unknown) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface Email {
    subject: string;
    html: string;
    text: string;
}

// ---------- building blocks ----------
const p = (html: string) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.65;color:${C.ink};">${html}</p>`;
const small = (html: string) => `<p style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};">${html}</p>`;

function button(label: string, href: string) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td align="center" bgcolor="${C.primary}" style="border-radius:999px;background:${C.primary};background-image:linear-gradient(135deg,${C.primaryDark},${C.primary} 45%,${C.accent});">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)} &rarr;</a>
</td></tr></table>`;
}

function rows(items: [string, string][]) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};border:1px solid ${C.line};border-radius:14px;margin:4px 0 22px;">
${items
    .map(
        ([k, v], i) => `<tr><td style="padding:12px 18px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${SANS};font-size:14px;color:${C.muted};">${esc(k)}</td>
<td align="right" style="padding:12px 18px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${SANS};font-size:14px;font-weight:600;color:${C.ink};">${v}</td></tr>`
    )
    .join('')}
</table>`;
}

function steps(items: [string, string, string][]) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
${items
    .map(
        ([emoji, title, body]) => `<tr><td valign="top" width="52" style="padding:0 0 14px;"><div style="width:40px;height:40px;line-height:40px;text-align:center;border-radius:12px;background:${C.sand};font-size:20px;">${emoji}</div></td>
<td valign="top" style="padding:0 0 14px;font-family:${SANS};"><div style="font-size:15px;font-weight:600;color:${C.ink};">${title}</div><div style="font-size:14px;line-height:1.55;color:${C.muted};">${body}</div></td></tr>`
    )
    .join('')}
</table>`;
}

const pill = (label: string, bg: string, fg: string) =>
    `<span style="display:inline-block;padding:5px 14px;border-radius:999px;background:${bg};color:${fg};font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">${esc(label)}</span>`;

/** The branded shell every email shares. */
function layout(o: { preheader: string; kicker?: string; title: string; titleAccent?: string; body: string; base?: string }) {
    const base = (o.base || siteUrl()).replace(/\/$/, '');
    const year = new Date().getFullYear();
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<style>@media (max-width:620px){.dn-card{border-radius:0!important}.dn-pad{padding-left:22px!important;padding-right:22px!important}.dn-h1{font-size:26px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cream};">${esc(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" class="dn-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(59,29,14,.10);">
    <tr><td bgcolor="${C.primary}" style="background:${C.primary};background-image:linear-gradient(135deg,${C.primaryDark},${C.primary} 45%,${C.accent});padding:26px 36px 24px;" class="dn-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td><a href="${base}" target="_blank"><img src="${base}/images/logo-light.png" width="150" height="49" alt="Diner.ng" style="display:block;border:0;width:150px;height:auto;"></a></td>
        <td align="right" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${C.accentSoft};">one table away</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:6px;line-height:6px;font-size:0;background:${C.sand};">&nbsp;</td></tr>
    <tr><td class="dn-pad" style="padding:34px 40px 12px;">
      ${o.kicker ? `<div style="margin:0 0 10px;">${o.kicker}</div>` : ''}
      <h1 class="dn-h1" style="margin:0 0 18px;font-family:${SANS};font-size:30px;line-height:1.2;font-weight:600;color:${C.cocoa};">${esc(o.title)}${
          o.titleAccent ? ` <span style="font-family:${SERIF};font-style:italic;font-weight:600;color:${C.primary};">${esc(o.titleAccent)}</span>` : ''
      }</h1>
      ${o.body}
    </td></tr>
    <tr><td class="dn-pad" style="padding:6px 40px 30px;">
      ${p(`With love (and a slightly full stomach),<br><b>The Diner.ng team</b>`)}
    </td></tr>
    <tr><td bgcolor="${C.cocoa}" style="background:${C.cocoa};padding:22px 40px;" class="dn-pad">
      <p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.accentSoft};">
        <a href="${base}/explore" style="color:#ffffff;text-decoration:none;font-weight:600;">Explore spots</a> &nbsp;·&nbsp;
        <a href="${base}/dashboard" style="color:#ffffff;text-decoration:none;font-weight:600;">Your dashboard</a> &nbsp;·&nbsp;
        <a href="${base}/blog" style="color:#ffffff;text-decoration:none;font-weight:600;">Blog</a>
      </p>
      <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:#C9B3A6;">
        You're getting this because you have a Diner.ng account. Questions? Just reply to this email.<br>© ${year} Diner.ng · Nigeria's fun spots, one table away.
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const textFooter = `\n\n— The Diner.ng team\nNigeria's fun spots, one table away.`;
const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there';
const planName = (k: PlanKey) => PLANS[k]?.name || k;

// ---------- templates ----------

export function verifyEmailTemplate(o: { name: string; url: string; base?: string; hours?: number }): Email {
    const hours = o.hours ?? 24;
    return {
        subject: 'Confirm your email — your table at Diner.ng is waiting',
        html: layout({
            base: o.base,
            preheader: 'One tap to confirm your email and finish setting up your spot.',
            kicker: pill('Almost there', C.sand, C.primaryDark),
            title: `Hey ${first(o.name)}, is this`,
            titleAccent: 'really you?',
            body:
                p(`Thanks for signing up to Diner.ng! Before we roll out the red carpet (well, the orange one), please confirm this is your email address.`) +
                button('Confirm my email', o.url) +
                small(`This link expires in ${hours} hours. If the button doesn't work, paste this into your browser:<br><a href="${esc(o.url)}" style="color:${C.primary};word-break:break-all;">${esc(o.url)}</a>`) +
                small(`Didn't sign up? No wahala — just ignore this email and nothing will happen.`)
        }),
        text: `Hey ${first(o.name)},\n\nPlease confirm your email address to finish signing up to Diner.ng:\n${o.url}\n\nThis link expires in ${hours} hours. Didn't sign up? Just ignore this email.${textFooter}`
    };
}

export function welcomeTemplate(o: { name: string; base?: string }): Email {
    const base = (o.base || siteUrl()).replace(/\/$/, '');
    return {
        subject: `Welcome to Diner.ng, ${first(o.name)}! 🎉`,
        html: layout({
            base,
            preheader: "You're in! Here's how to get your spot live and your guests smiling.",
            kicker: pill("You're in", C.sand, C.primaryDark),
            title: 'Welcome to the',
            titleAccent: 'party!',
            body:
                p(`${esc(first(o.name))}, your email is confirmed and your Diner.ng account is ready. You've just joined Nigeria's liveliest directory of restaurants, lounges, sitouts and fun spots — and we're so glad you're here.`) +
                p(`Here's the fast lane to a buzzing listing:`) +
                steps([
                    ['📸', 'Show off your spot', 'Add a cover photo and a few gallery shots. Guests eat with their eyes first.'],
                    ['📖', 'Build your QR menu', 'Add dishes, prices and photos. Update them anytime — no reprinting menus, ever.'],
                    ['🚀', 'Go live', 'Pick a plan and your spot appears on Diner.ng for thousands of hungry explorers.'],
                    ['⭐', 'Collect the love', 'Guests rate and review you; Sweet plan spots also take table bookings.']
                ]) +
                button('Open my dashboard', `${base}/dashboard`) +
                small(`Need a hand? Reply to this email — a real human reads every one.`)
        }),
        text: `Welcome to Diner.ng, ${first(o.name)}!\n\nYour account is ready. Next steps:\n1. Add photos of your spot\n2. Build your QR menu\n3. Pick a plan and go live\n4. Collect reviews (and bookings on Sweet)\n\nOpen your dashboard: ${base}/dashboard${textFooter}`
    };
}

export interface ReceiptData {
    name: string;
    spotName: string;
    plan: PlanKey;
    amount: number;
    regularAmount?: number;
    firstCustomerDiscount?: boolean;
    reference: string;
    transactionId?: string;
    provider: string;
    paidAt: Date;
    periodStart?: Date;
    periodEnd?: Date;
    base?: string;
}

export function paymentReceiptTemplate(o: ReceiptData): Email {
    const base = (o.base || siteUrl()).replace(/\/$/, '');
    const discount = o.regularAmount && o.regularAmount > o.amount ? o.regularAmount - o.amount : 0;
    const method = o.provider === 'flutterwave' ? 'Flutterwave' : o.provider === 'manual' ? 'Bank transfer / offline' : o.provider === 'demo' ? 'Demo (no charge)' : o.provider;
    const items: [string, string][] = [
        ['Spot', esc(o.spotName)],
        ['Plan', `${esc(planName(o.plan))} · 30 days`],
        ...(o.periodStart && o.periodEnd ? ([['Period', `${fmtDate(o.periodStart)} – ${fmtDate(o.periodEnd)}`]] as [string, string][]) : []),
        ...(discount ? ([['Regular price', `<span style="text-decoration:line-through;color:${C.muted};">${naira(o.regularAmount)}</span>`], [o.firstCustomerDiscount ? 'First customer discount' : 'Discount', `<span style="color:${C.green};">−${naira(discount)}</span>`]] as [string, string][]) : []),
        ['Payment method', esc(method)],
        ['Reference', `<span style="font-family:Menlo,Consolas,monospace;font-size:13px;">${esc(o.reference)}</span>`],
        ...(o.transactionId ? ([['Transaction ID', esc(o.transactionId)]] as [string, string][]) : []),
        ['Date', fmtDate(o.paidAt)]
    ];
    return {
        subject: `Receipt: ${naira(o.amount)} for ${planName(o.plan)} plan — ${o.spotName}`,
        html: layout({
            base,
            preheader: `We received ${naira(o.amount)} for your ${planName(o.plan)} plan. Thank you!`,
            kicker: pill('Payment received', '#E6F4EA', C.green),
            title: 'Chop-chop,',
            titleAccent: 'payment received!',
            body:
                p(`Thanks ${esc(first(o.name))}! Here's your receipt for <b>${esc(o.spotName)}</b>. Keep it handy for your records.`) +
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;"><tr>
<td style="font-family:${SANS};font-size:13px;color:${C.muted};text-transform:uppercase;letter-spacing:.08em;">Amount paid</td></tr>
<tr><td style="font-family:${SANS};font-size:38px;font-weight:600;color:${C.cocoa};padding:2px 0 14px;">${naira(o.amount)}</td></tr></table>` +
                rows(items) +
                button('View billing', `${base}/dashboard/billing`) +
                small(`Diner.ng plans run for 30 days at a time and don't renew automatically — we'll remind you before yours ends.`)
        }),
        text: `Payment received — thank you!\n\nAmount: ${naira(o.amount)}\nSpot: ${o.spotName}\nPlan: ${planName(o.plan)} (30 days)${o.periodStart && o.periodEnd ? `\nPeriod: ${fmtDate(o.periodStart)} – ${fmtDate(o.periodEnd)}` : ''}${discount ? `\nDiscount: -${naira(discount)}` : ''}\nMethod: ${method}\nReference: ${o.reference}${o.transactionId ? `\nTransaction ID: ${o.transactionId}` : ''}\nDate: ${fmtDate(o.paidAt)}\n\nBilling: ${base}/dashboard/billing${textFooter}`
    };
}

export type SubscriptionEvent = 'activated' | 'upgraded' | 'downgraded' | 'expiring' | 'expired' | 'hidden' | 'restored';

export function subscriptionStatusTemplate(o: { event: SubscriptionEvent; name: string; spotName: string; spotSlug?: string; plan?: PlanKey | null; periodEnd?: Date | null; base?: string }): Email {
    const base = (o.base || siteUrl()).replace(/\/$/, '');
    const plan = o.plan ? planName(o.plan) : 'your';
    const end = o.periodEnd ? fmtDate(o.periodEnd) : '';
    const days = o.periodEnd ? Math.max(0, Math.ceil((new Date(o.periodEnd).getTime() - Date.now()) / 864e5)) : 0;
    const listing = o.spotSlug ? `${base}/spots/${o.spotSlug}` : `${base}/dashboard`;
    const n = esc(first(o.name));
    const s = esc(o.spotName);

    const v: Record<SubscriptionEvent, { subject: string; pre: string; kicker: string; title: string; accent: string; body: string; cta: [string, string]; text: string }> = {
        activated: {
            subject: `🎉 ${o.spotName} is live on Diner.ng!`,
            pre: `Your ${plan} plan is active — guests can now find you.`,
            kicker: pill('Status: Live', '#E6F4EA', C.green),
            title: 'Lights on,',
            accent: "you're live!",
            body: p(`Big news, ${n}: <b>${s}</b> is now live on Diner.ng on the <b>${esc(plan)}</b> plan. Your listing is public, your QR menu is switched on and guests can start leaving reviews.`) + rows([['Plan', esc(plan)], ['Active until', end]]) + p(`Pro tip: print your QR code and pop it on every table — scans turn into reviews, and reviews turn into full tables.`),
            cta: ['See my listing', listing],
            text: `${o.spotName} is live on Diner.ng on the ${plan} plan, active until ${end}.`
        },
        upgraded: {
            subject: `🌟 ${o.spotName} is now on Sweet!`,
            pre: 'Featured placement and table bookings are switched on.',
            kicker: pill('Plan upgraded', C.sand, C.primaryDark),
            title: 'Welcome to',
            accent: 'the sweet life!',
            body: p(`${n}, <b>${s}</b> has been upgraded to <b>${esc(plan)}</b>. That means featured placement on the homepage and search, plus table bookings and table management in your dashboard.`) + rows([['Plan', esc(plan)], ['Active until', end]]),
            cta: ['Set up bookings', `${base}/dashboard/tables`],
            text: `${o.spotName} has been upgraded to ${plan}, active until ${end}. Set up bookings: ${base}/dashboard/tables`
        },
        downgraded: {
            subject: `Your plan for ${o.spotName} has changed`,
            pre: `You're now on the ${plan} plan.`,
            kicker: pill('Plan changed', C.sand, C.primaryDark),
            title: 'Plan',
            accent: 'updated',
            body: p(`${n}, <b>${s}</b> is now on the <b>${esc(plan)}</b> plan. Your listing and QR menu stay live; featured placement and table bookings are paused until you switch back to Sweet.`) + rows([['Plan', esc(plan)], ['Active until', end]]),
            cta: ['View billing', `${base}/dashboard/billing`],
            text: `${o.spotName} is now on the ${plan} plan, active until ${end}.`
        },
        expiring: {
            subject: `⏰ ${o.spotName}'s plan ends in ${days} day${days === 1 ? '' : 's'}`,
            pre: `Renew before ${end} to stay live and keep your QR menu on.`,
            kicker: pill('Heads up', '#FFF3BF', '#8a5a00'),
            title: "Don't let the",
            accent: 'music stop!',
            body: p(`${n}, your <b>${esc(plan)}</b> plan for <b>${s}</b> ends on <b>${end}</b> — that's ${days} day${days === 1 ? '' : 's'} away. Renew now so your listing stays public and guests scanning your QR code still see your menu.`),
            cta: ['Renew my plan', `${base}/dashboard/billing`],
            text: `Your ${plan} plan for ${o.spotName} ends on ${end}. Renew: ${base}/dashboard/billing`
        },
        expired: {
            subject: `${o.spotName} is offline — renew to go live again`,
            pre: 'Your plan has ended. Renew in two minutes to come back online.',
            kicker: pill('Status: Offline', '#FDE2E2', C.chili),
            title: 'We miss you',
            accent: 'already.',
            body: p(`${n}, the <b>${esc(plan)}</b> plan for <b>${s}</b> ended on <b>${end}</b>, so your listing and QR menu are hidden for now. Don't worry — your photos, menu, reviews and settings are all safe. Renew and you'll be back live instantly.`),
            cta: ['Renew & go live', `${base}/dashboard/billing`],
            text: `The ${plan} plan for ${o.spotName} ended on ${end}; your listing is offline. Renew: ${base}/dashboard/billing`
        },
        hidden: {
            subject: `${o.spotName} has been hidden from Diner.ng`,
            pre: 'An admin has temporarily unpublished your listing.',
            kicker: pill('Status: Hidden', '#FDE2E2', C.chili),
            title: 'Your listing is',
            accent: 'on pause',
            body: p(`${n}, a Diner.ng admin has temporarily hidden <b>${s}</b> from the directory. Your plan and data are unaffected. If you're not sure why, just reply to this email and we'll sort it out together.`),
            cta: ['Go to dashboard', `${base}/dashboard`],
            text: `A Diner.ng admin has temporarily hidden ${o.spotName}. Reply to this email if you have questions.`
        },
        restored: {
            subject: `${o.spotName} is back on Diner.ng`,
            pre: 'Your listing is visible again.',
            kicker: pill('Status: Live', '#E6F4EA', C.green),
            title: 'And we are',
            accent: 'back!',
            body: p(`Good news, ${n}: <b>${s}</b> is visible on Diner.ng again. Guests can find you, scan your QR menu and leave reviews.`),
            cta: ['See my listing', listing],
            text: `${o.spotName} is visible on Diner.ng again.`
        }
    };
    const x = v[o.event];
    return {
        subject: x.subject,
        html: layout({ base, preheader: x.pre, kicker: x.kicker, title: x.title, titleAccent: x.accent, body: x.body + button(x.cta[0], x.cta[1]) }),
        text: `Hi ${first(o.name)},\n\n${x.text}\n\n${x.cta[0]}: ${x.cta[1]}${textFooter}`
    };
}
