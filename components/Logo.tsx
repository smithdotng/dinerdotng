/* eslint-disable @next/next/no-img-element */
/**
 * Diner.ng wordmark.
 * variant="color": orange "diner." + amber "ng" — for light backgrounds.
 * variant="light": white "diner." + amber "ng" — for dark backgrounds.
 * variant="auto":  switches with the header state (transparent over a hero vs. solid).
 */
export default function Logo({ variant = 'color', height = 36 }: { variant?: 'color' | 'light' | 'auto'; height?: number }) {
    const img = (src: string, cls = '') => <img src={src} alt="Diner.ng" height={height} style={{ height, width: 'auto' }} className={`dn-logo-img ${cls}`} />;
    if (variant === 'auto') {
        return (
            <>
                {img('/images/logo-light.png', 'logo-on-dark')}
                {img('/images/logo.png', 'logo-on-light')}
            </>
        );
    }
    return img(variant === 'light' ? '/images/logo-light.png' : '/images/logo.png');
}
