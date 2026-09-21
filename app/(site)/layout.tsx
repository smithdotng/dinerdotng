import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Flash from '@/components/Flash';
import Enhancer from '@/components/Enhancer';
import { promoEnabled } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <Suspense fallback={null}><Flash /></Suspense>
            <Enhancer />
            <main>{children}</main>
            <Footer promo={promoEnabled()} />
        </>
    );
}
