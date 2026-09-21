'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Post, isPostType } from '@/models/Post';
import { Spot } from '@/models/Spot';
import { flashUrl, int, str, uniqueSlug } from '@/lib/helpers';
import { isFile, removeImage, saveImage, UploadError } from '@/lib/storage';
import { autoExcerpt } from '@/lib/markdown';

const go = (path: string, kind: 'success' | 'error', msg: string): never => redirect(flashUrl(path, kind, msg));

function parseDate(v: string) {
    if (!v) return null;
    const d = new Date(v.length === 10 ? `${v}T23:59:59+01:00` : v); // date-only = end of day, Lagos time
    return Number.isNaN(d.getTime()) ? null : d;
}

export async function savePostAction(formData: FormData): Promise<void> {
    const admin = await requireAdmin();
    await connectDB();
    const id = str(formData, 'id');
    const back = id ? `/admin/posts/${id}` : '/admin/posts/new';

    const title = str(formData, 'title');
    if (!title) go(back, 'error', 'Please give the post a title.');
    const type = isPostType(formData.get('type')) ? String(formData.get('type')) : 'article';
    const content = String(formData.get('content') || '');
    const intent = str(formData, 'intent'); // 'publish' | 'draft' | 'save'

    const post = id ? await Post.findById(id) : new Post({ author: admin.id, authorName: admin.name });
    if (!post) go('/admin/posts', 'error', 'That post no longer exists.');
    const p = post!;

    const desiredSlug = str(formData, 'slug') || title;
    if (!id || str(formData, 'slug') !== p.slug) p.slug = await uniqueSlug(Post, desiredSlug, id || undefined);

    const spotId = str(formData, 'spot');
    const spot = spotId ? await Spot.exists({ _id: spotId }) : null;
    const rating = int(formData, 'rating', 0);

    Object.assign(p, {
        title: title.slice(0, 160),
        type,
        content,
        excerpt: (str(formData, 'excerpt') || autoExcerpt(content)).slice(0, 300),
        tags: str(formData, 'tags').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
        spot: spot ? spotId : null,
        featured: formData.get('featured') === 'on',
        rating: type === 'review' && rating >= 1 && rating <= 5 ? rating : undefined,
        verdict: type === 'review' ? str(formData, 'verdict').slice(0, 200) : undefined,
        promoCode: type === 'promo' ? str(formData, 'promoCode').toUpperCase().slice(0, 40) : undefined,
        validUntil: type === 'promo' ? parseDate(str(formData, 'validUntil')) : null,
        ctaLabel: str(formData, 'ctaLabel').slice(0, 40) || undefined,
        ctaUrl: str(formData, 'ctaUrl') || undefined
    });

    const cover = formData.get('coverImage');
    if (isFile(cover)) {
        try {
            const url = await saveImage(cover);
            await removeImage(p.coverImage);
            p.coverImage = url;
        } catch (e) {
            if (e instanceof UploadError) go(back, 'error', e.message);
            throw e;
        }
    } else if (formData.get('removeCover') === 'on') {
        await removeImage(p.coverImage);
        p.coverImage = undefined;
    } else if (str(formData, 'coverUrl')) {
        p.coverImage = str(formData, 'coverUrl');
    }

    if (intent === 'publish') {
        p.status = 'published';
        p.publishedAt = parseDate(str(formData, 'publishedAt')) || p.publishedAt || new Date();
    } else if (intent === 'draft') {
        p.status = 'draft';
    } else if (p.status === 'published') {
        p.publishedAt = parseDate(str(formData, 'publishedAt')) || p.publishedAt || new Date();
    }

    await p.save();
    revalidatePath('/blog');
    revalidatePath(`/blog/${p.slug}`);
    revalidatePath('/');
    const msg = intent === 'publish' ? 'Post published.' : intent === 'draft' ? 'Saved as draft.' : 'Post saved.';
    go(`/admin/posts/${p._id}`, 'success', msg);
}

export async function togglePostStatusAction(id: string): Promise<void> {
    await requireAdmin();
    await connectDB();
    const p = await Post.findById(id);
    if (p) {
        p.status = p.status === 'published' ? 'draft' : 'published';
        if (p.status === 'published' && !p.publishedAt) p.publishedAt = new Date();
        await p.save();
        revalidatePath('/blog');
    }
    go('/admin/posts', 'success', p ? `"${p.title}" ${p.status === 'published' ? 'published' : 'moved to drafts'}.` : 'Updated.');
}

export async function deletePostAction(id: string): Promise<void> {
    await requireAdmin();
    await connectDB();
    const p = await Post.findByIdAndDelete(id);
    if (p) await removeImage(p.coverImage);
    revalidatePath('/blog');
    go('/admin/posts', 'success', p ? `"${p.title}" deleted.` : 'Post deleted.');
}
