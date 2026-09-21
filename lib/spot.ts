// Spot types and plan-gating rules, shared by server and client code.
export const SPOT_TYPES = {
    restaurant: { label: 'Restaurant', icon: 'fa-utensils' },
    hotel: { label: 'Hotel', icon: 'fa-hotel' },
    lounge: { label: 'Lounge & Bar', icon: 'fa-champagne-glasses' },
    cafe: { label: 'Café', icon: 'fa-mug-hot' },
    event: { label: 'Event Hotspot', icon: 'fa-music' }
} as const;

export type SpotType = keyof typeof SPOT_TYPES;
export const SPOT_TYPE_KEYS = Object.keys(SPOT_TYPES) as SpotType[];
export const isSpotType = (v: unknown): v is SpotType => typeof v === 'string' && v in SPOT_TYPES;

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MENU_TAGS = {
    chef: { label: "Chef's pick" },
    popular: { label: 'Popular' },
    spicy: { label: '🌶 Spicy' },
    vegetarian: { label: '🌿 Vegetarian' },
    new: { label: 'New' }
} as const;
export type MenuTag = keyof typeof MENU_TAGS;

export interface SpotLike {
    type?: string;
    isPublished?: boolean;
    featuredOverride?: boolean;
    area?: string;
    city?: string;
    priceRange?: number;
    subscription?: { plan?: string | null; status?: string; currentPeriodEnd?: Date | string | null };
    reservations?: { enabled?: boolean };
}

export function isLive(s: SpotLike) {
    const sub = s.subscription || {};
    return !!s.isPublished && sub.status === 'active' && !!sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > new Date();
}
export const hasSweet = (s: SpotLike) => isLive(s) && s.subscription?.plan === 'sweet';
export const isFeatured = (s: SpotLike) => hasSweet(s) || (isLive(s) && !!s.featuredOverride);
export const canTakeReservations = (s: SpotLike) => hasSweet(s) && s.reservations?.enabled !== false;
export const typeLabel = (s: SpotLike) => SPOT_TYPES[(s.type as SpotType) || 'restaurant']?.label || 'Spot';
export const typeIcon = (s: SpotLike) => SPOT_TYPES[(s.type as SpotType) || 'restaurant']?.icon || 'fa-location-dot';
export const priceLabel = (s: SpotLike) => '₦'.repeat(s.priceRange || 2);
export const locationOf = (s: SpotLike) => [s.area, s.city].filter(Boolean).join(', ');

/** Mongo filter for spots the public may see. */
export function liveFilter() {
    return { isPublished: true, 'subscription.status': 'active', 'subscription.currentPeriodEnd': { $gt: new Date() } };
}
