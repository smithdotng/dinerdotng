/**
 * Transactional email. Picks the first configured provider:
 *   1. Resend      — RESEND_API_KEY
 *   2. SMTP        — SMTP_HOST (+ SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE)  e.g. Zoho, Gmail, Brevo, Mailgun
 *   3. Console     — nothing set: emails are printed to the server log (local development)
 * The sender is MAIL_FROM, e.g. "Diner.ng <hello@diner.ng>".
 */
export interface MailMessage {
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
}

export const mailFrom = () => process.env.MAIL_FROM || 'Diner.ng <hello@diner.ng>';
export const mailProvider = () => (process.env.RESEND_API_KEY ? 'resend' : process.env.SMTP_HOST ? 'smtp' : 'console');

async function viaResend(m: MailMessage) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: mailFrom(), to: [m.to], subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo || process.env.MAIL_REPLY_TO || undefined }),
        cache: 'no-store'
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

type Transport = { sendMail: (o: Record<string, unknown>) => Promise<unknown> };
let smtp: Transport | null = null;
async function viaSmtp(m: MailMessage) {
    if (!smtp) {
        const nodemailer = await import('nodemailer');
        const port = Number(process.env.SMTP_PORT || 587);
        smtp = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
        }) as unknown as Transport;
    }
    await smtp.sendMail({ from: mailFrom(), to: m.to, subject: m.subject, html: m.html, text: m.text, replyTo: m.replyTo || process.env.MAIL_REPLY_TO || undefined });
}

/**
 * Send an email. Never throws: a mail outage must not break sign-up or payments.
 * Returns true when the provider accepted the message.
 */
export async function sendEmail(m: MailMessage): Promise<boolean> {
    const provider = mailProvider();
    try {
        if (provider === 'resend') await viaResend(m);
        else if (provider === 'smtp') await viaSmtp(m);
        else {
            console.log(`\n📧 [email:console] To: ${m.to}\n   Subject: ${m.subject}\n${m.text.split('\n').map((l) => '   ' + l).join('\n')}\n`);
        }
        return true;
    } catch (e) {
        console.error(`[email] failed to send "${m.subject}" to ${m.to}:`, (e as Error).message);
        return false;
    }
}
