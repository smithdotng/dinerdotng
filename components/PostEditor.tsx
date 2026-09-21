'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';
import { ImageInput } from './ClientBits';

type PostType = 'article' | 'review' | 'promo';

export interface PostDraft {
    id?: string;
    title?: string;
    slug?: string;
    type?: PostType;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    tags?: string[];
    spot?: string;
    featured?: boolean;
    status?: 'draft' | 'published';
    publishedAt?: string;
    rating?: number;
    verdict?: string;
    promoCode?: string;
    validUntil?: string;
    ctaLabel?: string;
    ctaUrl?: string;
}

const TYPES: { key: PostType; label: string; icon: string; hint: string }[] = [
    { key: 'article', label: 'Article', icon: 'fa-newspaper', hint: 'Guides, news, food culture, tips for owners' },
    { key: 'review', label: 'Review', icon: 'fa-star', hint: 'Diner.ng’s own review of a spot, with a star rating' },
    { key: 'promo', label: 'Promotion', icon: 'fa-tags', hint: 'Deals, launches and offers — with code, expiry and a button' }
];

const TOOLBAR: [string, string, string][] = [
    ['fa-heading', '## ', 'Heading'],
    ['fa-bold', '**bold**', 'Bold'],
    ['fa-italic', '*italic*', 'Italic'],
    ['fa-list-ul', '\n- item\n- item\n', 'List'],
    ['fa-quote-left', '\n> quote\n', 'Quote'],
    ['fa-link', '[link text](https://)', 'Link'],
    ['fa-image', '![caption](https://image-url)', 'Image']
];

export default function PostEditor({ action, post, spots }: { action: (fd: FormData) => Promise<void>; post: PostDraft; spots: { id: string; name: string; city?: string }[] }) {
    const [type, setType] = useState<PostType>(post.type || 'article');
    const [content, setContent] = useState(post.content || '');
    const [preview, setPreview] = useState(false);
    const html = useMemo(() => (preview ? renderMarkdown(content) : ''), [preview, content]);
    const isNew = !post.id;
    // The clicked button's intent is written to a hidden field (submitter values aren't reliably sent with Server Actions).
    const intentRef = useRef<HTMLInputElement>(null);
    const setIntent = (v: string) => { if (intentRef.current) intentRef.current.value = v; };

    const insert = (snippet: string) => {
        const ta = document.getElementById('post-content') as HTMLTextAreaElement | null;
        if (!ta) return setContent((c) => c + snippet);
        const { selectionStart: s, selectionEnd: e } = ta;
        const next = content.slice(0, s) + snippet + content.slice(e);
        setContent(next);
        requestAnimationFrame(() => {
            ta.focus();
            ta.selectionStart = ta.selectionEnd = s + snippet.length;
        });
    };

    return (
        <form action={action}>
            {post.id && <input type="hidden" name="id" value={post.id} />}
            <input type="hidden" name="intent" ref={intentRef} defaultValue="save" />
            <div className="row g-4">
                <div className="col-xl-8">
                    <div className="card-dn">
                        <label className="form-label">Post type</label>
                        <div className="plan-picker mb-3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                            {TYPES.map((t) => (
                                <div key={t.key}>
                                    <input type="radio" name="type" id={`pt-${t.key}`} value={t.key} checked={type === t.key} onChange={() => setType(t.key)} />
                                    <label htmlFor={`pt-${t.key}`}>
                                        <b><i className={`fas ${t.icon} me-1 text-primary-dn`}></i>{t.label}</b>
                                        <small>{t.hint}</small>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="mb-3"><label className="form-label">Title</label><input className="form-control form-control-lg" name="title" defaultValue={post.title} required maxLength={160} placeholder="e.g. 10 spots in Abuja for the perfect Sunday brunch" /></div>
                        <div className="mb-3"><label className="form-label">Excerpt <small className="text-muted-dn fw-normal">(shown on cards and in link previews — leave blank to auto-generate)</small></label>
                            <textarea className="form-control" name="excerpt" rows={2} maxLength={300} defaultValue={post.excerpt}></textarea></div>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <label className="form-label mb-0">Content</label>
                            <div className="d-flex gap-1 flex-wrap">
                                {!preview && TOOLBAR.map(([ic, snip, title]) => (
                                    <button key={title} type="button" className="btn-icon" style={{ width: 32, height: 32 }} title={title} onClick={() => insert(snip)}><i className={`fas ${ic}`} style={{ fontSize: 12 }}></i></button>
                                ))}
                                <button type="button" className="btn-dn-outline btn-sm-dn" onClick={() => setPreview((p) => !p)}><i className={`fas ${preview ? 'fa-pen' : 'fa-eye'}`}></i> {preview ? 'Edit' : 'Preview'}</button>
                            </div>
                        </div>
                        <textarea id="post-content" className="form-control" name="content" rows={18} value={content} onChange={(e) => setContent(e.target.value)} style={{ display: preview ? 'none' : 'block', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }} placeholder={'Write in Markdown.\n\n## A heading\nSome text with **bold** and a [link](https://diner.ng).\n\n- A list item'}></textarea>
                        {preview && <div className="post-body border rounded-4 p-4" style={{ minHeight: 300, borderColor: 'var(--dn-line)' }} dangerouslySetInnerHTML={{ __html: html || '<p class="text-muted-dn">Nothing to preview yet.</p>' }} />}
                        <div className="form-text">Markdown supported: <code>## heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- list</code>, <code>&gt; quote</code>, <code>[link](url)</code>, <code>![image](url)</code>.</div>
                    </div>

                    {type === 'review' && (
                        <div className="card-dn">
                            <h5><i className="fas fa-star me-2 text-primary-dn"></i>Review details</h5>
                            <div className="row g-3">
                                <div className="col-md-4"><label className="form-label">Diner.ng rating</label>
                                    <select className="form-select" name="rating" defaultValue={post.rating || 5}>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} {r}/5</option>)}</select></div>
                                <div className="col-md-8"><label className="form-label">Verdict (one line)</label><input className="form-control" name="verdict" defaultValue={post.verdict} maxLength={200} placeholder="Come for the suya, stay for the rooftop sunset." /></div>
                            </div>
                        </div>
                    )}
                    {type === 'promo' && (
                        <div className="card-dn">
                            <h5><i className="fas fa-tags me-2 text-primary-dn"></i>Promotion details</h5>
                            <div className="row g-3">
                                <div className="col-md-6"><label className="form-label">Promo code (optional)</label><input className="form-control text-uppercase" name="promoCode" defaultValue={post.promoCode} maxLength={40} placeholder="DINER20" /></div>
                                <div className="col-md-6"><label className="form-label">Valid until (optional)</label><input className="form-control" type="date" name="validUntil" defaultValue={post.validUntil} /></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-xl-4">
                    <div className="card-dn" style={{ position: 'sticky', top: 80 }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Publish</h5>
                            <span className={`pill ${post.status === 'published' ? 'pill-green' : 'pill-muted'}`}>{post.status === 'published' ? 'Published' : isNew ? 'New' : 'Draft'}</span>
                        </div>
                        <div className="mb-3"><label className="form-label">Publish date</label><input className="form-control" type="datetime-local" name="publishedAt" defaultValue={post.publishedAt} /><div className="form-text">Leave blank to publish now. A future date schedules the post.</div></div>
                        <div className="mb-3"><label className="d-flex align-items-center gap-2"><input type="checkbox" className="form-check-input m-0" name="featured" defaultChecked={post.featured} /> Feature at the top of the blog</label></div>
                        <div className="d-grid gap-2">
                            <button className="btn-dn" onClick={() => setIntent('publish')}><i className="fas fa-paper-plane"></i> {post.status === 'published' ? 'Update & keep published' : 'Publish'}</button>
                            <button className="btn-dn-outline" onClick={() => setIntent(post.status === 'published' ? 'draft' : 'save')}>{post.status === 'published' ? 'Unpublish (move to drafts)' : 'Save draft'}</button>
                            {post.status === 'published' && post.slug && <Link className="btn-dn-ghost text-primary-dn" style={{ borderColor: 'var(--dn-line)' }} href={`/blog/${post.slug}`} target="_blank"><i className="fas fa-arrow-up-right-from-square"></i> View post</Link>}
                        </div>
                        <hr style={{ borderColor: 'var(--dn-line)' }} />
                        <label className="form-label">Cover image</label>
                        <ImageInput name="coverImage" current={post.coverImage} previewClass="cover-prev" />
                        {post.coverImage && <label className="small mt-1 d-block"><input type="checkbox" className="form-check-input me-1" name="removeCover" /> Remove cover</label>}
                        <input className="form-control form-control-sm mt-2" name="coverUrl" placeholder="…or paste an image URL" />
                        <hr style={{ borderColor: 'var(--dn-line)' }} />
                        <div className="mb-3">
                            <label className="form-label">Featured spot {type === 'article' && <small className="text-muted-dn fw-normal">(optional)</small>}</label>
                            <select className="form-select" name="spot" defaultValue={post.spot || ''}>
                                <option value="">— None —</option>
                                {spots.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` · ${s.city}` : ''}</option>)}
                            </select>
                            <div className="form-text">Shows a spot card in the post and lists the post on that spot’s page.</div>
                        </div>
                        <div className="mb-3"><label className="form-label">Tags</label><input className="form-control" name="tags" defaultValue={(post.tags || []).join(', ')} placeholder="abuja, brunch, jollof" /></div>
                        <div className="mb-3"><label className="form-label">Button (optional)</label>
                            <div className="d-flex gap-2"><input className="form-control" name="ctaLabel" defaultValue={post.ctaLabel} placeholder={type === 'promo' ? 'Claim offer' : 'Book a table'} maxLength={40} /><input className="form-control" name="ctaUrl" defaultValue={post.ctaUrl} placeholder="https://… or /spots/…" /></div>
                        </div>
                        <div><label className="form-label">URL slug</label><input className="form-control form-control-sm" name="slug" defaultValue={post.slug} placeholder="auto from title" /></div>
                    </div>
                </div>
            </div>
        </form>
    );
}
