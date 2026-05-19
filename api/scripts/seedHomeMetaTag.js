import prisma from '../lib/prisma.js';

const HOME_META = {
    pageUrl:      '/',
    title:        'Bagchee - Books That Stick | Online Bookstore',
    metaTitle:    'Bagchee - Buy Books Online | Best Prices on Indian & International Books',
    metaDesc:     'Shop from a vast collection of Indian and international books at Bagchee. Get the best prices, free worldwide delivery, and a seamless shopping experience.',
    metaKeywords: 'buy books online, Indian books, international books, bookstore, Bagchee, cheap books, free delivery books',
};

async function run() {
    const existing = await prisma.metaTag.findFirst({
        where: { pageUrl: { equals: '/', mode: 'insensitive' } }
    });

    if (existing) {
        console.log('Home page meta tag already exists (id:', existing.id, '). Updating...');
        const updated = await prisma.metaTag.update({
            where: { id: existing.id },
            data: HOME_META,
        });
        console.log('Updated:', updated);
    } else {
        const created = await prisma.metaTag.create({ data: HOME_META });
        console.log('Created home page meta tag (id:', created.id, ')');
    }

    await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
