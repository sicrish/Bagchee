import 'dotenv/config';
import prisma from '../lib/prisma.js';

// ── Settings from old MariaDB dump ────────────────────────────────────────────
const settingsData = {
    saleThreshold:          25,
    bestSellerThreshold:    2,
    memberDiscount:         10.00,
    freeShippingOver:       50.00,
    freeShippingOverEur:    43.36,
    freeShippingOverInr:    4696.98,
    membershipCartPrice:    35.00,
    membershipCartPriceEur: 31,
    membershipCartPriceInr: 2510.87,
    usdToEurRate:           0.867268,
    usdToInrRate:           93.9395,
    mailFrom:               'cservice@bagchee.com',
    mailReplyTo:            'cservice@bagchee.com',
    topbarPromotion:        true,
    topbarPromotionText:    '<p><font face="sans-serif"><b>Free Worldwide Delivery on orders over $50</b></font></p>',
    bankIban:               '',
    bankBic:                '',
    bankOwner:              'Bagchee.com',
    bankName:               '',
    emailsCopy:             'malaykbagchi@gmail.com,email@bagchee.com',
};

// ── Meta tags from old MariaDB dump (controller+action → pageUrl) ──────────────
const metaTagsData = [
    { pageUrl: '/',                title: 'Bagchee Bookstore - More than Books',   metaTitle: 'Bagchee Bookstore - More than Books',   metaDesc: 'With more than 80,000 products (books, music, handicrafts, cds, dvds) to choose from, we have something for everyone.', metaKeywords: 'Books, india books, indian books, indian book, indian online books, Bagchee' },
    { pageUrl: '/deals',           title: 'Deal of the day',                       metaTitle: 'Deal of the day',                       metaDesc: 'The best deals for savings on Books, Handcrafts, Music, DVD, CD Roms.', metaKeywords: '' },
    { pageUrl: '/membership',      title: 'Bagchee Membership',                    metaTitle: 'Bagchee Membership',                    metaDesc: 'Buy Bagchee Membership and get an additional 10% off everytime you shop at Bagchee.com for a full year.', metaKeywords: '' },
    { pageUrl: '/gift-cards',      title: 'Bagchee E-Gift Cards',                  metaTitle: 'Bagchee E-Gift Cards',                  metaDesc: 'Give the Perfect Gift. In an instant. E-Gift Cards are send by email within minutes and can be redeemed online.', metaKeywords: '' },
    { pageUrl: '/free-delivery',   title: 'Free shipping',                         metaTitle: 'Free shipping',                         metaDesc: 'FREE Shipping on orders over $50. Orders delivered within 7-12 business days.', metaKeywords: '' },
    { pageUrl: '/login',           title: 'Registration / Login in Bagchee',       metaTitle: 'Registration / Login in Bagchee',       metaDesc: 'Create your account in Bagchee', metaKeywords: '' },
    { pageUrl: '/help',            title: 'Help',                                  metaTitle: 'Help',                                  metaDesc: 'All about Shipping & Delivery, Returns & Replacements, Ordering, Payment, Pricing & Promotions.', metaKeywords: '' },
    { pageUrl: '/testimonials',    title: 'Customer testimonials',                 metaTitle: 'Customer testimonials',                 metaDesc: 'Read what our customers say about Bagchee.', metaKeywords: '' },
    { pageUrl: '/contact',         title: 'Contact Us',                            metaTitle: 'Contact Us',                            metaDesc: 'Contact with Bagchee', metaKeywords: '' },
    { pageUrl: '/books',           title: 'Books - Bagchee',                       metaTitle: 'Books - Bagchee',                       metaDesc: 'Browse books across all categories including Religion & Spirituality, History, Health, and more.', metaKeywords: 'Books, india books, indian books' },
    { pageUrl: '/account/wishlist',title: 'Wish list in Bagchee',                  metaTitle: 'Wish list in Bagchee',                  metaDesc: 'Your Bagchee wishlist', metaKeywords: '' },
    { pageUrl: '/account',         title: 'My Account in Bagchee',                 metaTitle: 'My Account in Bagchee',                 metaDesc: 'Manage your Bagchee account', metaKeywords: '' },
    { pageUrl: '/sale',            title: 'Sale Today - Bagchee',                  metaTitle: 'Sale Today - Bagchee',                  metaDesc: 'Shop discounted Indian books and more at Bagchee.', metaKeywords: 'sale, discount, indian books' },
    { pageUrl: '/new-arrivals',    title: 'New Arrivals - Bagchee',                metaTitle: 'New Arrivals - Bagchee',                metaDesc: 'Discover the latest additions to Bagchee\'s collection.', metaKeywords: 'new books, new arrivals, bagchee' },
];

async function main() {
    console.log('Importing settings...');
    const existing = await prisma.settings.findFirst();
    if (existing) {
        await prisma.settings.update({ where: { id: existing.id }, data: settingsData });
        console.log('✅ Settings updated (id:', existing.id, ')');
    } else {
        await prisma.settings.create({ data: settingsData });
        console.log('✅ Settings created');
    }

    console.log('\nImporting meta tags...');
    let created = 0, updated = 0;
    for (const tag of metaTagsData) {
        const existing = await prisma.metaTag.findFirst({ where: { pageUrl: tag.pageUrl } });
        if (existing) {
            await prisma.metaTag.update({ where: { id: existing.id }, data: tag });
            updated++;
        } else {
            await prisma.metaTag.create({ data: tag });
            created++;
        }
    }
    console.log(`✅ Meta tags: ${created} created, ${updated} updated`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
