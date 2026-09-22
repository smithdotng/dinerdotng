'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Spot } from '@/models/Spot';
import { getSession, homeFor, requireAuth } from '@/lib/session';
import { sendVerificationEmail } from '@/lib/notify';
import { requestOrigin } from '@/lib/appUrl';
import { enforceRateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';
import { isPlanKey } from '@/lib/plans';
import { flashUrl, str, uniqueSlug } from '@/lib/helpers';
import { DAYS, isSpotType } from '@/lib/spot';

const fail = (path: string, message: string): never => redirect(flashUrl(path, 'error', message));

const registerSchema = z
    .object({
        name: z.string().trim().min(2, 'Please enter your full name.'),
        email: z.string().trim().email('Enter a valid email address.'),
        phone: z.string().trim().optional(),
        password: z.string().min(8, 'Your password should be at least 8 characters.'),
        confirmPassword: z.string()
    })
    .refine((d) => d.password === d.confirmPassword, { message: 'The passwords do not match.' });

export async function registerAction(formData: FormData): Promise<void> {
    const plan = isPlanKey(formData.get('plan')) ? String(formData.get('plan')) : 'basic';
    const back = `/register?plan=${plan}`;
    if (!(await enforceRateLimit('register', 15))) fail(back, RATE_LIMIT_MESSAGE);

    const parsed = registerSchema.safeParse({
        name: str(formData, 'name'),
        email: str(formData, 'email'),
        phone: str(formData, 'phone'),
        password: String(formData.get('password') || ''),
        confirmPassword: String(formData.get('confirmPassword') || '')
    });
    if (!parsed.success) fail(back, parsed.error.issues[0].message);
    const data = parsed.data!;

    await connectDB();
    if (await User.exists({ email: data.email.toLowerCase() })) fail(back, 'An account with that email already exists. Try logging in.');
    const user = await User.create({ name: data.name, email: data.email, phone: data.phone, password: data.password, emailVerified: false });

    const session = await getSession();
    session.user = { id: user._id.toString(), name: user.name, firstName: user.name.split(' ')[0], email: user.email, role: user.role, unverified: true };
    session.intendedPlan = plan;
    await session.save();
    const sent = await sendVerificationEmail(user._id, await requestOrigin());
    redirect(sent ? '/verify-email' : flashUrl('/verify-email', 'error', "We couldn't send the confirmation email just now. Tap “Resend” to try again."));
}

export async function loginAction(formData: FormData): Promise<void> {
    if (!(await enforceRateLimit('login', 20))) fail('/login', RATE_LIMIT_MESSAGE);
    const email = str(formData, 'email').toLowerCase();
    const password = String(formData.get('password') || '');
    if (!email || !password) fail('/login', 'Enter your email and password.');

    await connectDB();
    const user = await User.findOne({ email });
    if (!user || !user.isActive || !(await user.comparePassword(password))) fail('/login', 'Incorrect email or password.');
    user!.lastLogin = new Date();
    await user!.save();

    const session = await getSession();
    session.user = { id: user!._id.toString(), name: user!.name, firstName: user!.name.split(' ')[0], email: user!.email, role: user!.role };
    if (user!.emailVerified === false) session.user.unverified = true;
    await session.save();
    if (user!.emailVerified === false) redirect('/verify-email');
    const next = str(formData, 'next');
    redirect(next.startsWith('/') && !next.startsWith('//') ? next : homeFor(user!.role));
}

export async function logoutAction(): Promise<void> {
    const session = await getSession();
    session.destroy();
    redirect('/');
}

/** Step 2 of sign-up: create the owner's spot. */
export async function createSpotAction(formData: FormData): Promise<void> {
    const session = await getSession();
    if (!session.user) redirect('/login');
    if (session.user.unverified) redirect('/verify-email');
    await connectDB();
    if (await Spot.exists({ owner: session.user.id })) redirect('/dashboard');

    const name = str(formData, 'name');
    const city = str(formData, 'city');
    if (!name || !city) fail('/onboarding', 'Please give your spot a name and city.');
    const type = isSpotType(formData.get('type')) ? String(formData.get('type')) : 'restaurant';

    await Spot.create({
        owner: session.user.id,
        name,
        slug: await uniqueSlug(Spot, `${name} ${city}`),
        type,
        tagline: str(formData, 'tagline'),
        area: str(formData, 'area'),
        city,
        state: str(formData, 'state'),
        address: str(formData, 'address'),
        phone: str(formData, 'phone'),
        hours: DAYS.map((day) => ({ day, open: '10:00', close: '22:00', closed: false })),
        menuCategories: ['Starters', 'Mains', 'Drinks']
    });
    const plan = session.intendedPlan && isPlanKey(session.intendedPlan) ? session.intendedPlan : 'basic';
    session.intendedPlan = undefined;
    await session.save();
    redirect(flashUrl(`/dashboard/billing?plan=${plan}`, 'success', `${name} is set up! Choose a plan to go live.`));
}

/** Send a fresh confirmation link to the signed-in, unconfirmed account. */
export async function resendVerificationAction(): Promise<void> {
    const me = await requireAuth();
    if (!me.unverified) redirect(homeFor(me.role));
    if (!(await enforceRateLimit('verify-resend', 5))) fail('/verify-email', RATE_LIMIT_MESSAGE);
    await connectDB();
    const user = await User.findById(me.id).select('verifySentAt emailVerified');
    if (user?.verifySentAt && Date.now() - user.verifySentAt.getTime() < 60 * 1000) fail('/verify-email', 'We just sent one — please wait a minute before asking again.');
    const sent = await sendVerificationEmail(me.id, await requestOrigin());
    redirect(flashUrl('/verify-email', sent ? 'success' : 'error', sent ? `A fresh link is on its way to ${me.email}.` : "We couldn't send the email just now. Please try again shortly."));
}
