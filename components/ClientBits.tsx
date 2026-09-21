'use client';

import { useState, type ReactNode } from 'react';

/** Submit button that asks for confirmation first. */
export function ConfirmButton({ message, className, title, children }: { message: string; className?: string; title?: string; children: ReactNode }) {
    return (
        <button
            className={className}
            title={title}
            onClick={(e) => {
                if (!window.confirm(message)) e.preventDefault();
            }}
        >
            {children}
        </button>
    );
}

/** <select> that submits its form when changed. */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

/** Checkbox that submits its form when toggled. */
export function AutoSubmitCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input type="checkbox" {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

/** Date input that submits its form when changed. */
export function AutoSubmitDate(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input type="date" {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
    const [done, setDone] = useState(false);
    return (
        <button
            type="button"
            className={className}
            onClick={() => {
                navigator.clipboard?.writeText(text).then(() => {
                    setDone(true);
                    setTimeout(() => setDone(false), 1600);
                });
            }}
        >
            <i className={`fas ${done ? 'fa-check' : 'fa-copy'}`}></i> {done ? 'Copied' : 'Copy'}
        </button>
    );
}

/** Shrink a photo in the browser (max 1600px, JPEG) so uploads stay well under Vercel's 4.5MB request limit. */
async function shrink(file: File, max = 1600, quality = 0.82): Promise<File> {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
    try {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch {
        return file;
    }
}

/** File input with an instant image preview; photos are resized before upload. */
export function ImageInput({ name, current, className, previewClass, required, multiple }: { name: string; current?: string; className?: string; previewClass?: string; required?: boolean; multiple?: boolean }) {
    const [src, setSrc] = useState(current);
    const [busy, setBusy] = useState(false);
    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && !multiple && <img src={src} alt="" className={previewClass} />}
            <input
                className={className || 'form-control'}
                type="file"
                name={name}
                accept="image/jpeg,image/png,image/webp,image/gif"
                required={required}
                multiple={multiple}
                onChange={async (e) => {
                    const input = e.currentTarget;
                    const files = Array.from(input.files || []);
                    if (!files.length) return;
                    if (!multiple) setSrc(URL.createObjectURL(files[0]));
                    setBusy(true);
                    const form = input.form;
                    const submit = form?.querySelector<HTMLButtonElement>('button:not([type=button])');
                    if (submit) submit.disabled = true;
                    const out = await Promise.all(files.slice(0, 10).map((f) => shrink(f)));
                    const dt = new DataTransfer();
                    out.forEach((f) => dt.items.add(f));
                    input.files = dt.files;
                    if (submit) submit.disabled = false;
                    setBusy(false);
                }}
            />
            {busy && <small className="text-muted-dn d-block">Preparing photo…</small>}
        </>
    );
}

export function PrintButton() {
    return <button onClick={() => window.print()}>Print</button>;
}

/** Collapsible panel toggled by a button. */
export function Toggle({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" className={className} onClick={() => setOpen((o) => !o)}>{label}</button>
            {open && children}
        </>
    );
}
