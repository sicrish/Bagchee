import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Users, Mail, Loader2, ArrowLeft, FileText, FlaskConical, Clock,
  Trash2, Package, X, PlusCircle, Eye, ChevronDown, ChevronUp,
  Plus, Image, Tag
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../../utils/imageUrl';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://www.bagchee.com';

// ─── Template Definitions ────────────────────────────────────────────────────
const STRUCTURED_TEMPLATES = {
  'single-book': {
    name: 'Single Book Highlight',
    description: '1 featured book — large display',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'Book of the Month' },
      { key: 'subHeading', label: 'Sub Heading', default: 'Our Top Pick This Month' },
      { key: 'description', label: 'Description (optional)', default: '', multiline: true },
    ],
    bookSlots: [{ key: 'book1', label: 'Featured Book' }],
    maxBanners: 2,
  },
  'new-arrivals': {
    name: 'Category New Arrivals',
    description: '2 highlights + 12 books in 2-column grid',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'New Arrivals' },
      { key: 'categoryName', label: 'Category Name', default: '' },
      { key: 'introText', label: 'Intro Text (optional)', default: '', multiline: true },
    ],
    bookSlots: [
      { key: 'highlight1', label: 'Highlight Book 1 (top — larger)' },
      { key: 'highlight2', label: 'Highlight Book 2 (top — larger)' },
      { key: 'book1', label: 'Book 1' }, { key: 'book2', label: 'Book 2' },
      { key: 'book3', label: 'Book 3' }, { key: 'book4', label: 'Book 4' },
      { key: 'book5', label: 'Book 5' }, { key: 'book6', label: 'Book 6' },
      { key: 'book7', label: 'Book 7' }, { key: 'book8', label: 'Book 8' },
      { key: 'book9', label: 'Book 9' }, { key: 'book10', label: 'Book 10' },
      { key: 'book11', label: 'Book 11' }, { key: 'book12', label: 'Book 12' },
    ],
    maxBanners: 1,
  },
  'curated-picks': {
    name: 'Curated Collection',
    description: '4 books in 2×2 grid',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: "Editor's Picks" },
      { key: 'subHeading', label: 'Sub Heading', default: 'Handpicked for you' },
      { key: 'introText', label: 'Intro Text (optional)', default: '', multiline: true },
    ],
    bookSlots: [
      { key: 'book1', label: 'Book 1' }, { key: 'book2', label: 'Book 2' },
      { key: 'book3', label: 'Book 3' }, { key: 'book4', label: 'Book 4' },
    ],
    maxBanners: 2,
  },
  'weekly-digest': {
    name: 'Weekly Digest',
    description: '5 featured books with intro & outro',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'Your Weekly Book Digest' },
      { key: 'greeting', label: 'Greeting', default: 'Dear Reader,' },
      { key: 'introText', label: 'Intro Paragraph', default: "Here's what's new at Bagchee this week.", multiline: true },
      { key: 'outroText', label: 'Closing Message', default: 'Happy reading!\nThe Bagchee Team', multiline: true },
    ],
    bookSlots: [
      { key: 'book1', label: "Editor's Pick 1" },
      { key: 'book2', label: "Editor's Pick 2" },
      { key: 'book3', label: "Editor's Pick 3" },
      { key: 'book4', label: "Editor's Pick 4" },
      { key: 'book5', label: "Editor's Pick 5" },
    ],
    maxBanners: 1,
  },
  'monthly-digest': {
    name: 'Monthly Digest',
    description: '1 featured highlight + up to 20 books',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'Monthly Book Digest' },
      { key: 'subHeading', label: 'Sub Heading', default: 'Your monthly picks from Bagchee' },
      { key: 'greeting', label: 'Greeting', default: 'Dear Reader,' },
      { key: 'introText', label: 'Intro Text', default: "Here are our hand-picked books this month.", multiline: true },
      { key: 'outroText', label: 'Closing Message', default: 'Happy reading!\nThe Bagchee Team', multiline: true },
    ],
    bookSlots: [
      { key: 'featured', label: 'Featured Book (top — large highlight)' },
      { key: 'book1', label: 'Book 1' },   { key: 'book2', label: 'Book 2' },
      { key: 'book3', label: 'Book 3' },   { key: 'book4', label: 'Book 4' },
      { key: 'book5', label: 'Book 5' },   { key: 'book6', label: 'Book 6' },
      { key: 'book7', label: 'Book 7' },   { key: 'book8', label: 'Book 8' },
      { key: 'book9', label: 'Book 9' },   { key: 'book10', label: 'Book 10' },
      { key: 'book11', label: 'Book 11' }, { key: 'book12', label: 'Book 12' },
      { key: 'book13', label: 'Book 13' }, { key: 'book14', label: 'Book 14' },
      { key: 'book15', label: 'Book 15' }, { key: 'book16', label: 'Book 16' },
      { key: 'book17', label: 'Book 17' }, { key: 'book18', label: 'Book 18' },
      { key: 'book19', label: 'Book 19' }, { key: 'book20', label: 'Book 20' },
    ],
    maxBanners: 2,
  },
};

// ─── HTML generation helpers ──────────────────────────────────────────────────
const buildBannerHtml = (banner) => {
  if (!banner) return '';
  if (banner.type === 'coupon') {
    return `<div style="background:${banner.bgColor || '#FFD700'};border-radius:10px;padding:20px 30px;text-align:center;margin:16px 0;">
  <p style="font-size:14px;color:#0B2F3A;margin:0 0 10px;font-weight:600;">${banner.text || ''}</p>
  ${banner.code ? `<p style="display:inline-block;font-size:26px;font-weight:800;color:#0B2F3A;letter-spacing:3px;margin:0;background:#fff;padding:6px 20px;border-radius:6px;">${banner.code}</p>` : ''}
</div>`;
  }
  return banner.imageUrl ? `<div style="margin:16px 0;text-align:center;">
  <a href="${banner.link || '#'}" target="_blank">
    <img src="${banner.imageUrl}" alt="Banner" style="max-width:100%;border-radius:8px;display:block;margin:0 auto;" />
  </a>
</div>` : '';
};

const buildBookCardSmall = (book) => {
  if (!book) return `<td style="width:50%;padding:6px;vertical-align:top;"><div style="background:#f5f5f5;border-radius:6px;padding:20px;text-align:center;min-height:80px;"><p style="color:#aaa;font-size:11px;margin:0;">No book</p></div></td>`;
  const img = getProductImageUrl(book);
  const price = book.inrPrice ? `₹${book.inrPrice}` : (book.price ? `$${book.price}` : '');
  return `<td style="width:50%;padding:6px;vertical-align:top;">
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e6decd;border-radius:6px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr><td style="padding:10px;text-align:center;background:#fafaf8;">
    ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="80" style="display:block;margin:0 auto;border-radius:4px;max-height:100px;object-fit:cover;" /></a>` : '<div style="height:80px;"></div>'}
  </td></tr>
  <tr><td style="padding:8px 10px;">
    <p style="font-size:12px;font-weight:700;color:#0B2F3A;margin:0 0 4px;line-height:1.3;">${book.title}</p>
    ${price ? `<p style="font-size:13px;font-weight:700;color:#008DDA;margin:0 0 8px;">${price}</p>` : ''}
    <a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:5px 10px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:bold;display:inline-block;">View →</a>
  </td></tr>
</table>
</td>`;
};

const buildBookCardLarge = (book) => {
  if (!book) return `<div style="background:#f5f5f5;border-radius:8px;padding:30px;text-align:center;max-width:520px;margin:0 auto;"><p style="color:#aaa;font-size:13px;margin:0;">No book selected</p></div>`;
  const img = getProductImageUrl(book);
  const price = book.inrPrice ? `₹${book.inrPrice}` : (book.price ? `$${book.price}` : '');
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;margin:20px auto;border:1px solid #e6decd;border-radius:10px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="width:140px;padding:20px;background:#fafaf8;vertical-align:top;">
      ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="120" style="display:block;border-radius:6px;max-height:160px;object-fit:cover;" /></a>` : ''}
    </td>
    <td style="padding:20px;vertical-align:top;">
      <p style="font-size:18px;font-weight:700;color:#0B2F3A;margin:0 0 8px;line-height:1.3;">${book.title}</p>
      <p style="font-size:12px;color:#4A6fa5;font-family:monospace;margin:0 0 6px;">ID: ${book.bagcheeId}</p>
      ${price ? `<p style="font-size:16px;font-weight:700;color:#008DDA;margin:0 0 16px;">${price}</p>` : '<div style="height:16px;"></div>'}
      <a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">View Book →</a>
    </td>
  </tr>
</table>`;
};

const buildBookCardHighlight = (book) => {
  if (!book) return `<td style="width:50%;padding:8px;vertical-align:top;"><div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;min-height:100px;"><p style="color:#aaa;font-size:11px;margin:0;">No book</p></div></td>`;
  const img = getProductImageUrl(book);
  const price = book.inrPrice ? `₹${book.inrPrice}` : (book.price ? `$${book.price}` : '');
  return `<td style="width:50%;padding:8px;vertical-align:top;">
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:2px solid #008DDA;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr><td style="padding:14px;text-align:center;background:#EBF7FD;">
    ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="100" style="display:block;margin:0 auto;border-radius:4px;max-height:140px;object-fit:cover;" /></a>` : '<div style="height:100px;"></div>'}
  </td></tr>
  <tr><td style="padding:10px 12px;">
    <p style="font-size:14px;font-weight:700;color:#0B2F3A;margin:0 0 4px;line-height:1.3;">${book.title}</p>
    ${price ? `<p style="font-size:14px;font-weight:700;color:#008DDA;margin:0 0 10px;">${price}</p>` : ''}
    <a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:7px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:bold;display:inline-block;">View →</a>
  </td></tr>
</table>
</td>`;
};

const buildBookCardDigest = (book) => {
  if (!book) return '';
  const img = getProductImageUrl(book);
  const price = book.inrPrice ? `₹${book.inrPrice}` : (book.price ? `$${book.price}` : '');
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:16px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="width:80px;padding:12px;background:#fafaf8;vertical-align:top;">
      ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="60" style="display:block;border-radius:4px;" /></a>` : ''}
    </td>
    <td style="padding:12px;vertical-align:top;">
      <p style="font-size:15px;font-weight:700;color:#0B2F3A;margin:0 0 4px;">${book.title}</p>
      ${price ? `<p style="font-size:14px;font-weight:700;color:#008DDA;margin:0 0 8px;">${price}</p>` : ''}
      <a href="${FRONTEND_URL}/books/${book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:bold;">View →</a>
    </td>
  </tr>
</table>`;
};

const generateTemplateHtml = (templateType, headings, books, banners) => {
  const h = headings;
  const bHtml = banners.map(b => buildBannerHtml(b)).join('');

  if (templateType === 'single-book') {
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0B2F3A;">
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 8px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:16px;margin:0 0 20px;">${h.subHeading}</p>` : ''}
  ${bHtml}
  ${buildBookCardLarge(books.book1)}
  ${h.description ? `<p style="color:#555;font-size:14px;line-height:1.7;text-align:center;margin:16px 0;">${h.description}</p>` : ''}
</div>`;
  }

  if (templateType === 'new-arrivals') {
    const slots = ['book1','book2','book3','book4','book5','book6','book7','book8','book9','book10','book11','book12'];
    let rows = '';
    for (let i = 0; i < slots.length; i += 2) {
      const l = books[slots[i]]; const r = books[slots[i+1]];
      if (!l && !r) continue;
      rows += `<tr>${buildBookCardSmall(l)}${buildBookCardSmall(r)}</tr>`;
    }
    const hasHighlights = books.highlight1 || books.highlight2;
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 6px;">${h.mainHeading}</h1>` : ''}
  ${h.categoryName ? `<p style="text-align:center;color:#008DDA;font-size:14px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">${h.categoryName}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">${h.introText}</p>` : ''}
  ${bHtml}
  ${hasHighlights ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:16px;"><tr>${buildBookCardHighlight(books.highlight1)}${buildBookCardHighlight(books.highlight2)}</tr></table>` : ''}
  ${rows ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>` : ''}
  <div style="text-align:center;margin:24px 0;">
    <a href="${FRONTEND_URL}/new-arrivals" target="_blank" style="background:#008DDA;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Browse All New Arrivals →</a>
  </div>
</div>`;
  }

  if (templateType === 'curated-picks') {
    const slots = ['book1','book2','book3','book4'];
    let rows = '';
    for (let i = 0; i < 4; i += 2) {
      rows += `<tr>${buildBookCardSmall(books[slots[i]])}${buildBookCardSmall(books[slots[i+1]])}</tr>`;
    }
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:26px;margin:0 0 6px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:15px;margin:0 0 8px;">${h.subHeading}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">${h.introText}</p>` : ''}
  ${bHtml}
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>
</div>`;
  }

  if (templateType === 'weekly-digest') {
    const slots = ['book1','book2','book3','book4','book5'];
    const booksHtml = slots.filter(k => books[k]).map(k => buildBookCardDigest(books[k])).join('');
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:26px;margin:0 0 20px;">${h.mainHeading}</h1>` : ''}
  ${h.greeting ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">${h.greeting}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${h.introText}</p>` : ''}
  ${bHtml}
  ${booksHtml}
  ${h.outroText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:16px 0 0;">${h.outroText.replace(/\n/g, '<br/>')}</p>` : ''}
</div>`;
  }

  if (templateType === 'monthly-digest') {
    const slots = ['book1','book2','book3','book4','book5','book6','book7','book8','book9','book10','book11','book12','book13','book14','book15','book16','book17','book18','book19','book20'];
    let rows = '';
    for (let i = 0; i < slots.length; i += 2) {
      const l = books[slots[i]]; const r = books[slots[i+1]];
      if (!l && !r) continue;
      rows += `<tr>${buildBookCardSmall(l)}${buildBookCardSmall(r)}</tr>`;
    }
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 8px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:16px;margin:0 0 16px;">${h.subHeading}</p>` : ''}
  ${h.greeting ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">${h.greeting}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${h.introText}</p>` : ''}
  ${bHtml}
  ${books.featured ? buildBookCardLarge(books.featured) : ''}
  ${rows ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:20px;">${rows}</table>` : ''}
  ${h.outroText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:24px 0 0;">${h.outroText.replace(/\n/g, '<br/>')}</p>` : ''}
</div>`;
  }

  return '';
};

// ─── Pre-built HTML Templates (kept as-is) ────────────────────────────────────
const EMAIL_TEMPLATES = [
  { name: 'Blank', subject: '', body: '' },
  { name: 'Coupon / Promo Code', subject: 'Exclusive Offer Just for You!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:5px;">MEMBER ONLY <span style="color:#e53935;">OFFER</span></h1><div style="background:#e53935;border-radius:12px;padding:30px;margin:20px auto;max-width:480px;color:#fff;"><p style="font-size:22px;font-weight:bold;margin:0;">CELEBRATE</p><p style="font-size:16px;margin:5px 0;">our new collection and get</p><p style="font-size:52px;font-weight:bold;margin:10px 0;font-style:italic;">10% off</p><p style="font-size:16px;margin-top:15px;">Use promo code</p><p style="display:inline-block;border:2px dashed #fff;padding:8px 24px;font-size:24px;font-weight:bold;letter-spacing:3px;margin:8px 0;">BAGCHEE10</p><p style="font-size:16px;margin-top:8px;">at checkout</p></div><p style="color:#666;font-size:13px;margin-top:15px;">Valid for a limited time only.</p></div>` },
  { name: 'New Arrivals', subject: 'New Arrivals This Week at Bagchee!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:10px;">New Arrivals</h1><p style="color:#666;font-size:15px;line-height:1.6;max-width:480px;margin:0 auto 25px;">Discover our latest collection of handpicked Indian books.</p><div style="margin-top:25px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Browse New Arrivals</a></div></div>` },
  { name: 'Sale / Discount', subject: 'Sale Today - Up to 25% Off at Bagchee!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#e53935;font-size:36px;font-weight:bold;margin-bottom:5px;">SALE TODAY</h1><p style="color:#0B2F3A;font-size:20px;margin:0 0 20px;">Up to <strong>25% OFF</strong> on selected titles</p><div style="background:linear-gradient(135deg,#e53935,#c62828);border-radius:12px;padding:30px;margin:0 auto;max-width:480px;color:#fff;"><p style="font-size:48px;font-weight:bold;margin:0;">25% OFF</p><p style="font-size:16px;margin:10px 0 0;">on hundreds of books</p></div><div style="margin-top:25px;"><a href="${FRONTEND_URL}/sale" style="display:inline-block;background:#e53935;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Shop the Sale</a></div></div>` },
  { name: 'Membership', subject: 'Join Bagchee Membership - Save 10% Every Day!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:10px;">Bagchee Membership</h1><div style="background:#008DDA;border-radius:12px;padding:30px;margin:0 auto;max-width:480px;color:#fff;"><p style="font-size:42px;font-weight:bold;margin:0;">10% OFF</p><p style="font-size:18px;margin:8px 0;">on every order, every day</p></div><div style="margin-top:25px;"><a href="${FRONTEND_URL}/membership" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Become a Member</a></div></div>` },
];

const getFullEmailHtml = (subject, bodyHtml) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F7EEDD;">
<div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:#F7EEDD;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid #e6decd;">
    <div style="background-color:#008DDA;padding:35px;text-align:center;">
      <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:700;letter-spacing:0.5px;">Bagchee</h1>
      <p style="color:#FFFFFF;margin-top:5px;opacity:0.9;font-size:14px;">${subject}</p>
    </div>
    <div style="padding:40px 30px;color:#0B2F3A;font-size:15px;line-height:1.7;">${bodyHtml}</div>
    <div style="background-color:#fffdf5;padding:20px;text-align:center;border-top:1px solid #e6decd;">
      <p style="font-size:12px;color:#4A6fa5;margin:0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
      <p style="font-size:11px;color:#4A6fa5;margin-top:6px;opacity:0.7;">Indore, India</p>
    </div>
  </div>
</div>
</body></html>`;

const AUDIENCE_OPTIONS = [
  { key: 'subscribers', label: 'All newsletter subscribers' },
  { key: 'members', label: 'All active members' },
  { key: 'purchasers', label: 'All with a purchase' },
  { key: 'categories', label: 'Category subscribers' },
  { key: 'specific', label: 'Specific subscribers' },
];

// ─── Book Slot Picker ─────────────────────────────────────────────────────────
const BookSlotPicker = ({ slotKey, label, value, onChange, apiBaseUrl }) => {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    const id = inputId.trim();
    if (!id) return toast.error('Enter a product ID');
    setLoading(true);
    try {
      const res = await axios.post(`${apiBaseUrl}/email-campaign/products-preview`, { ids: [id] });
      if (res.data.status && res.data.data.length > 0) {
        onChange(slotKey, res.data.data[0]);
        setInputId('');
        toast.success(`"${res.data.data[0].title}" added to ${label}`);
      } else {
        toast.error('Product not found');
      }
    } catch {
      toast.error('Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-montserrat mb-2">{label}</p>
      {value ? (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
          {getProductImageUrl(value) && (
            <img
              src={getProductImageUrl(value)}
              alt={value.title}
              className="w-9 h-12 object-cover rounded shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-main truncate">{value.title}</p>
            <p className="text-[10px] text-primary font-mono">{value.bagcheeId}</p>
            {(value.inrPrice || value.price) && (
              <p className="text-[10px] text-gray-500 font-bold">{value.inrPrice ? `₹${value.inrPrice}` : `$${value.price}`}</p>
            )}
          </div>
          <button onClick={() => onChange(slotKey, null)} className="text-red-400 hover:text-red-600 shrink-0 p-1"><X size={13} /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            placeholder="Bagchee ID / ISBN"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-mono"
          />
          <button
            onClick={handleFind}
            disabled={loading}
            className="bg-primary text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : 'Find'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SendEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editor = useRef(null);
  const preselectedEmails = location.state?.selectedEmails || [];

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [audience, setAudience] = useState(preselectedEmails.length > 0 ? ['specific'] : ['subscribers']);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Per-audience counts
  const [audienceCounts, setAudienceCounts] = useState({ subscribers: 0, members: 0, purchasers: 0, categories: 0 });
  const [countsLoading, setCountsLoading] = useState(false);

  // Category tree for audience
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [expandedMainCats, setExpandedMainCats] = useState({});
  const [catTreeLoading, setCatTreeLoading] = useState(false);

  // Template Builder
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderTemplateType, setBuilderTemplateType] = useState('single-book');
  const [builderHeadings, setBuilderHeadings] = useState({});
  const [builderBooks, setBuilderBooks] = useState({});
  const [builderBanners, setBuilderBanners] = useState([]);

  // Specific subscribers — manual input
  const [specificEmailsInput, setSpecificEmailsInput] = useState('');

  // Banner library
  const [bannerLibrary, setBannerLibrary] = useState([]);
  const [bannerLibraryLoading, setBannerLibraryLoading] = useState(false);
  const [bannerLibraryLoaded, setBannerLibraryLoaded] = useState(false);
  const [activeBannerTab, setActiveBannerTab] = useState({}); // idx → 'url'|'upload'|'library'

  // Product picker (legacy raw mode)
  const [productIdsInput, setProductIdsInput] = useState('');
  const [pickedProducts, setPickedProducts] = useState([]);
  const [productFetchLoading, setProductFetchLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // Subcategories grouped by main category id
  const subsByMainCat = useMemo(() => {
    const map = {};
    subCategories.forEach(s => { if (!map[s.categoryId]) map[s.categoryId] = []; map[s.categoryId].push(s); });
    return map;
  }, [subCategories]);

  // Fetch audience counts whenever selectedCategoryFilters changes
  const fetchAudienceCounts = useCallback(async (cats) => {
    setCountsLoading(true);
    try {
      const params = cats && cats.length > 0 ? `?selectedCategories=${cats.join(',')}` : '';
      const res = await axios.get(`${API_BASE_URL}/email-campaign/audience-counts${params}`);
      if (res.data.status) setAudienceCounts(res.data.counts);
    } catch {
      // ignore
    } finally {
      setCountsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => { fetchAudienceCounts(selectedCategoryFilters); }, [selectedCategoryFilters, fetchAudienceCounts]);

  // Fetch categories for tree
  useEffect(() => {
    const load = async () => {
      setCatTreeLoading(true);
      try {
        const [mRes, sRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/main-categories/list`),
          axios.get(`${API_BASE_URL}/subcategory/fetch`)
        ]);
        if (mRes.data.status) setMainCategories(mRes.data.data || []);
        if (sRes.data.status) setSubCategories(sRes.data.data || []);
      } catch { /* ignore */ } finally {
        setCatTreeLoading(false);
      }
    };
    load();
  }, [API_BASE_URL]);

  // Fetch scheduled emails
  useEffect(() => {
    axios.get(`${API_BASE_URL}/email-campaign/scheduled`)
      .then(res => { if (res.data.status) setScheduledEmails(res.data.data); })
      .catch(() => {});
  }, [API_BASE_URL]);

  const editorConfig = useMemo(() => ({
    height: 400,
    placeholder: 'Compose your email content here...',
    buttons: ['source','|','bold','italic','underline','strikethrough','|','ul','ol','|','font','fontsize','brush','paragraph','|','image','link','|','align','|','hr','table','|','undo','redo','|','fullsize'],
    removeButtons: ['file','video'],
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
  }), []);

  const toggleAudience = (key) => {
    setAudience(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const toggleCategoryFilter = (name) => {
    setSelectedCategoryFilters(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  // All specific emails = preselected from list + manually typed
  const allSpecificEmails = useMemo(() => {
    const manual = specificEmailsInput
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));
    return [...new Set([...preselectedEmails, ...manual])];
  }, [preselectedEmails, specificEmailsInput]);

  // Computed total recipient count from checked audience types
  const totalRecipients = useMemo(() => {
    if (audience.includes('specific')) return allSpecificEmails.length;
    return audience.reduce((sum, key) => sum + (audienceCounts[key] || 0), 0);
  }, [audience, audienceCounts, allSpecificEmails]);

  const handleLoadTemplate = () => {
    const tmpl = EMAIL_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!tmpl) return;
    if (tmpl.name === 'Blank') { setSubject(''); setBody(''); return; }
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    toast.success(`"${tmpl.name}" template loaded`);
  };

  // ─── Template Builder ──────────────────────────────────────────────────
  const currentBuilderDef = STRUCTURED_TEMPLATES[builderTemplateType];

  const handleBuilderTemplateChange = (type) => {
    setBuilderTemplateType(type);
    const def = STRUCTURED_TEMPLATES[type];
    const defaults = {};
    def.headings.forEach(h => { defaults[h.key] = h.default; });
    setBuilderHeadings(defaults);
    setBuilderBooks({});
    setBuilderBanners([]);
  };

  useEffect(() => {
    const def = STRUCTURED_TEMPLATES['single-book'];
    const defaults = {};
    def.headings.forEach(h => { defaults[h.key] = h.default; });
    setBuilderHeadings(defaults);
  }, []);

  const handleBuilderHeadingChange = (key, val) => {
    setBuilderHeadings(prev => ({ ...prev, [key]: val }));
  };

  const handleBookSlotChange = (slotKey, product) => {
    setBuilderBooks(prev => ({ ...prev, [slotKey]: product }));
  };

  const loadBannerLibrary = async () => {
    if (bannerLibraryLoaded) return;
    setBannerLibraryLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/email-campaign/banner/list`);
      if (res.data.status) setBannerLibrary(res.data.data || []);
      setBannerLibraryLoaded(true);
    } catch { /* ignore */ } finally { setBannerLibraryLoading(false); }
  };

  const handleBannerUpload = async (idx, file) => {
    if (!file) return;
    const toastId = toast.loading('Uploading banner...');
    try {
      const fd = new FormData();
      fd.append('banner', file);
      const res = await axios.post(`${API_BASE_URL}/email-campaign/banner/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status) {
        updateBanner(idx, 'imageUrl', res.data.url);
        setBannerLibraryLoaded(false); // refresh library next time
        toast.success('Banner uploaded!', { id: toastId });
      } else {
        toast.error(res.data.msg || 'Upload failed', { id: toastId });
      }
    } catch { toast.error('Upload failed', { id: toastId }); }
  };

  const handleDeleteLibraryBanner = async (publicId) => {
    if (!window.confirm('Delete this banner from the library?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/email-campaign/banner`, { data: { publicId } });
      setBannerLibrary(prev => prev.filter(b => b.publicId !== publicId));
      toast.success('Banner deleted from library.');
    } catch { toast.error('Delete failed.'); }
  };

  const addBanner = () => {
    if (builderBanners.length >= currentBuilderDef.maxBanners) return;
    setBuilderBanners(prev => [...prev, { type: 'coupon', code: '', text: '', bgColor: '#FFD700', imageUrl: '', link: '' }]);
  };

  const removeBanner = (idx) => setBuilderBanners(prev => prev.filter((_, i) => i !== idx));

  const updateBanner = (idx, field, val) => {
    setBuilderBanners(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const handleBuildEmail = () => {
    const html = generateTemplateHtml(builderTemplateType, builderHeadings, builderBooks, builderBanners);
    if (!html) return toast.error('Failed to generate email HTML');
    setBody(html);
    setBuilderOpen(false);
    toast.success('Email built! Review and edit in the content editor below.');
  };

  // ─── Send / Schedule ───────────────────────────────────────────────────
  const handleSendTest = async () => {
    if (!testEmail.trim()) return toast.error('Enter a test email address.');
    if (!subject.trim()) return toast.error('Enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Compose an email body first.');
    setTestLoading(true);
    const toastId = toast.loading(`Sending test to ${testEmail}...`);
    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send-test`, { subject: subject.trim(), body, testEmail: testEmail.trim() });
      if (res.data.status) toast.success(res.data.msg, { id: toastId });
      else toast.error(res.data.msg || 'Failed to send test', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send test email', { id: toastId });
    } finally { setTestLoading(false); }
  };

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Compose an email body first.');
    if (audience.length === 0) return toast.error('Select at least one audience.');
    if (totalRecipients === 0) return toast.error('No recipients found for selected audience.');

    if (sendAt) {
      const sendAtDate = new Date(sendAt);
      if (sendAtDate <= new Date()) return toast.error('Scheduled time must be in the future.');
      const confirmed = window.confirm(`Schedule this email for ${sendAtDate.toLocaleString()}?\nSubject: ${subject}\nRecipients: ~${totalRecipients.toLocaleString()}`);
      if (!confirmed) return;
      setLoading(true);
      const toastId = toast.loading('Scheduling campaign...');
      try {
        const res = await axios.post(`${API_BASE_URL}/email-campaign/schedule`, {
          subject: subject.trim(), body, audience,
          sendAt: sendAtDate.toISOString(),
          selectedCategories: audience.includes('categories') ? selectedCategoryFilters : [],
          ...(audience.includes('specific') && { specificEmails: allSpecificEmails })
        });
        if (res.data.status) {
          toast.success(res.data.msg, { id: toastId });
          setSubject(''); setBody(''); setSendAt('');
          const listRes = await axios.get(`${API_BASE_URL}/email-campaign/scheduled`);
          if (listRes.data.status) setScheduledEmails(listRes.data.data);
        } else toast.error(res.data.msg || 'Failed to schedule', { id: toastId });
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to schedule campaign', { id: toastId });
      } finally { setLoading(false); }
      return;
    }

    const confirmed = window.confirm(`Send this email to ~${totalRecipients.toLocaleString()} recipient(s) NOW?\nSubject: ${subject}`);
    if (!confirmed) return;
    setLoading(true);
    const toastId = toast.loading(`Sending to ${totalRecipients.toLocaleString()} recipients...`);
    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send`, {
        subject: subject.trim(), body, audience,
        selectedCategories: audience.includes('categories') ? selectedCategoryFilters : [],
        ...(audience.includes('specific') && { specificEmails: allSpecificEmails })
      });
      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setSubject(''); setBody('');
      } else toast.error(res.data.msg || 'Failed to send', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send campaign', { id: toastId });
    } finally { setLoading(false); }
  };

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled email?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/email-campaign/scheduled/${id}`);
      if (res.data.status) {
        toast.success('Scheduled email cancelled.');
        setScheduledEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
      } else toast.error(res.data.msg);
    } catch (error) { toast.error(error.response?.data?.msg || 'Failed to cancel'); }
  };

  // Legacy product picker
  const handleFetchProducts = async () => {
    const raw = productIdsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return toast.error('Paste at least one product ID.');
    setProductFetchLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/products-preview`, { ids: raw });
      if (res.data.status) {
        const found = res.data.data;
        if (found.length === 0) return toast.error('No products found.');
        setPickedProducts(prev => { const existing = new Set(prev.map(p => p.id)); return [...prev, ...found.filter(p => !existing.has(p.id))]; });
        setProductIdsInput('');
        toast.success(`${found.length} product(s) loaded.`);
      }
    } catch (error) { toast.error(error.response?.data?.msg || 'Failed to fetch products.'); }
    finally { setProductFetchLoading(false); }
  };

  const handleInsertProductCards = () => {
    if (pickedProducts.length === 0) return toast.error('No products to insert.');
    const cards = pickedProducts.map(p => {
      const imgSrc = getProductImageUrl(p);
      const price = p.inrPrice ? `₹${p.inrPrice}` : (p.price ? `$${p.price}` : '');
      return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:540px;margin:0 auto 20px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    ${imgSrc ? `<td style="width:90px;vertical-align:top;padding:12px;"><img src="${imgSrc}" alt="${p.title}" width="80" style="display:block;border-radius:4px;object-fit:cover;" /></td>` : ''}
    <td style="vertical-align:top;padding:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0B2F3A;">${p.title}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#4A6fa5;">ID: ${p.bagcheeId}</p>
      ${price ? `<p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#008DDA;">${price}</p>` : ''}
      <a href="${FRONTEND_URL}/books/${p.bagcheeId}" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:8px 18px;font-size:13px;font-weight:bold;border-radius:6px;">View Book</a>
    </td>
  </tr>
</table>`;
    }).join('\n');
    setBody(prev => (prev && prev !== '<p><br></p>' ? prev + '\n' + cards : cards));
    toast.success(`${pickedProducts.length} product card(s) inserted into email.`);
  };

  const getMinDateTime = () => { const now = new Date(); now.setMinutes(now.getMinutes() + 5); return now.toISOString().slice(0, 16); };

  const statusColors = { pending: 'bg-yellow-100 text-yellow-700', sending: 'bg-blue-100 text-blue-700', sent: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/newsletter-subs')} className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Send Email Campaign
          </h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">Compose and send emails to your audience</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => navigate('/admin/newsletter-report')} className="text-xs text-primary font-montserrat font-bold underline hover:no-underline">
            View Campaign Reports →
          </button>
        </div>
      </div>

      <div className="max-w-4xl">

        {/* ── TEMPLATE BUILDER ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
          <button
            onClick={() => setBuilderOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="text-sm font-bold font-montserrat text-gray-700">Email Builder (Template Mode)</span>
              <span className="text-[10px] text-gray-400 font-montserrat ml-1">— structured editor for headers, books & banners</span>
            </div>
            {builderOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {builderOpen && (
            <div className="border-t border-gray-100 p-5 space-y-5">
              {/* Template type picker */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">Select Template Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(STRUCTURED_TEMPLATES).map(([key, def]) => (
                    <button
                      key={key}
                      onClick={() => handleBuilderTemplateChange(key)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${builderTemplateType === key ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className={`text-xs font-bold font-montserrat ${builderTemplateType === key ? 'text-primary' : 'text-gray-700'}`}>{def.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-montserrat">{def.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Headings */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">Headings & Text</label>
                <div className="space-y-3">
                  {currentBuilderDef.headings.map(h => (
                    <div key={h.key} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-3 text-right pt-2">
                        <label className="text-xs text-gray-500 font-montserrat font-bold">{h.label}</label>
                      </div>
                      <div className="col-span-9">
                        {h.multiline ? (
                          <textarea
                            value={builderHeadings[h.key] || ''}
                            onChange={(e) => handleBuilderHeadingChange(h.key, e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary resize-none font-montserrat"
                          />
                        ) : (
                          <input
                            type="text"
                            value={builderHeadings[h.key] || ''}
                            onChange={(e) => handleBuilderHeadingChange(h.key, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary font-montserrat"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Slots */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">
                  <Package size={12} className="inline mr-1 -mt-0.5" /> Book Slots ({currentBuilderDef.bookSlots.length} slots for this template)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentBuilderDef.bookSlots.map(slot => (
                    <BookSlotPicker
                      key={slot.key}
                      slotKey={slot.key}
                      label={slot.label}
                      value={builderBooks[slot.key] || null}
                      onChange={handleBookSlotChange}
                      apiBaseUrl={API_BASE_URL}
                    />
                  ))}
                </div>
              </div>

              {/* Banners */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">
                    Banners ({builderBanners.length}/{currentBuilderDef.maxBanners} max)
                  </label>
                  {builderBanners.length < currentBuilderDef.maxBanners && (
                    <button onClick={addBanner} className="text-xs text-primary font-bold font-montserrat flex items-center gap-1 hover:underline">
                      <Plus size={12} /> Add Banner
                    </button>
                  )}
                </div>
                {builderBanners.map((banner, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/50 relative">
                    <button onClick={() => removeBanner(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1">
                      <X size={13} />
                    </button>
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={() => updateBanner(idx, 'type', 'coupon')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-montserrat border-2 transition-all ${banner.type === 'coupon' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'}`}
                      >
                        <Tag size={11} /> Coupon Banner
                      </button>
                      <button
                        onClick={() => updateBanner(idx, 'type', 'image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-montserrat border-2 transition-all ${banner.type === 'image' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'}`}
                      >
                        <Image size={11} /> Image Banner
                      </button>
                    </div>
                    {banner.type === 'coupon' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Coupon Code</label>
                            <input value={banner.code} onChange={(e) => updateBanner(idx, 'code', e.target.value)} placeholder="e.g. SAVE20" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-mono tracking-widest" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Background Color</label>
                            <input type="color" value={banner.bgColor || '#FFD700'} onChange={(e) => updateBanner(idx, 'bgColor', e.target.value)} className="h-8 w-full rounded border border-gray-300 cursor-pointer" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Coupon Text</label>
                          <input value={banner.text} onChange={(e) => updateBanner(idx, 'text', e.target.value)} placeholder="e.g. Use this code at checkout for 20% off" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-montserrat" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Image source tabs */}
                        <div className="flex gap-1 mb-2">
                          {['url', 'upload', 'library'].map(tab => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => {
                                setActiveBannerTab(p => ({ ...p, [idx]: tab }));
                                if (tab === 'library') loadBannerLibrary();
                              }}
                              className={`px-3 py-1 rounded text-[10px] font-bold font-montserrat border transition-all ${(activeBannerTab[idx] || 'url') === tab ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                              {tab === 'url' ? 'URL' : tab === 'upload' ? 'Upload' : 'Library'}
                            </button>
                          ))}
                        </div>

                        {(activeBannerTab[idx] || 'url') === 'url' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Image URL</label>
                            <input value={banner.imageUrl} onChange={(e) => updateBanner(idx, 'imageUrl', e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-mono" />
                          </div>
                        )}

                        {activeBannerTab[idx] === 'upload' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Upload Banner Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleBannerUpload(idx, e.target.files[0])}
                              className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1.5 cursor-pointer"
                            />
                            {banner.imageUrl && (
                              <img src={banner.imageUrl} alt="banner" className="mt-2 max-h-20 rounded border border-gray-200" />
                            )}
                          </div>
                        )}

                        {activeBannerTab[idx] === 'library' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">
                              Select from Library {bannerLibrary.length > 0 && `(${bannerLibrary.length} banners)`}
                            </label>
                            {bannerLibraryLoading ? (
                              <div className="flex items-center gap-2 text-gray-400 text-xs py-2"><Loader2 size={12} className="animate-spin" /> Loading...</div>
                            ) : bannerLibrary.length === 0 ? (
                              <p className="text-[10px] text-gray-400 font-montserrat py-2">No banners uploaded yet. Use the Upload tab to add some.</p>
                            ) : (
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                {bannerLibrary.map(b => (
                                  <div key={b.publicId} className={`relative group cursor-pointer border-2 rounded overflow-hidden ${banner.imageUrl === b.url ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}>
                                    <img
                                      src={b.url}
                                      alt="banner"
                                      className="w-full h-14 object-cover"
                                      onClick={() => updateBanner(idx, 'imageUrl', b.url)}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteLibraryBanner(b.publicId); }}
                                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {banner.imageUrl && (
                              <p className="text-[10px] text-primary font-montserrat mt-1 truncate">Selected: {banner.imageUrl}</p>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Link URL</label>
                          <input value={banner.link} onChange={(e) => updateBanner(idx, 'link', e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-mono" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleBuildEmail}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-montserrat font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <FileText size={15} /> Build Email HTML → Load into Editor
              </button>
            </div>
          )}
        </div>

        {/* ── PRE-BUILT TEMPLATE SELECTOR ──────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">
            <FileText size={13} className="inline mr-1 -mt-0.5" /> Quick Template (Pre-built HTML)
          </label>
          <div className="flex items-center gap-3">
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat bg-white cursor-pointer">
              {EMAIL_TEMPLATES.map((tmpl) => (<option key={tmpl.name} value={tmpl.name}>{tmpl.name}</option>))}
            </select>
            <button onClick={handleLoadTemplate} className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95 shadow-sm">Load</button>
          </div>
        </div>

        {/* ── PRODUCT PICKER (raw mode) ─────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block font-montserrat">
            <Package size={13} className="inline mr-1 -mt-0.5" /> Product Picker (insert cards into editor)
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Paste IDs (Bagchee ID or ISBN), one per line or comma-separated.</p>
          <div className="flex gap-3 mb-3">
            <textarea value={productIdsInput} onChange={(e) => setProductIdsInput(e.target.value)} placeholder={"BB1234\nBB5678"} rows={3} className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono resize-none" />
            <button onClick={handleFetchProducts} disabled={productFetchLoading} className="self-start bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-sm whitespace-nowrap">
              {productFetchLoading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />} Fetch
            </button>
          </div>
          {pickedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {pickedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-cream-50 border border-cream-200 rounded-lg">
                    {getProductImageUrl(p) && (<img src={getProductImageUrl(p)} alt={p.title} className="w-10 h-14 object-cover rounded shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">{p.title}</p>
                      <p className="text-[10px] text-primary font-mono">{p.bagcheeId}</p>
                    </div>
                    <button onClick={() => setPickedProducts(prev => prev.filter(pp => pp.id !== p.id))} className="text-red-400 hover:text-red-600 p-1 rounded shrink-0"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button onClick={handleInsertProductCards} className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-montserrat font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                <PlusCircle size={15} /> Insert {pickedProducts.length} Product Card{pickedProducts.length > 1 ? 's' : ''} into Email
              </button>
            </>
          )}
        </div>

        {/* ── AUDIENCE SELECTOR ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3 block font-montserrat">
            <Users size={13} className="inline mr-1 -mt-0.5" /> Select Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIENCE_OPTIONS.map((opt) => {
              const checked = audience.includes(opt.key);
              const count = opt.key === 'specific' ? preselectedEmails.length : (audienceCounts[opt.key] ?? 0);
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleAudience(opt.key)} className="w-4 h-4 accent-primary rounded" />
                  <div className="flex items-center justify-between flex-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className={checked ? 'text-primary' : 'text-gray-400'} />
                      <span className={`text-sm font-bold font-montserrat ${checked ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-montserrat ${checked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {countsLoading && opt.key !== 'specific' ? '...' : count.toLocaleString()}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Category tree — shown when categories is checked */}
          {audience.includes('categories') && (
            <div className="mt-4 border border-primary/20 rounded-lg p-4 bg-primary/5">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wide font-montserrat mb-3">
                Select Categories to Target
              </p>
              {catTreeLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2"><Loader2 size={13} className="animate-spin" /> Loading categories...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {mainCategories.map(cat => {
                      const catName = cat.title || cat.categorytitle || '';
                      const subs = subsByMainCat[cat.id] || [];
                      const isExpanded = expandedMainCats[cat.id];
                      const isChecked = selectedCategoryFilters.includes(catName);
                      return (
                        <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <div className="flex items-center justify-between px-2.5 py-2 bg-gray-50">
                            <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                              <input type="checkbox" checked={isChecked} onChange={() => toggleCategoryFilter(catName)} className="accent-primary h-3 w-3 shrink-0" />
                              <span className="text-[11px] font-bold text-gray-700 truncate font-montserrat">{catName}</span>
                            </label>
                            {subs.length > 0 && (
                              <button onClick={() => setExpandedMainCats(p => ({ ...p, [cat.id]: !p[cat.id] }))} className="ml-1 text-gray-400 hover:text-primary shrink-0">
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            )}
                          </div>
                          {isExpanded && subs.length > 0 && (
                            <div className="px-2.5 py-2 border-t border-gray-100 space-y-1">
                              {subs.map(sub => {
                                const subName = sub.name || sub.subcategoryname || '';
                                return (
                                  <label key={sub.id} className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" checked={selectedCategoryFilters.includes(subName)} onChange={() => toggleCategoryFilter(subName)} className="accent-primary h-3 w-3 shrink-0" />
                                    <span className="text-[10px] text-gray-600 truncate font-montserrat">{subName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedCategoryFilters.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCategoryFilters.map(c => (
                        <span key={c} className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-montserrat">
                          {c}<button onClick={() => toggleCategoryFilter(c)} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
                        </span>
                      ))}
                      <button onClick={() => setSelectedCategoryFilters([])} className="text-[10px] text-red-500 font-bold font-montserrat hover:underline ml-1">Clear all</button>
                    </div>
                  )}
                  {selectedCategoryFilters.length === 0 && (
                    <p className="text-[10px] text-gray-400 font-montserrat mt-2">No categories selected — will send to all subscribers with any category.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Specific subscribers — manual input + preselected info */}
          {audience.includes('specific') && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <p className="text-[11px] font-bold text-primary font-montserrat">Type or paste email addresses (comma, semicolon, or new-line separated):</p>
              <textarea
                value={specificEmailsInput}
                onChange={(e) => setSpecificEmailsInput(e.target.value)}
                placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                rows={3}
                className="w-full border border-primary/30 rounded px-3 py-2 text-xs outline-none focus:border-primary font-mono resize-none bg-white"
              />
              {preselectedEmails.length > 0 && (
                <p className="text-[10px] text-gray-500 font-montserrat">
                  Also includes {preselectedEmails.length} pre-selected from the subscriber list.
                </p>
              )}
              {allSpecificEmails.length > 0 && (
                <p className="text-[10px] font-bold text-primary font-montserrat">
                  Total: {allSpecificEmails.length} unique email(s)
                </p>
              )}
            </div>
          )}

          {/* Total recipient count */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-montserrat">Total Recipients:</span>
            {countsLoading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-montserrat">{totalRecipients.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Subject Line */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">Subject Line</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. New Arrivals This Week at Bagchee!" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat" />
        </div>

        {/* Email Body Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">Content</label>
          <div className="border rounded-lg overflow-hidden">
            <JoditEditor ref={editor} value={body} config={editorConfig} onBlur={(newContent) => setBody(newContent)} />
          </div>
        </div>

        {/* Preview */}
        {(subject || body) && (
          <div className="mb-4">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 text-sm text-primary font-bold font-montserrat border border-primary/30 bg-primary/5 px-5 py-2.5 rounded-lg hover:bg-primary/10 transition-all"
            >
              <Eye size={15} /> Preview Email Before Sending
            </button>
          </div>
        )}

        {/* Send At */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">
            <Clock size={13} className="inline mr-1 -mt-0.5" /> Send At (Optional — leave empty to send immediately)
          </label>
          <div className="flex items-center gap-3">
            <input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} min={getMinDateTime()} className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat" />
            {sendAt && (<button onClick={() => setSendAt('')} className="text-xs text-red-500 hover:text-red-700 font-montserrat font-bold">Clear</button>)}
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block font-montserrat">
            <FlaskConical size={13} className="inline mr-1 -mt-0.5" /> Test Email
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Send a preview to yourself before sending to all recipients</p>
          <div className="flex items-center gap-3">
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Test email address" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat" />
            <button onClick={handleSendTest} disabled={testLoading} className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-sm">
              {testLoading ? (<><Loader2 size={14} className="animate-spin" /> Sending...</>) : (<><FlaskConical size={14} /> Send Test</>)}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg shadow-md font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (<><Loader2 size={16} className="animate-spin" /> {sendAt ? 'Scheduling...' : 'Sending...'}</>) : sendAt ? (<><Clock size={16} /> Schedule Campaign</>) : (<><Send size={16} /> Send Campaign</>)}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={!subject && !body}
            className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-40 active:scale-95"
          >
            <Eye size={15} /> Preview
          </button>
          <button onClick={() => navigate('/admin/newsletter-subs')} className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95">Cancel</button>
        </div>

        {/* Scheduled Emails Table */}
        {scheduledEmails.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-8">
            <h2 className="text-sm font-bold text-gray-700 font-montserrat mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Scheduled & Recent Campaigns
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Subject</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Send At</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Status</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat">Result</th>
                    <th className="pb-2 font-bold text-gray-500 text-xs uppercase font-montserrat"></th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledEmails.map((email) => (
                    <tr key={email.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-montserrat text-gray-700 max-w-[200px] truncate">{email.subject}</td>
                      <td className="py-3 pr-4 font-montserrat text-gray-500 text-xs whitespace-nowrap">{new Date(email.sendAt).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full font-montserrat ${statusColors[email.status] || 'bg-gray-100 text-gray-500'}`}>{email.status}</span>
                      </td>
                      <td className="py-3 pr-4 font-montserrat text-xs text-gray-500">{email.status === 'sent' ? `${email.sent} sent, ${email.failed} failed` : '-'}</td>
                      <td className="py-3">
                        {email.status === 'pending' && (
                          <button onClick={() => handleCancelScheduled(email.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Cancel"><Trash2 size={15} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ─────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-gray-700 font-montserrat">Email Preview</h3>
                {subject && <p className="text-xs text-gray-500 font-montserrat mt-0.5">Subject: <strong>{subject}</strong></p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-400 font-montserrat">
                  To: ~{totalRecipients.toLocaleString()} recipient{totalRecipients !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getFullEmailHtml(subject, body));
                    toast.success('Full HTML copied to clipboard!');
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1.5 rounded font-montserrat font-bold text-xs flex items-center gap-1.5 hover:bg-gray-200 transition-all"
                >
                  Copy HTML
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-montserrat font-bold text-xs flex items-center gap-2 hover:bg-primary-hover disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {sendAt ? 'Schedule' : 'Send Now'}
                </button>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-xl">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <iframe
                  title="Email Preview"
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#F7EEDD;">${body || '<p style="padding:40px;color:#999;text-align:center;font-family:sans-serif;">No content yet</p>'}</body></html>`}
                  className="w-full"
                  style={{ height: '500px', border: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendEmail;
