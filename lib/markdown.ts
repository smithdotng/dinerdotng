import { Marked, type Tokens } from 'marked';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = (u: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(u.trim()) ? u.trim() : '#');

// Markdown for blog posts. Raw HTML is escaped and only safe link/image URLs are allowed.
const md = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
        html({ text }: Tokens.HTML | Tokens.Tag) {
            return esc(text);
        },
        link({ href, title, tokens }: Tokens.Link) {
            const inner = this.parser.parseInline(tokens);
            const url = safeUrl(href);
            const external = /^https?:/i.test(url);
            return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener nofollow"' : ''}>${inner}</a>`;
        },
        image({ href, title, text }: Tokens.Image) {
            return `<figure><img src="${esc(safeUrl(href))}" alt="${esc(text || '')}" loading="lazy" />${title ? `<figcaption>${esc(title)}</figcaption>` : ''}</figure>`;
        }
    }
});

export function renderMarkdown(src: string) {
    return md.parse(src || '', { async: false }) as string;
}

export function readingTime(src: string) {
    const words = (src || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
}

/** Plain-text excerpt from markdown when no excerpt is given. */
export function autoExcerpt(src: string, len = 180) {
    const text = (src || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#>*_`~-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > len ? text.slice(0, len).replace(/\s+\S*$/, '') + '…' : text;
}
