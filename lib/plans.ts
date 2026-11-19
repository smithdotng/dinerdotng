// Diner.ng subscription plans for premium restaurants, lounges and hotel dining. Prices are in Naira, billed monthly.
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
        tagline: 'A refined presence for your venue',
        price: 52999,
        // Only used if FIRST_CUSTOMER_PROMO=true; the launch discount is off by default.
        firstCustomerPrice: 52999,
        icon: 'fa-utensils',
        features: [
            'Curated listing on Diner.ng',
            'Elegant digital menu with your own QR code',
            'Photo gallery that showcases your space',
            'Verified guest ratings & reviews',
            'Respond to guests personally',
            'Menu views & scan insights'
        ],
        locked: ['Featured placement', 'Online reservations', 'Table management & per-table QR']
    },
    sweet: {
        key: 'sweet',
        name: 'Sweet',
        tagline: 'The full guest experience, from booking to bill',
        price: 74999,
        firstCustomerPrice: 74999,
        icon: 'fa-star',
        popular: true,
        features: [
            'Everything in Basic',
            'Featured placement on the homepage & search',
            'Online reservations for diners who plan ahead',
            'Table management (sections, seating, live status)',
            'Per-table QR codes',
            'Reservations dashboard',
            'Dedicated priority support'
        ],
        locked: []
    }
};

export const PLAN_LIST = [PLANS.basic, PLANS.sweet];
export const PERIOD_DAYS = 30;

export const isPlanKey = (v: unknown): v is PlanKey => v === 'basic' || v === 'sweet';

// Off unless FIRST_CUSTOMER_PROMO is explicitly 'true'. Premium venues pay the standard price from month one.
export const promoEnabled = () => String(process.env.FIRST_CUSTOMER_PROMO ?? 'false').toLowerCase() === 'true';

/** Price a user pays for a plan right now. First customers = accounts that have never paid. */
export function priceFor(key: PlanKey, user?: { hasPaid?: boolean } | null) {
    const plan = PLANS[key];
    const firstCustomer = promoEnabled() && !!user && !user.hasPaid;
    return { amount: firstCustomer ? plan.firstCustomerPrice : plan.price, regular: plan.price, firstCustomer };
}
