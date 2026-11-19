import Link from 'next/link';
import Logo from './Logo';
import InstallAppButton from './InstallAppButton';
import { PLANS } from '@/lib/plans';
import { naira } from '@/lib/format';
import { SOCIAL } from '@/lib/seo';

export default function Footer({ promo }: { promo: boolean }) {
    return (
        <footer className="dn-footer">
            <div className="container">
                <div className="row gy-4">
                    <div className="col-lg-4">
                        <Link href="/" className="dn-logo mb-3"><Logo variant="light" height={42} /></Link>
                        <p className="mt-3" style={{ maxWidth: 340 }}>
                            Nigeria&apos;s finest tables, reserved for you. Discover premium restaurants, lounges and hotel dining, preview the menu and reserve your table.
                        </p>
                        <div className="social mt-3">
                            <a href={SOCIAL.instagram} target="_blank" rel="noopener" aria-label="Diner.ng on Instagram"><i className="fab fa-instagram"></i></a>
                            <a href={SOCIAL.x} target="_blank" rel="noopener" aria-label="Diner.ng on X"><i className="fab fa-x-twitter"></i></a>
                            <a href={SOCIAL.facebook} target="_blank" rel="noopener" aria-label="Diner.ng on Facebook"><i className="fab fa-facebook-f"></i></a>
                            <a href={SOCIAL.whatsapp} target="_blank" rel="noopener" aria-label="Chat with Diner.ng on WhatsApp"><i className="fab fa-whatsapp"></i></a>
                        </div>
                        <p className="small mt-3 mb-0">
                            <i className="fab fa-whatsapp me-1"></i> <a href={SOCIAL.whatsapp} target="_blank" rel="noopener" style={{ color: '#fff' }}>{SOCIAL.whatsappDisplay}</a> &nbsp;·&nbsp; @{SOCIAL.handle}
                        </p>
                    </div>
                    <div className="col-6 col-lg-2">
                        <h5>Discover</h5>
                        <ul>
                            <li><Link href="/explore?type=restaurant">Restaurants</Link></li>
                            <li><Link href="/explore?type=hotel">Hotels</Link></li>
                            <li><Link href="/explore?type=lounge">Lounges &amp; bars</Link></li>
                            <li><Link href="/explore?type=event">Event venues</Link></li>
                            <li><Link href="/explore?bookable=1">Reserve a table</Link></li>
                            <li><Link href="/blog">Blog &amp; offers</Link></li>
                        </ul>
                    </div>
                    <div className="col-6 col-lg-2">
                        <h5>For business</h5>
                        <ul>
                            <li><Link href="/for-business">How it works</Link></li>
                            <li><Link href="/pricing">Pricing</Link></li>
                            <li><Link href="/register">List your venue</Link></li>
                            <li><Link href="/login">Owner login</Link></li>
                        </ul>
                    </div>
                    <div className="col-lg-4">
                        {promo ? (
                            <>
                                <h5>First-month rate</h5>
                                <p>
                                    New venues pay <b style={{ color: '#fff' }}>{naira(PLANS.basic.firstCustomerPrice)}</b> for their first month on Basic, or{' '}
                                    <b style={{ color: '#fff' }}>{naira(PLANS.sweet.firstCustomerPrice)}</b> on Sweet with featured placement and reservations.
                                </p>
                            </>
                        ) : (
                            <>
                                <h5>For premium venues</h5>
                                <p>Restaurants, lounges and hotel dining. Plans from <b style={{ color: '#fff' }}>{naira(PLANS.basic.price)}</b> per month.</p>
                            </>
                        )}
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                            <Link href="/pricing" className="btn-dn btn-sm-dn">See plans</Link>
                            <InstallAppButton className="btn-dn-ghost btn-sm-dn" />
                        </div>
                    </div>
                </div>
                <div className="bottom d-flex flex-wrap justify-content-between gap-2">
                    <span>© {new Date().getFullYear()} Diner.ng. All rights reserved.</span>
                    <span>Made with <i className="fas fa-heart" style={{ color: 'var(--dn-primary)' }}></i> for Nigerian hospitality</span>
                </div>
            </div>
        </footer>
    );
}
