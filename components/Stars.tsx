import { Fragment } from 'react';

export default function Stars({ rating, className = '' }: { rating: number; className?: string }) {
    const r = Number(rating) || 0;
    return (
        <span className={`stars ${className}`} aria-label={`${r.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <i key={i} className={r >= i ? 'fas fa-star' : r >= i - 0.5 ? 'fas fa-star-half-stroke' : 'far fa-star'}></i>
            ))}
        </span>
    );
}

/** Pure-CSS star picker (radio buttons), works without JavaScript. */
export function StarInput({ name, required, small, idPrefix }: { name: string; required?: boolean; small?: boolean; idPrefix?: string }) {
    const p = idPrefix || name;
    return (
        <div className={`star-input ${small ? 'sm' : ''}`}>
            {[5, 4, 3, 2, 1].map((s) => (
                <Fragment key={s}>
                    <input type="radio" name={name} id={`${p}${s}`} value={s} required={required} />
                    <label htmlFor={`${p}${s}`} title={`${s} star${s > 1 ? 's' : ''}`}>
                        <i className="fas fa-star"></i>
                    </label>
                </Fragment>
            ))}
        </div>
    );
}
