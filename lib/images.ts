// Curated Unsplash photography (free to use under the Unsplash License).
const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
    hero: u('1414235077428-338989a2e8c0', 1800),
    heroSide: u('1517248135467-4c7edcad34c4', 1000),
    ownerSection: u('1559339352-11d035aa65de', 1000),
    cta: u('1555396273-367ea4eb4db5', 1600),
    auth: u('1551218808-94e220e084d2', 1200),
    categories: {
        restaurant: u('1504674900247-0877df9cc836', 800),
        hotel: u('1566073771259-6a8506099945', 800),
        lounge: u('1514933651103-005eec06c04b', 800),
        cafe: u('1509042239860-f550ce710b93', 800),
        event: u('1492684223066-81342ee5ff30', 800)
    } as Record<string, string>,
    typeCover: {
        restaurant: u('1517248135467-4c7edcad34c4'),
        hotel: u('1542314831-068cd1dbfeeb'),
        lounge: u('1470337458703-46ad1756a187'),
        cafe: u('1509042239860-f550ce710b93'),
        event: u('1470229722913-7c0e2dbbafd3')
    } as Record<string, string>,
    food: {
        spread: u('1476224203421-9ac39bcb3327', 900),
        grill: u('1544025162-d76694265947', 900),
        steak: u('1600891964599-f61ba0e24092', 900),
        bowl: u('1546069901-ba9599a7e63c', 900),
        plate: u('1540189549336-e6e99c3679fe', 900),
        pizza: u('1565299624946-b28f40a0ae38', 900),
        burger: u('1568901346375-23c9450c58cd', 900),
        salad: u('1512621776951-a57141f2eefd', 900),
        breakfast: u('1482049016688-2d3e1b311543', 900),
        pasta: u('1563379926898-05f4575a45d8', 900),
        skewers: u('1555939594-58d7cb561ad1', 900),
        chicken: u('1529692236671-f1f6cf9683ba', 900),
        salmon: u('1467003909585-2f8a72700288', 900),
        dessert: u('1488477181946-6428a0291777', 900),
        juice: u('1497534446932-c925b458314e', 900),
        coffee: u('1509042239860-f550ce710b93', 900),
        cocktail: u('1470337458703-46ad1756a187', 900),
        dish: u('1504754524776-8f4f37790ca0', 900),
        family: u('1606787366850-de6330128bfc', 900),
        fine: u('1559329007-40df8a9345d8', 900),
        rice: u('1604908176997-125f25cc6f3d', 900)
    },
    places: {
        dining: u('1424847651672-bf20a4b0982b', 1600),
        diningRoom: u('1498654896293-37aacf113fd9', 1600),
        bar: u('1525610553991-2bede1a236e2', 1600),
        hotelRoom: u('1582719478250-c89cae4dc85b'),
        resort: u('1520250497591-112f2f40a3f4'),
        hotelPool: u('1571896349842-33c89424de2d'),
        wedding: u('1519671482749-fd09be7ccebf'),
        conference: u('1540575467063-178a50c2df87'),
        concert: u('1470229722913-7c0e2dbbafd3')
    }
};
