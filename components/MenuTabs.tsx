'use client';

import { useState, type ReactNode } from 'react';

/** Category tabs for the menu on the spot page. Children are keyed by category. */
export default function MenuTabs({ categories, panes }: { categories: string[]; panes: Record<string, ReactNode> }) {
    const [active, setActive] = useState('*');
    return (
        <>
            <div className="menu-tabs">
                <button className={active === '*' ? 'active' : ''} onClick={() => setActive('*')}>All</button>
                {categories.map((c) => (
                    <button key={c} className={active === c ? 'active' : ''} onClick={() => setActive(c)}>{c}</button>
                ))}
            </div>
            {categories.map((c) => (active === '*' || active === c ? <div key={c}>{panes[c]}</div> : null))}
        </>
    );
}
