/* Demo data for local development: sample spots, menus, tables and reviews.
 * Everything here is fictional. Do not run against a production database. */
import 'dotenv/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Spot } from '@/models/Spot';
import { MenuItem } from '@/models/MenuItem';
import { Review, refreshSpotRating } from '@/models/Review';
import { Table } from '@/models/Table';
import { Reservation } from '@/models/Reservation';
import { Payment } from '@/models/Payment';
import { Post } from '@/models/Post';
import { IMAGES } from '@/lib/images';
import { DAYS } from '@/lib/spot';
import { slugify } from '@/lib/helpers';

dotenv.config({ path: '.env.local' });

const F = IMAGES.food;
const P = IMAGES.places;
const days = (n: number) => new Date(Date.now() + n * 864e5);
const hours = (open = '10:00', close = '22:00', sundayClosed = false) => DAYS.map((day) => ({ day, open, close, closed: sundayClosed && day === 'Sunday' }));

type Item = [string, string, number, string, string?, string[]?];
interface Demo {
    owner: [string, string];
    spot: Record<string, unknown>;
    plan: 'basic' | 'sweet';
    menu: Item[];
    tables?: [string, number, string][];
}

const DEMOS: Demo[] = [
    {
        owner: ['Adaeze Okafor', 'adaeze@demo.diner.ng'],
        plan: 'sweet',
        spot: {
            name: 'Ember & Pepper', type: 'restaurant', city: 'Abuja', area: 'Wuse 2', state: 'FCT', address: '14 Adetokunbo Ademola Crescent',
            tagline: 'Wood-fired Nigerian grills and smoky party jollof',
            description: 'A warm, buzzy dining room built around a wood-fired grill. Expect smoky jollof, suya-spiced everything, and slow Sunday lunches with the whole family.',
            cuisines: ['Nigerian', 'Grills', 'Seafood'], priceRange: 3, phone: '0803 000 1122', whatsapp: '08030001122', instagram: 'emberandpepper',
            coverImage: P.dining, gallery: [F.grill, F.spread, F.skewers, P.diningRoom, F.cocktail].map((url) => ({ url })),
            menuCategories: ['Starters', 'From the grill', 'Rice & swallow', 'Drinks', 'Desserts']
        },
        menu: [
            ['Starters', 'Beef suya skewers', 4500, 'Yaji-rubbed beef, onions, tomatoes and extra spice on the side.', F.skewers, ['popular', 'spicy']],
            ['Starters', 'Peppered snail', 6500, 'Giant snails tossed in scotch-bonnet pepper sauce.', undefined, ['spicy']],
            ['Starters', 'Garden salad', 3500, 'Crunchy greens, sweetcorn, egg and house dressing.', F.salad, ['vegetarian']],
            ['From the grill', 'Whole grilled croaker', 14500, 'Charcoal-grilled fish with plantain and pepper sauce.', F.salmon, ['chef']],
            ['From the grill', 'Ember chicken', 9500, 'Half chicken, 24-hour marinade, wood-fired.', F.chicken, ['popular']],
            ['From the grill', 'Ribeye steak', 18500, '300g ribeye, pepper butter, chips.', F.steak],
            ['Rice & swallow', 'Smoky party jollof', 6500, 'Firewood jollof with fried plantain and coleslaw.', F.rice, ['popular', 'chef']],
            ['Rice & swallow', 'Egusi & pounded yam', 7500, 'Melon-seed soup with assorted meat.', F.dish],
            ['Drinks', 'Chapman', 3000, 'The classic — citrus, bitters and Fanta.', F.cocktail, ['popular']],
            ['Drinks', 'Fresh zobo', 2000, 'Hibiscus, ginger and pineapple.', F.juice, ['vegetarian']],
            ['Desserts', 'Puff-puff & ice cream', 3500, 'Warm puff-puff, vanilla ice cream, caramel.', F.dessert, ['new']]
        ],
        tables: [['T1', 2, 'Indoor'], ['T2', 2, 'Indoor'], ['T3', 4, 'Indoor'], ['T4', 4, 'Indoor'], ['T5', 6, 'Indoor'], ['P1', 4, 'Terrace'], ['P2', 4, 'Terrace'], ['V1', 8, 'VIP']]
    },
    {
        owner: ['Tunde Bakare', 'tunde@demo.diner.ng'],
        plan: 'sweet',
        spot: {
            name: 'The Palms Lagoon Hotel', type: 'hotel', city: 'Lagos', area: 'Victoria Island', state: 'Lagos', address: '3 Ozumba Mbadiwe Avenue',
            tagline: 'Poolside dining, sunset cocktails and a lagoon view',
            description: 'Our lagoon-front restaurant and pool bar are open to hotel guests and visitors. Scan the QR code at your sun lounger or in your room.',
            cuisines: ['Continental', 'Nigerian', 'Cocktails'], priceRange: 4, phone: '0809 555 0101',
            coverImage: P.hotelPool, gallery: [P.resort, P.hotelRoom, F.fine, F.cocktail].map((url) => ({ url })),
            menuCategories: ['Breakfast', 'All-day dining', 'Pool bar']
        },
        menu: [
            ['Breakfast', 'Full Nigerian breakfast', 9500, 'Yam, eggs, akara, plantain and pap.', F.breakfast, ['popular']],
            ['Breakfast', 'Pancake stack', 6500, 'Berries, whipped butter, maple.', undefined, ['vegetarian']],
            ['All-day dining', 'Seafood pasta', 14000, 'Prawns, calamari, cherry tomato and chilli.', F.pasta, ['chef']],
            ['All-day dining', 'Club burger', 11000, 'Double beef, cheddar, fries.', F.burger],
            ['All-day dining', 'Grilled salmon', 19500, 'Herb potatoes, lemon butter.', F.salmon],
            ['Pool bar', 'Sunset spritz', 7500, 'Aperol, prosecco, orange.', F.cocktail, ['popular']],
            ['Pool bar', 'Tropical smoothie', 4500, 'Mango, pineapple, passion fruit.', F.juice, ['vegetarian']]
        ],
        tables: [['Pool 1', 4, 'Poolside'], ['Pool 2', 4, 'Poolside'], ['R1', 2, 'Restaurant'], ['R2', 4, 'Restaurant'], ['R3', 6, 'Restaurant']]
    },
    {
        owner: ['Kemi Adeyemi', 'kemi@demo.diner.ng'],
        plan: 'basic',
        spot: {
            name: 'Kofi Corner Café', type: 'cafe', city: 'Abuja', area: 'Maitama', state: 'FCT', address: '22 Aguiyi Ironsi Street',
            tagline: 'Specialty coffee, fresh pastries and quiet corners',
            description: 'A cosy neighbourhood café for slow mornings and laptop afternoons.',
            cuisines: ['Coffee', 'Brunch', 'Bakery'], priceRange: 2, phone: '0812 345 6789', instagram: 'koficorner',
            coverImage: F.coffee, gallery: [F.breakfast, F.dessert].map((url) => ({ url })),
            menuCategories: ['Coffee', 'Brunch', 'Sweet things']
        },
        menu: [
            ['Coffee', 'Flat white', 3000, 'Double shot, silky milk.', F.coffee, ['popular']],
            ['Coffee', 'Iced caramel latte', 3800, 'Cold milk, espresso, caramel.'],
            ['Brunch', 'Avocado toast', 5500, 'Sourdough, smashed avo, chilli flakes, egg.', F.breakfast, ['vegetarian']],
            ['Brunch', 'Chicken wrap', 5000, 'Grilled chicken, slaw, spicy mayo.'],
            ['Sweet things', 'Chocolate brownie', 2500, 'Warm, gooey, with sea salt.', F.dessert]
        ]
    },
    {
        owner: ['Emeka Nwosu', 'emeka@demo.diner.ng'],
        plan: 'basic',
        spot: {
            name: 'Skyline Rooftop Lounge', type: 'lounge', city: 'Lagos', area: 'Lekki Phase 1', state: 'Lagos', address: '10 Admiralty Way',
            tagline: 'Rooftop vibes, small plates and live DJ sets',
            description: 'Lagos from above. Cocktails, shisha-free terrace, small plates and DJs every Friday and Saturday.',
            cuisines: ['Small plates', 'Cocktails'], priceRange: 3, phone: '0701 222 3344',
            coverImage: P.bar, gallery: [F.cocktail, P.concert].map((url) => ({ url })),
            menuCategories: ['Small plates', 'Cocktails']
        },
        menu: [
            ['Small plates', 'Asun', 5500, 'Spicy smoked goat meat with peppers.', F.grill, ['spicy', 'popular']],
            ['Small plates', 'Chicken wings', 6000, 'Honey-pepper glaze.', F.chicken],
            ['Small plates', 'Loaded fries', 4500, 'Cheese, jalapeño, suya spice.'],
            ['Cocktails', 'Lekki Mule', 8000, 'Vodka, ginger beer, lime.', F.cocktail, ['new']],
            ['Cocktails', 'Zobo Mojito', 7000, 'Rum, hibiscus, mint.', F.juice]
        ]
    },
    {
        owner: ['Halima Sule', 'halima@demo.diner.ng'],
        plan: 'sweet',
        spot: {
            name: 'The Garden Event Centre', type: 'event', city: 'Abuja', area: 'Jabi', state: 'FCT', address: 'Plot 5 Jabi Lake Road',
            tagline: 'Garden weddings, parties and conferences by the lake',
            description: 'An open-air garden and a 400-seat hall for weddings, birthdays and corporate events. Catering packages available.',
            cuisines: ['Catering', 'Events'], priceRange: 3, phone: '0805 777 8899',
            coverImage: P.wedding, gallery: [P.conference, F.family, P.concert].map((url) => ({ url })),
            menuCategories: ['Packages', 'Small chops']
        },
        menu: [
            ['Packages', 'Classic buffet (per guest)', 12000, 'Jollof, fried rice, chicken, salad, drinks.', F.family],
            ['Packages', 'Premium buffet (per guest)', 18000, 'Adds seafood, grill station and dessert.', F.spread, ['popular']],
            ['Small chops', 'Small chops platter (10 guests)', 25000, 'Puff-puff, samosa, spring rolls, gizdodo.', F.skewers]
        ],
        tables: [['Hall A', 10, 'Hall'], ['Hall B', 10, 'Hall'], ['Garden 1', 8, 'Garden'], ['Garden 2', 8, 'Garden']]
    }
];

const REVIEWS: [string, number, string, number?, number?, number?][] = [
    ['Chioma', 5, 'The jollof actually tastes like party jollof. Service was quick and friendly.', 5, 5, 4],
    ['Ibrahim', 4, 'Lovely atmosphere and great grills. A bit loud on Friday night.', 5, 4, 4],
    ['Funmi', 5, 'Scanned the QR at the table and ordered in minutes. Will be back!', 5, 5, 5],
    ['David', 3, 'Food was good but we waited a while for drinks.', 4, 2, 4],
    ['Aisha', 5, 'Perfect spot for a birthday dinner. They even brought a candle!', 5, 5, 5]
];

async function main() {
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
        throw new Error('Refusing to seed demo data with NODE_ENV=production. Pass --force if you really mean it.');
    }
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinerdotng');
    const emails = DEMOS.map((d) => d.owner[1]);
    const oldOwners = await User.find({ email: { $in: emails } }).select('_id');
    const oldSpots = await Spot.find({ owner: { $in: oldOwners.map((o) => o._id) } }).select('_id');
    const spotIds = oldSpots.map((s) => s._id);
    await Promise.all([
        MenuItem.deleteMany({ spot: { $in: spotIds } }),
        Review.deleteMany({ spot: { $in: spotIds } }),
        Table.deleteMany({ spot: { $in: spotIds } }),
        Reservation.deleteMany({ spot: { $in: spotIds } }),
        Payment.deleteMany({ spot: { $in: spotIds } }),
        Spot.deleteMany({ _id: { $in: spotIds } }),
        User.deleteMany({ email: { $in: emails } })
    ]);

    for (const [i, d] of DEMOS.entries()) {
        const owner = await User.create({ name: d.owner[0], email: d.owner[1], password: 'demo-password', hasPaid: true });
        const slug = slugify(String(d.spot.name));
        const spot = await Spot.create({
            ...d.spot,
            owner: owner._id,
            slug,
            hours: hours('09:00', d.spot.type === 'lounge' ? '02:00' : '22:00'),
            views: 120 + i * 57,
            menuScans: 80 + i * 31,
            subscription: { plan: d.plan, status: 'active', currentPeriodEnd: days(25 - i), startedAt: days(-5) },
            reservations: { enabled: true, openTime: '12:00', closeTime: '22:00', slotMinutes: 30, maxPartySize: 12 }
        });
        await MenuItem.insertMany(d.menu.map(([category, name, price, description, image, tags], order) => ({ spot: spot._id, category, name, price, description, image, tags: tags || [], order })));
        if (d.tables) await Table.insertMany(d.tables.map(([label, seats, area]) => ({ spot: spot._id, label, seats, area })));
        const n = 3 + (i % 3);
        await Review.insertMany(
            REVIEWS.slice(0, n).map(([name, rating, comment, food, service, ambience], k) => ({
                spot: spot._id, name, rating, comment, food, service, ambience, source: k % 2 ? 'qr' : 'web',
                createdAt: days(-(k * 3 + 1)),
                ...(k === 0 ? { ownerReply: { text: `Thank you ${name}! We can't wait to host you again.`, repliedAt: days(-k * 3) } } : {})
            }))
        );
        await refreshSpotRating(spot._id);
        await Payment.create({
            user: owner._id, spot: spot._id, plan: d.plan, amount: d.plan === 'sweet' ? 5999 : 2999, regularAmount: d.plan === 'sweet' ? 22999 : 14999,
            firstCustomerDiscount: true, reference: `DNG-DEMO-${i}-${Date.now()}`, provider: 'demo', status: 'success', paidAt: days(-5), periodStart: days(-5), periodEnd: days(25 - i)
        });
        console.log(`✓ ${spot.name} (${d.plan}) — /spots/${spot.slug}`);
    }
    // Demo blog posts (fictional)
    await Post.deleteMany({ authorName: 'Diner.ng Team (demo)' });
    const bySlug = async (slug: string) => (await Spot.findOne({ slug }).select('_id'))?._id;
    const demoPosts = [
        {
            title: '7 Abuja spots for the perfect Sunday brunch', type: 'article', featured: true, coverImage: IMAGES.food.breakfast,
            tags: ['abuja', 'brunch', 'guides'], spot: null,
            excerpt: 'From flat whites in Maitama to firewood jollof in Wuse 2 — where to eat when Sunday service ends.',
            content: '## Why brunch is having a moment\n\nAbuja’s brunch scene has grown up. Here are our favourite tables right now.\n\n### 1. Kofi Corner Café, Maitama\nQuiet corners, **excellent avocado toast** and a flat white that holds its own.\n\n### 2. Ember & Pepper, Wuse 2\nIf your brunch needs *jollof*, this is the one.\n\n> Tip: book ahead on Diner.ng — Sunday tables go fast.\n\n[Explore more spots in Abuja](/explore?city=Abuja)'
        },
        {
            title: 'Review: Ember & Pepper brings the grill to Wuse 2', type: 'review', rating: 4, coverImage: IMAGES.food.grill,
            tags: ['abuja', 'grills', 'review'], spot: await bySlug('ember-and-pepper'),
            verdict: 'Smoky, generous and fun — the party jollof alone is worth the trip.',
            excerpt: 'We ate our way through the wood-fired menu at one of Abuja’s busiest new grills.',
            content: '## The room\nWarm, loud and full of families on a Friday night.\n\n## The food\n- **Beef suya skewers** — properly spiced, tender.\n- **Smoky party jollof** — the star of the show.\n- **Whole grilled croaker** — share it.\n\n## The service\nFriendly and quick, though drinks lagged at peak time.\n\n## Should you go?\nYes. Book a table and order the jollof.'
        },
        {
            title: 'Skyline Rooftop: 20% off cocktails every Thursday', type: 'promo', coverImage: IMAGES.food.cocktail,
            tags: ['lagos', 'offers', 'nightlife'], spot: await bySlug('skyline-rooftop-lounge'),
            promoCode: 'DINER20', validUntil: days(40), ctaLabel: 'See the menu',
            excerpt: 'Show the code at the bar on Thursdays and take 20% off all signature cocktails.',
            content: 'Thursdays just got better at **Skyline Rooftop Lounge** in Lekki Phase 1.\n\n- 20% off all signature cocktails\n- Every Thursday, 6pm till late\n- Show code **DINER20** at the bar\n\n*One redemption per guest per visit.*'
        }
    ];
    for (const [i, dp] of demoPosts.entries()) {
        await Post.create({
            ...dp,
            slug: slugify(dp.title),
            status: 'published',
            publishedAt: days(-(i * 4 + 1)),
            authorName: 'Diner.ng Team (demo)',
            ctaUrl: dp.spot ? `/spots/${dp.type === 'promo' ? 'skyline-rooftop-lounge' : 'ember-and-pepper'}` : undefined
        });
    }
    console.log(`✓ ${demoPosts.length} demo blog posts`);

    console.log('\nDemo owners log in with password: demo-password');
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
