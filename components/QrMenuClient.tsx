'use client';

import { useEffect, useRef, useState } from 'react';
import { naira } from '@/lib/format';
import { MENU_TAGS, type MenuTag } from '@/lib/spot';

interface Item { _id: string; name: string; description?: string; price: number; image?: string; tags: string[]; available: boolean; category: string }

/** Mobile QR menu: sticky category tabs with scroll-spy and instant search. */
export default function QrMenuClient({ categories, items }: { categories: string[]; items: Item[] }) {
    const [q, setQ] = useState('');
    const [active, setActive] = useState(0);
    const tabsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const onScroll = () => {
            let idx = 0;
            categories.forEach((_, i) => {
                const el = document.getElementById(`c${i}`);
                if (el && el.getBoundingClientRect().top < 130) idx = i;
            });
            setActive(idx);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [categories]);

    useEffect(() => {
        const el = tabsRef.current?.querySelectorAll('a')[active] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [active]);

    const needle = q.trim().toLowerCase();
    const match = (i: Item) => !needle || `${i.name} ${i.description || ''}`.toLowerCase().includes(needle);

    return (
        <>
            <nav className="qm-tabs" ref={tabsRef}>
                {categories.map((c, i) => (
                    <a key={c} href={`#c${i}`} className={i === active ? 'active' : ''}>{c}</a>
                ))}
            </nav>
            <div className="qm-search">
                <input type="search" placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the menu" />
            </div>
            {categories.map((c, ci) => {
                const list = items.filter((i) => i.category === c && match(i));
                if (!list.length) return needle ? null : <section key={c} className="qm-section" id={`c${ci}`}></section>;
                return (
                    <section key={c} className="qm-section" id={`c${ci}`}>
                        <h2>{c}</h2>
                        {list.map((i) => (
                            <div key={i._id} className={`qm-item ${i.available ? '' : 'off'}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {i.image && <img src={i.image} alt={i.name} loading="lazy" />}
                                <div className="flex-grow-1">
                                    <h3>{i.name}</h3>
                                    {i.description && <p>{i.description}</p>}
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                                        <span className="price">{naira(i.price)}</span>
                                        <span>
                                            {!i.available && <span className="qm-tag" style={{ background: '#eee', color: '#777' }}>Sold out</span>}
                                            {i.tags.map((t) => (
                                                <span key={t} className="qm-tag">{MENU_TAGS[t as MenuTag]?.label}</span>
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                );
            })}
            {needle && !items.some(match) && <p className="text-center text-muted-dn py-4">No dishes match “{q}”.</p>}
        </>
    );
}
