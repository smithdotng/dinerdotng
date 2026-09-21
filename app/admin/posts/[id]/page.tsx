import { notFound } from 'next/navigation';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Post, type IPost } from '@/models/Post';
import { savePostAction } from '@/actions/blog';
import PostEditor from '@/components/PostEditor';
import { spotOptions, toDraft } from '../editor-data';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidObjectId(id)) notFound();
    await connectDB();
    const post = await Post.findById(id).lean<IPost>();
    if (!post) notFound();
    return <PostEditor key={id + String(post.updatedAt)} action={savePostAction} post={toDraft(post)} spots={await spotOptions()} />;
}
