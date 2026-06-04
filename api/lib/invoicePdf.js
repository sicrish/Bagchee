// Pure-JS invoice PDF generator (pdfkit — no headless browser, uses built-in Helvetica).
// Returns a Promise<Buffer> with a print-ready A4 invoice for an order.
import PDFDocument from 'pdfkit';
import { activeItems, payableTotal } from './orderTotals.js';

const BLUE  = '#008DDA';
const DARK  = '#2d2d2d';
const MUTED = '#888888';
const LINE  = '#e6decd';

export const generateInvoicePdf = (order) => new Promise((resolve, reject) => {
    try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const currency = order.currency || 'USD';
        const orderNum = order.orderNumber || order.id || '';
        const money = (n) => `${currency} ${Number(n || 0).toFixed(2)}`;
        const dateStr = new Date(order.createdAt || Date.now())
            .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        const contentW = right - left;

        // ── Header band ──
        doc.rect(0, 0, doc.page.width, 96).fill(BLUE);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text('Bagchee', left, 30);
        doc.font('Helvetica').fontSize(10).fillColor('#dceefb').text('books that stick', left, 60);
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#ffffff')
            .text(`Invoice #${orderNum}`, left, 32, { width: contentW, align: 'right' });
        doc.font('Helvetica').fontSize(10).fillColor('#dceefb')
            .text(`Date: ${dateStr}`, left, 54, { width: contentW, align: 'right' });

        // ── Address blocks: Name / Company / Address 1 / Address 2 / City, State Zip / Country ──
        let y = 124;
        const addrLines = (fn, ln, company, a1, a2, city, state, post, country) => {
            const csz = [[city, state].filter(Boolean).join(', '), post].filter(Boolean).join(' ');
            return [[fn, ln].filter(Boolean).join(' '), company, a1, a2, csz, country].filter(Boolean);
        };
        const ship = addrLines(order.shippingFirstName, order.shippingLastName, order.shippingCompany,
            order.shippingAddress1, order.shippingAddress2, order.shippingCity, order.shippingState,
            order.shippingPostcode, order.shippingCountry);
        const bill = addrLines(order.billingFirstName, order.billingLastName, order.billingCompany,
            order.billingAddress1, order.billingAddress2, order.billingCity, order.billingState,
            order.billingPostcode, order.billingCountry);
        const colW = contentW / 2;

        doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(10);
        if (ship.length) doc.text('SHIP TO', left, y);
        if (bill.length) doc.text('BILL TO', left + colW, y);
        doc.fillColor(DARK).font('Helvetica').fontSize(10);
        if (ship.length) doc.text(ship.join('\n'), left, y + 15, { width: colW - 14, lineGap: 2 });
        if (bill.length) doc.text(bill.join('\n'), left + colW, y + 15, { width: colW - 14, lineGap: 2 });

        const blockRows = Math.max(ship.length, bill.length);
        y += 15 + blockRows * 14 + 18;

        // ── Order meta line ──
        doc.fillColor(MUTED).font('Helvetica').fontSize(9)
            .text(`Status: ${order.status || '—'}     Payment: ${order.paymentType || '—'}     Shipping: ${order.shippingType || '—'}`, left, y);
        y += 22;

        // ── Items table ──
        const xItem = left;
        const xQty = right - 230;
        const xPrice = right - 160;
        const xTotal = right - 70;
        const drawHeader = () => {
            doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9);
            doc.text('ITEM', xItem, y, { width: xQty - xItem - 6 });
            doc.text('QTY', xQty, y, { width: 50, align: 'center' });
            doc.text('UNIT PRICE', xPrice, y, { width: 80, align: 'right' });
            doc.text('TOTAL', xTotal, y, { width: 70, align: 'right' });
            y += 13;
            doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(BLUE).stroke();
            y += 7;
        };
        drawHeader();

        doc.font('Helvetica').fontSize(10).fillColor(DARK);
        activeItems(order.items).forEach((it) => {
            const name = it.name || it.product?.title || 'Item';
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price) || 0;
            const nameW = xQty - xItem - 6;
            const nameH = doc.heightOfString(name, { width: nameW });
            const rowH = Math.max(nameH, 13);
            if (y + rowH > doc.page.height - 70) { doc.addPage(); y = 60; drawHeader(); }
            doc.fillColor(DARK).font('Helvetica').fontSize(10);
            doc.text(name, xItem, y, { width: nameW });
            doc.text(String(qty), xQty, y, { width: 50, align: 'center' });
            doc.text(money(price), xPrice, y, { width: 80, align: 'right' });
            doc.text(money(price * qty), xTotal, y, { width: 70, align: 'right' });
            y += rowH + 7;
            doc.moveTo(left, y - 3).lineTo(right, y - 3).lineWidth(0.5).strokeColor(LINE).stroke();
        });

        // ── Totals ──
        y += 8;
        const totalValX = right - 130;   // wide box so "USD 1,234.56" never wraps to a new line
        const totalLblX = right - 290;
        if (Number(order.shippingCost)) {
            doc.font('Helvetica').fontSize(10).fillColor(DARK)
                .text('Shipping', totalLblX, y, { width: 150, align: 'right' })
                .text(money(order.shippingCost), totalValX, y, { width: 130, align: 'right' });
            y += 16;
        }
        doc.font('Helvetica-Bold').fontSize(13).fillColor(BLUE)
            .text('Grand Total', totalLblX, y, { width: 150, align: 'right' })
            .text(money(payableTotal(order)), totalValX, y, { width: 130, align: 'right' });

        // ── Footer ──
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
            .text(`© ${new Date().getFullYear()} Bagchee. All rights reserved. — 4384/4A Ansari Road, New Delhi 110002, India`,
                left, doc.page.height - 60, { width: contentW, align: 'center' });

        doc.end();
    } catch (err) {
        reject(err);
    }
});

export default generateInvoicePdf;
