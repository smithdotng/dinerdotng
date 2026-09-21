/* Publishes (or updates) the Diner.ng launch announcement from content/launch-post.md.
 * Safe to run against production — it only touches this one post.
 *   MONGODB_URI="…" npm run post:launch
 */
import 'dotenv/config';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Post } from '@/models/Post';
import { User } from '@/models/User';
import { IMAGES } from '@/lib/images';

dotenv.config({ path: '.env.local' });

const SLUG = 'diner-ng-is-here-your-table-is-ready';

async function main() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinerdotng');
    const content = fs.readFileSync(path.join(process.cwd(), 'content', 'launch-post.md'), 'utf8');
    const admin = await User.findOne({ role: 'admin' }).select('_id');
    const existing = await Post.findOne({ slug: SLUG });
    const data = {
        title: 'Diner.ng is here — and your table is ready',
        slug: SLUG,
        type: 'article',
        excerpt: 'No more laminated menus with masking-tape prices. Meet Diner.ng: Nigeria’s biggest directory of fun spots — and the launchpad restaurantpreneurs have been waiting for.',
        content,
        coverImage: existing?.coverImage || IMAGES.hero,
        tags: ['launch', 'news', 'diner.ng'],
        authorName: 'Stanley, Founder, Diner.ng',
        author: admin?._id,
        status: 'published',
        featured: true,
        publishedAt: existing?.publishedAt || new Date(),
        ctaLabel: 'Explore spots near you',
        ctaUrl: '/explore'
    };
    if (existing) {
        Object.assign(existing, data);
        await existing.save();
        console.log(`Updated: /blog/${SLUG}`);
    } else {
        await Post.create(data);
        console.log(`Published: /blog/${SLUG}`);
    }
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
