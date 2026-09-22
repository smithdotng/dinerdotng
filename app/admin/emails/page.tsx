import { requireAdmin } from '@/lib/session';
import { mailFrom, mailProvider } from '@/lib/mailer';
import { sendTestEmailAction } from '@/actions/admin';
import { sampleEmails } from './samples';

export const metadata = { title: 'Emails' };

export default async function AdminEmails({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
    const me = await requireAdmin();
    const all = sampleEmails(me.firstName);
    const { t } = await searchParams;
    const current = all.find((e) => e.key === t) || all[0];
    const provider = mailProvider();
    return (
        <>
            <div className={`alert ${provider === 'console' ? 'alert-warning' : 'alert-success'} d-flex gap-2 align-items-start`}>
                <i className={`fas ${provider === 'console' ? 'fa-triangle-exclamation' : 'fa-circle-check'} mt-1`}></i>
                <div>
                    {provider === 'console' ? (
                        <><b>Email isn&apos;t connected yet.</b> Messages are only printed to the server log. Add <code>RESEND_API_KEY</code> (or <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>) and <code>MAIL_FROM</code> to your environment variables.</>
                    ) : (
                        <>Sending with <b>{provider === 'resend' ? 'Resend' : 'SMTP'}</b> as <code>{mailFrom()}</code>.</>
                    )}
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-3">
                    <div className="card-dn p-2">
                        {all.map((e) => (
                            <a key={e.key} href={`/admin/emails?t=${e.key}`} className={`d-block px-3 py-2 rounded-3 text-decoration-none ${e.key === current.key ? 'bg-sand fw-semibold text-primary-dn' : 'text-dark'}`}>{e.label}</a>
                        ))}
                    </div>
                    <form action={sendTestEmailAction} className="card-dn p-3 mt-3">
                        <input type="hidden" name="key" value={current.key} />
                        <div className="small text-muted-dn mb-2">Send “{current.label}” to <b>{me.email}</b></div>
                        <button className="btn-dn w-100 btn-sm-dn"><i className="fas fa-paper-plane"></i> Send test</button>
                    </form>
                </div>
                <div className="col-lg-9">
                    <div className="card-dn p-3">
                        <div className="small text-muted-dn mb-2">Subject: <b className="text-dark">{current.email.subject}</b></div>
                        <iframe title={current.label} srcDoc={current.email.html} style={{ width: '100%', height: 900, border: 0, borderRadius: 12, background: '#fff8f0' }} sandbox="" />
                    </div>
                </div>
            </div>
        </>
    );
}
