import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Photo storage, in order of preference:
//  1. Vercel Blob     — when BLOB_READ_WRITE_TOKEN is set (added automatically when you connect a Blob store on Vercel)
//  2. Cloudinary      — when CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET are set
//  3. Local disk      — ./uploads, served by app/uploads/[...file] (local dev / VPS only; NOT persistent on Vercel)
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const blobReady = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const cloudinaryReady = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export class UploadError extends Error {}

/** Returns true if the form value is a real, non-empty file. */
export const isFile = (v: FormDataEntryValue | null): v is File => !!v && typeof v === 'object' && 'size' in v && v.size > 0;

export async function saveImage(file: File): Promise<string> {
    const ext = TYPES[file.type];
    if (!ext) throw new UploadError('Only JPG, PNG, WEBP or GIF images are allowed.');
    if (file.size > MAX_BYTES) throw new UploadError('Images must be 5MB or smaller.');
    const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;

    if (blobReady()) {
        const { put } = await import('@vercel/blob');
        const blob = await put(`dinerdotng/${name}`, file, { access: 'public', contentType: file.type });
        return blob.url;
    }

    const buf = Buffer.from(await file.arrayBuffer());

    if (cloudinaryReady()) {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'dinerdotng';
        const signature = crypto
            .createHash('sha1')
            .update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
            .digest('hex');
        const body = new FormData();
        body.append('file', new Blob([buf], { type: file.type }), 'upload' + ext);
        body.append('api_key', process.env.CLOUDINARY_API_KEY!);
        body.append('timestamp', String(timestamp));
        body.append('folder', folder);
        body.append('signature', signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body });
        const data = await res.json();
        if (!res.ok) throw new UploadError(data?.error?.message || 'Image upload failed.');
        return data.secure_url as string;
    }

    if (process.env.VERCEL) {
        throw new UploadError('Photo storage is not configured. Connect a Vercel Blob store (or add Cloudinary keys) to enable uploads.');
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
}

export async function removeImage(url?: string | null) {
    if (!url) return;
    if (url.startsWith('/uploads/')) {
        await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
        return;
    }
    if (blobReady() && /\.blob\.vercel-storage\.com\//.test(url)) {
        const { del } = await import('@vercel/blob');
        await del(url).catch(() => {});
    }
    // Unsplash / Cloudinary images are left alone.
}
