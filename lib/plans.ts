// Diner.ng subscription plans. Prices are in Naira, billed monthly.
export type PlanKey = 'basic' | 'sweet';

export interface Plan {
    key: PlanKey;
    name: string;
    tagline: string;
    price: number;
    firstCustomerPrice: number;
    icon: string;
    popular?: boolean;
    features: string[];
    locked: string[];
}

export const PLANS: Record<PlanKey, Plan> = {
    basic: {
        key: 'basic',
        name: 'Basic',
        tagline: 'Get listed and go menu-less',
        price: 14999,
        firstCustomerPrice: 2999,
        icon: 'fa-utensils',
        features: [
            'Public listing on Diner.ng',
            'Digital menu with unique QR code',
            'Photo gallery for your spot',
            'Guest ratings & reviews',
            'Reply to guest feedback',
            'Menu views & scan stats'
        ],
        locked: ['Featured placement', 'Book-a-table reservations', 'Table management & per-table QR']
    },
    sweet: {
        key: 'sweet',
        name: 'Sweet',
        tagline: 'Stack up the extras and fill your tables',
        price: 22999,
        firstCustomerPrice: 5999,
        icon: 'fa-star',
        popular: true,
        features: [
            'Everything in Basic',
            'Featured spot on the homepage & search',
            'Book-a-table reservations',
            'Table management (seats, areas, live status)',
            'Per-table QR codes',
            'Reservations dashboard',
            'Priority support'
        ],
        locked: []
    }
};

export const PLAN_LIST = [PLANS.basic, PLANS.sweet];
export const PERIOD_DAYS = 30;

export const isPlanKey = (v: unknown): v is PlanKey => v === 'basic' || v === 'sweet';

export const promoEnabled = () => String(process.env.FIRST_CUSTOMER_PROMO ?? 'true').toLowerCase() !== 'false';

/** Price a user pays for a plan right now. First customers = accounts that have never paid. */
export function priceFor(key: PlanKey, user?: { hasPaid?: boolean } | null) {
    const plan = PLANS[key];
    const firstCustomer = promoEnabled() && !!user && !user.hasPaid;
    return { amount: firstCustomer ? plan.firstCustomerPrice : plan.price, regular: plan.price, firstCustomer };
}
