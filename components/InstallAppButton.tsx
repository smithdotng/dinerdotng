'use client';

import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install app" button — only appears when the browser offers PWA installation. */
export default function InstallAppButton({ className = 'btn-dn-outline btn-sm-dn' }: { className?: string }) {
    const [evt, setEvt] = useState<BIPEvent | null>(null);
    const [ios, setIos] = useState(false);
    useEffect(() => {
        const onPrompt = (e: Event) => {
            e.preventDefault();
            setEvt(e as BIPEvent);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
        setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);

    if (evt) {
        return (
            <button
                type="button"
                className={className}
                onClick={async () => {
                    await evt.prompt();
                    await evt.userChoice;
                    setEvt(null);
                }}
            >
                <i className="fas fa-mobile-screen-button"></i> Install the app
            </button>
        );
    }
    if (ios) return <small style={{ opacity: 0.85 }}><i className="fas fa-mobile-screen-button me-1"></i> On iPhone: tap Share → “Add to Home Screen” to install Diner.ng.</small>;
    return null;
}
