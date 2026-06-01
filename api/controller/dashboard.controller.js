import prisma from '../lib/prisma.js';

// GET /dashboard/summary  (admin)
// Sales figures (this month / last month / last year) + the 5 most recent
// orders, users and reviews for the admin home dashboard.
export const getDashboardSummary = async (req, res) => {
    try {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfThisYear  = new Date(now.getFullYear(), 0, 1);
        const startOfLastYear  = new Date(now.getFullYear() - 1, 0, 1);

        // Cancelled orders don't count as sales.
        const notCancelled = { NOT: { status: 'cancelled' } };
        const sumTotal = async (gte, lt) => {
            const r = await prisma.order.aggregate({
                _sum: { total: true },
                where: { createdAt: lt ? { gte, lt } : { gte }, ...notCancelled },
            });
            return r._sum.total || 0;
        };

        const [currentMonth, lastMonth, lastYear, recentOrders, recentUsers, recentReviews] = await Promise.all([
            sumTotal(startOfThisMonth),
            sumTotal(startOfLastMonth, startOfThisMonth),
            sumTotal(startOfLastYear, startOfThisYear),
            prisma.order.findMany({
                orderBy: { id: 'desc' }, take: 5,
                select: {
                    id: true, orderNumber: true, total: true, currency: true, createdAt: true,
                    shippingCountry: true, shippingFirstName: true, shippingLastName: true,
                    customer: { select: { name: true } },
                },
            }),
            prisma.user.findMany({
                where: { role: 'user' },
                orderBy: { createdAt: 'desc' }, take: 5,
                select: {
                    id: true, name: true, firstName: true, lastName: true, email: true, createdAt: true,
                    // User.country defaults to "India" and isn't captured at signup, so it's
                    // unreliable. Use the latest order's shipping country (real) instead.
                    orders: { select: { shippingCountry: true }, orderBy: { id: 'desc' }, take: 1 },
                },
            }),
            prisma.review.findMany({
                orderBy: { id: 'desc' }, take: 5,
                select: {
                    id: true, name: true, title: true, rating: true, active: true, createdAt: true,
                    product: { select: { title: true } },
                },
            }),
        ]);

        res.json({
            status: true,
            data: {
                sales: { currentMonth, lastMonth, lastYear },
                recentOrders: recentOrders.map(o => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    total: o.total,
                    currency: o.currency || 'USD',
                    createdAt: o.createdAt,
                    customerName: o.customer?.name
                        || [o.shippingFirstName, o.shippingLastName].filter(Boolean).join(' ')
                        || 'Guest',
                    country: o.shippingCountry || '—',
                })),
                recentUsers: recentUsers.map(u => ({
                    id: u.id,
                    name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '(no name)',
                    // Real country from their latest order; "—" when they have no order yet
                    // (never the bogus "India" default on the user record).
                    country: u.orders?.[0]?.shippingCountry || '—',
                    createdAt: u.createdAt,
                })),
                recentReviews: recentReviews.map(r => ({
                    id: r.id,
                    name: r.name || 'Anonymous',
                    title: r.title || '',
                    rating: r.rating || 0,
                    active: r.active,
                    productTitle: r.product?.title || '',
                    createdAt: r.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error('Dashboard summary error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
