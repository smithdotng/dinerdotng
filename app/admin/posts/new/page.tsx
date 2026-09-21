import { connectDB } from '@/lib/db';
import { isPostType } from '@/models/Post';
import { savePostAction } from '@/actions/blog';
import PostEditor from '@/components/PostEditor';
import { spotOptions } from '../editor-data';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    await connectDB();
    return <PostEditor action={savePostAction} post={{ type: isPostType(type) ? type : 'article', status: 'draft' }} spots={await spotOptions()} />;
}
