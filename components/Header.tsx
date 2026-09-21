import { getCurrentUser } from '@/lib/session';
import HeaderClient from './HeaderClient';

export default async function Header() {
    const user = await getCurrentUser();
    return <HeaderClient user={user ? { role: user.role } : null} />;
}
