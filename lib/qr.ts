import QRCode from 'qrcode';

export const QR_OPTS = { margin: 1, width: 900, color: { dark: '#3b1d0e', light: '#ffffff' }, errorCorrectionLevel: 'M' as const };

export const menuUrl = (base: string, slug: string, table?: string) => `${base}/m/${slug}${table ? `?table=${encodeURIComponent(table)}` : ''}`;
export const qrDataUrl = (url: string) => QRCode.toDataURL(url, QR_OPTS);
export const qrPng = (url: string) => QRCode.toBuffer(url, QR_OPTS);
