import 'dotenv/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '@/models/User';

dotenv.config({ path: '.env.local' });

async function main() {
    const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!email || password.length < 8) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env.local first.');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinerdotng');
    let user = await User.findOne({ email });
    if (user) {
        user.role = 'admin';
        user.password = password;
        await user.save();
        console.log(`Updated existing account ${email} -> admin`);
    } else {
        user = await User.create({ name: process.env.ADMIN_NAME || 'Diner.ng Admin', email, password, role: 'admin', hasPaid: true });
        console.log(`Created admin ${email}`);
    }
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
