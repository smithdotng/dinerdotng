import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinerdotng';

// Next.js reuses modules across hot-reloads (dev) and serverless invocations
// can run concurrently, so cache the connection promise on the global object.
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
    // eslint-disable-next-line no-var
    var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB() {
    if (cache.conn) return cache.conn;
    if (!cache.promise) cache.promise = mongoose.connect(MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 }).then((m) => m);
    try {
        cache.conn = await cache.promise;
    } catch (err) {
        cache.promise = null;
        throw err;
    }
    return cache.conn;
}
