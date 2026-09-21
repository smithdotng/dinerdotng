// Pure helpers, safe for server and client components.
export const naira = (n: number | undefined | null) => '₦' + Number(n || 0).toLocaleString('en-NG');

export function fmtTime(t?: string) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')}${ampm}`;
}

/** Today's date (YYYY-MM-DD) in Africa/Lagos (UTC+1, no DST). */
export function todayISO() {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function lagosDayName() {
    return new Date(Date.now() + 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
}

export function timeSlots(open = '11:00', close = '22:00', step = 30) {
    const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
    };
    const out: string[] = [];
    const start = toMin(open);
    let end = toMin(close);
    if (end <= start) end += 24 * 60;
    for (let t = start; t <= end - step; t += step) {
        const mm = t % (24 * 60);
        out.push(`${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`);
    }
    return out;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function timeAgo(d: Date | string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    const units: [number, string][] = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (const [sec, name] of units) {
        const v = Math.floor(s / sec);
        if (v >= 1) return `${plural(v, name)} ago`;
    }
    return 'just now';
}

export function fmtDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00Z') : new Date(d);
    return date.toLocaleDateString('en-GB', { ...opts, timeZone: 'Africa/Lagos' });
}

export const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '').replace(/^0/, '234')}`;
export const telLink = (n: string) => `tel:${n.replace(/\s/g, '')}`;
