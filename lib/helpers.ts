import crypto from 'crypto';
import type { Model } from 'mongoose';

export function slugify(str: string) {
    return (
        String(str || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'spot'
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uniqueSlug(M: Model<any>, base: string, ignoreId?: string) {
    const root = slugify(base);
    let slug = root;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await M.exists(ignoreId ? { slug, _id: { $ne: ignoreId } } : { slug })) {
        n += 1;
        slug = `${root}-${n}`;
    }
    return slug;
}

export function randomCode(len = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(crypto.randomBytes(len), (b) => chars[b % chars.length]).join('');
}

export const escapeRegex = (s: string) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
export const int = (fd: FormData, k: string, d = 0) => {
    const n = parseInt(String(fd.get(k) ?? ''), 10);
    return Number.isFinite(n) ? n : d;
};

/** Build a redirect URL carrying a one-time flash message. */
export function flashUrl(path: string, kind: 'success' | 'error' | 'info', message: string) {
    const [p, hash] = path.split('#');
    const sep = p.includes('?') ? '&' : '?';
    return `${p}${sep}${kind}=${encodeURIComponent(message)}${hash ? '#' + hash : ''}`;
}

/** Recursively convert ObjectIds/Dates in lean docs to plain values for client components. */
export function plain<T>(doc: T): T {
    return JSON.parse(JSON.stringify(doc));
}
