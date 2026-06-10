import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Users, Mail, Loader2, ArrowLeft, FileText, FlaskConical, Clock,
  Trash2, Package, X, PlusCircle, Eye, ChevronDown, ChevronUp,
  Plus, Image, Tag, Search
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import { dedupeByTitle } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../../utils/imageUrl';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://www.bagchee.com';

// ─── Template Definitions ────────────────────────────────────────────────────
const STRUCTURED_TEMPLATES = {
  'single-book': {
    name: 'Single Book Highlight',
    description: '1 featured book + synopsis + 4 "You May Also Like" books',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'Book of the Month' },
      { key: 'subHeading', label: 'Sub Heading', default: 'Our Top Pick This Month' },
      { key: 'description', label: 'Synopsis (4-6 lines from book page)', default: '', multiline: true },
      { key: 'youMayAlsoLikeHeading', label: '"You May Also Like" Heading', default: 'You May Also Like' },
    ],
    bookSlots: [
      { key: 'book1', label: 'Featured Book' },
      { key: 'book2', label: 'You May Also Like — Book 1' },
      { key: 'book3', label: 'You May Also Like — Book 2' },
      { key: 'book4', label: 'You May Also Like — Book 3' },
      { key: 'book5', label: 'You May Also Like — Book 4' },
    ],
    maxBanners: 2,
  },
  'new-arrivals': {
    name: 'Category New Arrivals',
    description: '1–2 highlights + 14 books in 2-column grid + editable CTA',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'New Arrivals' },
      { key: 'categoryName', label: 'Category Name', default: '' },
      { key: 'subHeading', label: 'Second-tier Heading (optional, e.g. "New & Noteworthy")', default: '' },
      { key: 'introText', label: 'Intro Text (optional)', default: '', multiline: true },
      { key: 'ctaText', label: 'Bottom Button Text', default: 'Browse All New Arrivals →' },
      { key: 'ctaUrl', label: 'Bottom Button Link (URL)', default: `${FRONTEND_URL}/new-arrivals` },
    ],
    bookSlots: [
      { key: 'highlight1', label: 'Highlight Book 1 (top — larger)' },
      { key: 'highlight2', label: 'Highlight Book 2 (leave blank for single-highlight mode)' },
      { key: 'book1', label: 'Book 1' }, { key: 'book2', label: 'Book 2' },
      { key: 'book3', label: 'Book 3' }, { key: 'book4', label: 'Book 4' },
      { key: 'book5', label: 'Book 5' }, { key: 'book6', label: 'Book 6' },
      { key: 'book7', label: 'Book 7' }, { key: 'book8', label: 'Book 8' },
      { key: 'book9', label: 'Book 9' }, { key: 'book10', label: 'Book 10' },
      { key: 'book11', label: 'Book 11' }, { key: 'book12', label: 'Book 12' },
      { key: 'book13', label: 'Book 13' }, { key: 'book14', label: 'Book 14' },
    ],
    maxBanners: 2,
  },
  'curated-picks': {
    name: 'Curated Collection',
    description: '8 books in 2×4 grid + editable CTA button',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: "Editor's Picks" },
      { key: 'subHeading', label: 'Sub Heading', default: 'Handpicked for you' },
      { key: 'introText', label: 'Intro Text (optional)', default: '', multiline: true },
      { key: 'ctaText', label: 'Bottom Button Text (leave blank to hide)', default: 'See More Recommended Books' },
      { key: 'ctaUrl', label: 'Bottom Button Link (URL)', default: `${FRONTEND_URL}/recommended` },
    ],
    bookSlots: [
      { key: 'book1', label: 'Book 1' }, { key: 'book2', label: 'Book 2' },
      { key: 'book3', label: 'Book 3' }, { key: 'book4', label: 'Book 4' },
      { key: 'book5', label: 'Book 5' }, { key: 'book6', label: 'Book 6' },
      { key: 'book7', label: 'Book 7' }, { key: 'book8', label: 'Book 8' },
    ],
    maxBanners: 2,
  },
  'weekly-digest': {
    name: 'Weekly Digest',
    description: '8 featured books with intro & outro',
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
      { key: 'book6', label: "Editor's Pick 6" },
      { key: 'book7', label: "Editor's Pick 7" },
      { key: 'book8', label: "Editor's Pick 8" },
    ],
    maxBanners: 2,
  },
  'monthly-digest': {
    name: 'Monthly Digest',
    description: '1 featured highlight + up to 20 books + editable CTA',
    headings: [
      { key: 'mainHeading', label: 'Main Heading', default: 'Monthly Book Digest' },
      { key: 'subHeading', label: 'Sub Heading', default: 'Your monthly picks from Bagchee' },
      { key: 'greeting', label: 'Greeting', default: 'Dear Reader,' },
      { key: 'introText', label: 'Intro Text', default: "Here are our hand-picked books this month.", multiline: true },
      { key: 'outroText', label: 'Closing Message', default: 'Happy reading!\nThe Bagchee Team', multiline: true },
      { key: 'ctaText', label: 'Bottom Button Text (leave blank to hide)', default: 'See More Recommended Books' },
      { key: 'ctaUrl', label: 'Bottom Button Link (URL)', default: `${FRONTEND_URL}/recommended` },
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
// Convert textarea newlines into email-safe line breaks (a blank line = paragraph gap).
const nl2br = (text) => String(text || '').replace(/\r\n/g, '\n').replace(/\n/g, '<br/>');

const buildBannerHtml = (banner, compact = false) => {
  if (!banner) return '';
  if (banner.type === 'promo' && banner.promoData) {
    return buildStandardPromoHtml(banner.promoData, compact);
  }
  if (banner.type === 'coupon') {
    return `<div style="background:${banner.bgColor || '#FFD700'};border-radius:10px;padding:${compact ? '12px 22px' : '20px 30px'};text-align:center;margin:16px 0;">
  <p style="font-size:${compact ? '12px' : '14px'};color:#0B2F3A;margin:0 0 8px;font-weight:600;">${banner.text || ''}</p>
  ${banner.code ? `<p style="display:inline-block;font-size:${compact ? '20px' : '26px'};font-weight:800;color:#0B2F3A;letter-spacing:3px;margin:0;background:#fff;padding:${compact ? '4px 14px' : '6px 20px'};border-radius:6px;">${banner.code}</p>` : ''}
</div>`;
  }
  return banner.imageUrl ? `<div style="margin:16px 0;text-align:center;">
  <a href="${banner.link || '#'}" target="_blank">
    <img src="${banner.imageUrl}" alt="Banner" style="max-width:100%;${compact ? 'max-height:90px;' : ''}border-radius:8px;display:block;margin:0 auto;object-fit:cover;" />
  </a>
</div>` : '';
};

// Newsletters are ONE email blasted to all subscribers (no per-recipient geo),
// so prices must ALWAYS be in USD — never the India-only `inrPrice`. Show the
// final selling price (realPrice when it's a genuine discount), else list price.
const bookUsdPrice = (book) => {
  if (!book) return '';
  const listN = Number(book.price) || 0;
  const realRaw = book.realPrice ?? book.real_price;
  const realN = Number(realRaw) || 0;
  const useReal = realN > 0 && (listN === 0 || realN < listN);
  const val = useReal ? realRaw : book.price;
  return (Number(val) || 0) > 0 ? `$${val}` : '';
};

const buildBookCardSmall = (book) => {
  if (!book) return `<td style="width:50%;padding:6px;vertical-align:top;"><div style="background:#f5f5f5;border-radius:6px;padding:20px;text-align:center;min-height:80px;"><p style="color:#aaa;font-size:11px;margin:0;">No book</p></div></td>`;
  const img = getProductImageUrl(book);
  const price = bookUsdPrice(book);
  return `<td style="width:50%;padding:6px;vertical-align:top;">
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e6decd;border-radius:6px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr><td style="padding:10px;text-align:center;background:#fafaf8;">
    ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="80" style="display:block;margin:0 auto;border-radius:4px;max-height:100px;object-fit:cover;" /></a>` : '<div style="height:80px;"></div>'}
  </td></tr>
  <tr><td style="padding:8px 10px;">
    <p style="font-size:12px;font-weight:700;color:#0B2F3A;margin:0 0 4px;line-height:1.3;">${book.title}</p>
    ${price ? `<p style="font-size:13px;font-weight:700;color:#008DDA;margin:0 0 8px;">${price}</p>` : ''}
    <a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:5px 10px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:bold;display:inline-block;">View →</a>
  </td></tr>
</table>
</td>`;
};

const buildBookCardLarge = (book) => {
  if (!book) return `<div style="background:#f5f5f5;border-radius:8px;padding:30px;text-align:center;max-width:520px;margin:0 auto;"><p style="color:#aaa;font-size:13px;margin:0;">No book selected</p></div>`;
  const img = getProductImageUrl(book);
  const price = bookUsdPrice(book);
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;margin:20px auto;border:1px solid #e6decd;border-radius:10px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="width:140px;padding:20px;background:#fafaf8;vertical-align:top;">
      ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="120" style="display:block;border-radius:6px;max-height:160px;object-fit:cover;" /></a>` : ''}
    </td>
    <td style="padding:20px;vertical-align:top;">
      <p style="font-size:18px;font-weight:700;color:#0B2F3A;margin:0 0 8px;line-height:1.3;">${book.title}</p>
      <p style="font-size:12px;color:#4A6fa5;font-family:monospace;margin:0 0 6px;">ID: ${book.bagcheeId}</p>
      ${price ? `<p style="font-size:16px;font-weight:700;color:#008DDA;margin:0 0 16px;">${price}</p>` : '<div style="height:16px;"></div>'}
      <a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">View Book →</a>
    </td>
  </tr>
</table>`;
};

const buildBookCardSingleHighlight = (book) => {
  if (!book) return '';
  const img = getProductImageUrl(book);
  const price = bookUsdPrice(book);
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;margin:0 auto 16px;border:2px solid #008DDA;border-radius:10px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="width:160px;padding:24px;background:#EBF7FD;text-align:center;vertical-align:top;">
      ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="130" style="display:block;margin:0 auto;border-radius:6px;width:130px;max-width:100%;height:auto;" /></a>` : '<div style="height:150px;"></div>'}
    </td>
    <td style="padding:24px;vertical-align:middle;">
      <p style="font-size:20px;font-weight:700;color:#0B2F3A;margin:0 0 8px;line-height:1.3;">${book.title}</p>
      ${price ? `<p style="font-size:17px;font-weight:700;color:#008DDA;margin:0 0 18px;">${price}</p>` : '<div style="height:18px;"></div>'}
      <a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">View Book →</a>
    </td>
  </tr>
</table>`;
};

const buildBookCardHighlight = (book) => {
  if (!book) return `<td style="width:50%;padding:8px;vertical-align:top;"><div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;min-height:100px;"><p style="color:#aaa;font-size:11px;margin:0;">No book</p></div></td>`;
  const img = getProductImageUrl(book);
  const price = bookUsdPrice(book);
  return `<td style="width:50%;padding:8px;vertical-align:top;">
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:2px solid #008DDA;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr><td style="padding:14px;text-align:center;background:#EBF7FD;">
    ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="100" style="display:block;margin:0 auto;border-radius:4px;max-height:140px;object-fit:cover;" /></a>` : '<div style="height:100px;"></div>'}
  </td></tr>
  <tr><td style="padding:10px 12px;">
    <p style="font-size:14px;font-weight:700;color:#0B2F3A;margin:0 0 4px;line-height:1.3;">${book.title}</p>
    ${price ? `<p style="font-size:14px;font-weight:700;color:#008DDA;margin:0 0 10px;">${price}</p>` : ''}
    <a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:7px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:bold;display:inline-block;">View →</a>
  </td></tr>
</table>
</td>`;
};

const buildBookCardDigest = (book) => {
  if (!book) return '';
  const img = getProductImageUrl(book);
  const price = bookUsdPrice(book);
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:16px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="width:80px;padding:12px;background:#fafaf8;vertical-align:top;">
      ${img ? `<a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank"><img src="${img}" alt="${book.title}" width="60" style="display:block;border-radius:4px;" /></a>` : ''}
    </td>
    <td style="padding:12px;vertical-align:top;">
      <p style="font-size:15px;font-weight:700;color:#0B2F3A;margin:0 0 4px;">${book.title}</p>
      ${price ? `<p style="font-size:14px;font-weight:700;color:#008DDA;margin:0 0 8px;">${price}</p>` : ''}
      <a href="${FRONTEND_URL}/books/${book.bagcheeId}/${book.slug || book.bagcheeId}" target="_blank" style="background:#008DDA;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:bold;">View →</a>
    </td>
  </tr>
</table>`;
};

const generateTemplateHtml = (templateType, headings, books, banners) => {
  const h = headings;
  let topBanner = '';
  let bottomBanner = '';
  if (banners.length === 1) {
    if (banners[0].position === 'bottom') {
      bottomBanner = buildBannerHtml(banners[0], false);
    } else {
      topBanner = buildBannerHtml(banners[0], true);
    }
  } else {
    topBanner = banners[0] ? buildBannerHtml(banners[0], true) : '';
    bottomBanner = banners[1] ? buildBannerHtml(banners[1], false) : '';
  }

  const buildCtaButton = (text, url) => {
    if (!text) return '';
    return `<div style="text-align:center;margin:24px 0;">
  <a href="${url || '#'}" target="_blank" style="background:#008DDA;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">${text}</a>
</div>`;
  };

  if (templateType === 'single-book') {
    const youMayAlsoLikeSlots = ['book2','book3','book4','book5'];
    const youMayAlsoLikeBooks = youMayAlsoLikeSlots.filter(k => books[k]);
    let youMayAlsoLikeRows = '';
    for (let i = 0; i < youMayAlsoLikeBooks.length; i += 2) {
      youMayAlsoLikeRows += `<tr>${buildBookCardSmall(books[youMayAlsoLikeBooks[i]])}${youMayAlsoLikeBooks[i+1] ? buildBookCardSmall(books[youMayAlsoLikeBooks[i+1]]) : '<td style="width:50%;padding:6px;"></td>'}</tr>`;
    }
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0B2F3A;">
  ${topBanner}
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 8px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:16px;margin:0 0 20px;">${h.subHeading}</p>` : ''}
  ${buildBookCardSingleHighlight(books.book1)}
  ${h.description ? `<div style="border-left:3px solid #008DDA;padding:12px 16px;margin:20px 0;background:#f9fbff;border-radius:0 6px 6px 0;"><p style="color:#444;font-size:14px;line-height:1.8;margin:0;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;">${h.description}</p></div>` : ''}
  ${youMayAlsoLikeRows ? `<h2 style="text-align:center;color:#0B2F3A;font-size:20px;margin:24px 0 12px;border-bottom:2px solid #e6decd;padding-bottom:10px;">${h.youMayAlsoLikeHeading || 'You May Also Like'}</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%;">${youMayAlsoLikeRows}</table>` : ''}
  ${bottomBanner}
</div>`;
  }

  if (templateType === 'new-arrivals') {
    const slots = ['book1','book2','book3','book4','book5','book6','book7','book8','book9','book10','book11','book12','book13','book14'];
    let rows = '';
    for (let i = 0; i < slots.length; i += 2) {
      const l = books[slots[i]]; const r = books[slots[i+1]];
      if (!l && !r) continue;
      rows += `<tr>${buildBookCardSmall(l)}${buildBookCardSmall(r)}</tr>`;
    }
    const onlyOneHighlight = books.highlight1 && !books.highlight2;
    const hasBothHighlights = books.highlight1 && books.highlight2;
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${topBanner}
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 6px;">${h.mainHeading}</h1>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">${nl2br(h.introText)}</p>` : ''}
  ${h.categoryName ? `<p style="text-align:center;color:#008DDA;font-size:22px;font-weight:800;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">${h.categoryName}</p>` : ''}
  ${onlyOneHighlight ? buildBookCardSingleHighlight(books.highlight1) : ''}
  ${hasBothHighlights ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:16px;"><tr>${buildBookCardHighlight(books.highlight1)}${buildBookCardHighlight(books.highlight2)}</tr></table>` : ''}
  ${(h.subHeading && rows) ? `<h2 style="text-align:center;color:#0B2F3A;font-size:22px;font-weight:700;margin:28px 0 14px;">${h.subHeading}</h2>` : ''}
  ${rows ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>` : ''}
  ${buildCtaButton(h.ctaText || 'Browse All New Arrivals →', h.ctaUrl || `${FRONTEND_URL}/new-arrivals`)}
  ${bottomBanner}
</div>`;
  }

  if (templateType === 'curated-picks') {
    const slots = ['book1','book2','book3','book4','book5','book6','book7','book8'];
    let rows = '';
    for (let i = 0; i < slots.length; i += 2) {
      const l = books[slots[i]]; const r = books[slots[i+1]];
      if (!l && !r) continue;
      rows += `<tr>${buildBookCardSmall(l)}${buildBookCardSmall(r)}</tr>`;
    }
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${topBanner}
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:26px;margin:0 0 6px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:15px;margin:0 0 8px;">${h.subHeading}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">${nl2br(h.introText)}</p>` : ''}
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>
  ${buildCtaButton(h.ctaText, h.ctaUrl)}
  ${bottomBanner}
</div>`;
  }

  if (templateType === 'weekly-digest') {
    const slots = ['book1','book2','book3','book4','book5','book6','book7','book8'];
    const booksHtml = slots.filter(k => books[k]).map(k => buildBookCardDigest(books[k])).join('');
    return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
  ${topBanner}
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:26px;margin:0 0 20px;">${h.mainHeading}</h1>` : ''}
  ${h.greeting ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">${h.greeting}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${nl2br(h.introText)}</p>` : ''}
  ${booksHtml}
  ${h.outroText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:16px 0 0;">${h.outroText.replace(/\n/g, '<br/>')}</p>` : ''}
  ${bottomBanner}
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
  ${topBanner}
  ${h.mainHeading ? `<h1 style="text-align:center;color:#0B2F3A;font-size:28px;margin:0 0 8px;">${h.mainHeading}</h1>` : ''}
  ${h.subHeading ? `<p style="text-align:center;color:#666;font-size:16px;margin:0 0 16px;">${h.subHeading}</p>` : ''}
  ${h.greeting ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">${h.greeting}</p>` : ''}
  ${h.introText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${nl2br(h.introText)}</p>` : ''}
  ${books.featured ? buildBookCardLarge(books.featured) : ''}
  ${rows ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:20px;">${rows}</table>` : ''}
  ${h.outroText ? `<p style="color:#555;font-size:14px;line-height:1.7;margin:24px 0 0;">${h.outroText.replace(/\n/g, '<br/>')}</p>` : ''}
  ${buildCtaButton(h.ctaText, h.ctaUrl)}
  ${bottomBanner}
</div>`;
  }

  return '';
};

// ─── Pre-built HTML Templates (kept as-is) ────────────────────────────────────
const EMAIL_TEMPLATES = [
  { name: 'Blank', subject: '', body: '' },
  { name: 'Coupon / Promo Code', subject: 'Exclusive Offer Just for You!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:5px;">MEMBER ONLY <span style="color:#e53935;">OFFER</span></h1><div style="background:#e53935;border-radius:12px;padding:30px;margin:20px auto;max-width:480px;color:#fff;"><p style="font-size:22px;font-weight:bold;margin:0;">CELEBRATE</p><p style="font-size:16px;margin:5px 0;">our new collection and get</p><p style="font-size:52px;font-weight:bold;margin:10px 0;font-style:italic;">10% off</p><p style="font-size:16px;margin-top:15px;">Use promo code</p><p style="display:inline-block;border:2px dashed #fff;padding:8px 24px;font-size:24px;font-weight:bold;letter-spacing:3px;margin:8px 0;">BAGCHEE10</p><p style="font-size:16px;margin-top:8px;">at checkout</p></div><p style="color:#666;font-size:13px;margin-top:15px;">Valid for a limited time only.</p><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:22px 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table></div>` },
  { name: 'New Arrivals', subject: 'New Arrivals This Week at Bagchee!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:10px;">New Arrivals</h1><p style="color:#666;font-size:15px;line-height:1.6;max-width:480px;margin:0 auto 25px;">Discover our latest collection of handpicked Indian books.</p><div style="margin-top:25px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Browse New Arrivals</a></div><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:22px 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table></div>` },
  { name: 'Sale / Discount', subject: 'Sale Today - Up to 25% Off at Bagchee!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#e53935;font-size:36px;font-weight:bold;margin-bottom:5px;">SALE TODAY</h1><p style="color:#0B2F3A;font-size:20px;margin:0 0 20px;">Up to <strong>25% OFF</strong> on selected titles</p><div style="background:linear-gradient(135deg,#e53935,#c62828);border-radius:12px;padding:30px;margin:0 auto;max-width:480px;color:#fff;"><p style="font-size:48px;font-weight:bold;margin:0;">25% OFF</p><p style="font-size:16px;margin:10px 0 0;">on hundreds of books</p></div><div style="margin-top:25px;"><a href="${FRONTEND_URL}/sale" style="display:inline-block;background:#e53935;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Shop the Sale</a></div><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:22px 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table></div>` },
  { name: 'Membership', subject: 'Join Bagchee Membership - Save 10% Every Day!', body: `<div style="text-align:center;padding:20px 0;"><h1 style="color:#0B2F3A;font-size:28px;margin-bottom:10px;">Bagchee Membership</h1><div style="background:#008DDA;border-radius:12px;padding:30px;margin:0 auto;max-width:480px;color:#fff;"><p style="font-size:42px;font-weight:bold;margin:0;">10% OFF</p><p style="font-size:18px;margin:8px 0;">on every order, every day</p></div><div style="margin-top:25px;"><a href="${FRONTEND_URL}/membership" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:bold;border-radius:8px;">Become a Member</a></div><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:22px 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table></div>` },
  { name: 'New Site Announcement, v2', subject: 'Welcome to the New Bagchee — Explore, Shop & Save 15% Today! 🎉', body: `<div style="background:#0B2F3A;text-align:center;padding:9px 20px;border-radius:6px;margin:0 0 22px;"><p style="color:#ffffff;font-size:12px;font-weight:700;margin:0;">&#127881; Celebrate our New site with us and get <span style="color:#fbbf24;">15% off</span></p></div><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="width:52%;vertical-align:middle;padding-right:16px;"><h1 style="font-size:30px;font-weight:900;color:#0B2F3A;margin:0 0 6px;line-height:1.15;">Welcome to<br><span style="color:#008DDA;">BAGCHEE!</span></h1><p style="font-size:12px;color:#6b7280;margin:0 0 14px;line-height:1.5;">Your ultimate destination for books that inspire, educate and entertain</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="text-align:center;width:25%;vertical-align:top;padding:2px;"><div style="font-size:16px;">&#128218;</div><p style="font-size:9px;color:#374151;margin:2px 0 0;font-weight:600;line-height:1.3;">Wide range<br>of books</p></td><td style="text-align:center;width:25%;vertical-align:top;padding:2px;"><div style="font-size:16px;">&#11088;</div><p style="font-size:9px;color:#374151;margin:2px 0 0;font-weight:600;line-height:1.3;">Curated<br>collections</p></td><td style="text-align:center;width:25%;vertical-align:top;padding:2px;"><div style="font-size:16px;">&#128666;</div><p style="font-size:9px;color:#374151;margin:2px 0 0;font-weight:600;line-height:1.3;">Free<br>shipping</p></td><td style="text-align:center;width:25%;vertical-align:top;padding:2px;"><div style="font-size:16px;">&#127873;</div><p style="font-size:9px;color:#374151;margin:2px 0 0;font-weight:600;line-height:1.3;">E-Gift<br>Card</p></td></tr></table><a href="${FRONTEND_URL}" style="display:inline-block;background:#0B2F3A;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:700;font-size:12px;letter-spacing:0.05em;">EXPLORE BOOKS</a></td><td style="width:48%;vertical-align:top;"><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721663/bagchee/newsletter-screenshots/search.png" alt="Bagchee Website" style="width:100%;border-radius:8px;display:block;border:1px solid #e5e7eb;" /></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td width="38%" style="padding:0 4px 0 0;vertical-align:top;"><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721663/bagchee/newsletter-screenshots/search.png" alt="Bagchee" style="width:100%;border-radius:8px;display:block;border:1px solid #e5e7eb;" /></td><td width="30%" style="padding:0 4px;vertical-align:top;"><div style="background:linear-gradient(135deg,#e53935,#c62828);border-radius:8px;padding:16px 10px;text-align:center;"><p style="color:#ffffff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 2px;">SALE</p><p style="color:#ffffff;font-size:10px;margin:0 0 2px;">Save upto 60%</p><p style="color:#fbbf24;font-size:32px;font-weight:900;margin:0;line-height:1.1;">$100</p><p style="color:#ffcdd2;font-size:9px;margin:4px 0 12px;">off on selected titles</p><a href="${FRONTEND_URL}/sale" style="display:inline-block;background:#ffffff;color:#c62828;text-decoration:none;padding:5px 12px;border-radius:4px;font-weight:700;font-size:10px;">SHOP SALE</a></div></td><td width="32%" style="padding:0 0 0 4px;vertical-align:top;"><div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:8px;padding:12px 8px;text-align:center;border:1px solid #bfdbfe;margin-bottom:8px;"><p style="color:#1e40af;font-size:10px;font-weight:700;margin:0 0 4px;">&#127873; E-GIFT CARDS</p><p style="color:#1e40af;font-size:26px;font-weight:900;margin:0;line-height:1.1;">$100</p><p style="color:#6b7280;font-size:9px;margin:3px 0 10px;">Send joy to a reader</p><a href="${FRONTEND_URL}/e-giftcard" style="display:inline-block;background:#008DDA;color:#ffffff;text-decoration:none;padding:5px 10px;border-radius:4px;font-weight:700;font-size:10px;">BUY NOW</a></div><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721667/bagchee/newsletter-screenshots/mobile.png" alt="Mobile" style="width:100%;border-radius:8px;display:block;border:1px solid #e5e7eb;" /></td></tr></table><div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:10px;padding:22px 20px;text-align:center;margin:0 0 22px;"><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#92400e;letter-spacing:0.12em;margin:0 0 6px;">&#11088; YOUR EXCLUSIVE OFFER</p><p style="font-size:20px;font-weight:900;color:#0B2F3A;margin:0 0 14px;">Enjoy 15% OFF on your next order!</p><p style="font-size:10px;color:#6b7280;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">PROMO CODE</p><div style="display:inline-block;background:#ffffff;border:2px dashed #f59e0b;border-radius:8px;padding:7px 26px;margin-bottom:14px;"><span style="font-size:26px;font-weight:900;color:#0B2F3A;letter-spacing:0.2em;font-family:monospace;">BAGCHEE15</span></div><br><a href="${FRONTEND_URL}" style="display:inline-block;background:#008DDA;color:#ffffff;text-decoration:none;padding:11px 34px;border-radius:6px;font-weight:700;font-size:13px;letter-spacing:0.05em;">SHOP NOW &#8594;</a></div><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:0 0 12px;">WHY SHOP WITH US</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="font-size:22px;margin-bottom:5px;">&#127760;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">WORLDWIDE<br>DELIVERY</p><p style="font-size:10px;color:#6b7280;margin:0;">Free shipping on orders over $50</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="font-size:22px;margin-bottom:5px;">&#128081;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">MEMBER<br>BENEFITS</p><p style="font-size:10px;color:#6b7280;margin:0;">Extra 10% on all purchases</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="font-size:22px;margin-bottom:5px;">&#128274;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">SECURE<br>CHECKOUT</p><p style="font-size:10px;color:#6b7280;margin:0;">100% trusted payment options</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="font-size:22px;margin-bottom:5px;">&#128172;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">CUSTOMER<br>SUPPORT</p><p style="font-size:10px;color:#6b7280;margin:0;">We&rsquo;re here to help anytime</p></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;"><tr><td style="padding:22px;width:55%;vertical-align:top;background:#f8fafc;"><p style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:0.1em;margin:0 0 5px;">BECOME A MEMBER</p><h3 style="font-size:16px;font-weight:900;color:#0B2F3A;margin:0 0 10px;">Become a member and get&hellip;</h3><p style="font-size:12px;color:#374151;margin:0 0 5px;">&#10003;&nbsp; Extra 10% Discount on all orders</p><p style="font-size:12px;color:#374151;margin:0 0 5px;">&#10003;&nbsp; Early Access to Sales</p><p style="font-size:12px;color:#374151;margin:0 0 16px;">&#10003;&nbsp; Full Access to Sale Items</p><a href="${FRONTEND_URL}/membership" style="display:inline-block;background:#f59e0b;color:#0B2F3A;text-decoration:none;padding:9px 20px;border-radius:6px;font-weight:800;font-size:11px;">GET MEMBERSHIP &#8594;</a></td><td style="padding:22px;width:45%;text-align:center;background:#eff6ff;vertical-align:middle;"><p style="font-size:12px;color:#6b7280;margin:0 0 2px;">Members Save</p><p style="font-size:38px;font-weight:900;color:#008DDA;margin:0;line-height:1.1;">10% EXTRA</p><p style="font-size:12px;color:#6b7280;margin:3px 0 12px;">On Every Order!</p><div style="font-size:40px;">&#127873;</div></td></tr></table><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:0 0 12px;">HOW IT WORKS</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="width:42px;height:42px;background:#eff6ff;border-radius:50%;margin:0 auto 7px;font-size:18px;line-height:42px;">&#128269;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">EXPLORE</p><p style="font-size:10px;color:#6b7280;margin:0;">Browse thousands of books</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="width:42px;height:42px;background:#f0fdf4;border-radius:50%;margin:0 auto 7px;font-size:18px;line-height:42px;">&#128722;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">CHOOSE</p><p style="font-size:10px;color:#6b7280;margin:0;">Add your books to cart</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="width:42px;height:42px;background:#fff7ed;border-radius:50%;margin:0 auto 7px;font-size:18px;line-height:42px;">&#128666;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">FAST DELIVERY</p><p style="font-size:10px;color:#6b7280;margin:0;">We deliver to your doorstep</p></td><td style="text-align:center;padding:8px 4px;width:25%;vertical-align:top;"><div style="width:42px;height:42px;background:#fdf4ff;border-radius:50%;margin:0 auto 7px;font-size:18px;line-height:42px;">&#128218;</div><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 3px;text-transform:uppercase;">ENJOY READING</p><p style="font-size:10px;color:#6b7280;margin:0;">Start your reading journey</p></td></tr></table><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:0 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 22px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table><div style="border-top:1px solid #e5e7eb;margin:0 0 18px;"></div><div style="text-align:center;padding:6px 0 4px;"><p style="font-size:15px;font-weight:800;color:#0B2F3A;margin:0 0 6px;">Your Trust, Our Priority</p><p style="font-size:13px;color:#6b7280;margin:0 0 18px;line-height:1.6;">Shop from a trusted destination for book lovers worldwide.</p><a href="${FRONTEND_URL}" style="display:inline-block;background:#008DDA;color:#ffffff;text-decoration:none;padding:13px 42px;font-size:14px;font-weight:700;border-radius:8px;letter-spacing:0.04em;">SHOP NOW &#8594;</a></div><div style="border-top:1px solid #e5e7eb;margin:20px 0 0;padding:16px 0 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:33%;padding-right:8px;"><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 7px;text-transform:uppercase;">QUICK LINKS</p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/new-arrivals" style="font-size:10px;color:#6b7280;text-decoration:none;">New Arrivals</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/best-sellers" style="font-size:10px;color:#6b7280;text-decoration:none;">Best Sellers</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/sale" style="font-size:10px;color:#6b7280;text-decoration:none;">Sale</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/e-giftcard" style="font-size:10px;color:#6b7280;text-decoration:none;">E-Gift Cards</a></p></td><td style="vertical-align:top;width:33%;padding-right:8px;"><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 7px;text-transform:uppercase;">HELP &amp; SUPPORT</p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/track-order" style="font-size:10px;color:#6b7280;text-decoration:none;">Track Order</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/faq" style="font-size:10px;color:#6b7280;text-decoration:none;">FAQs</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/contact-us" style="font-size:10px;color:#6b7280;text-decoration:none;">Contact Us</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/privacy-policy" style="font-size:10px;color:#6b7280;text-decoration:none;">Privacy Policy</a></p></td><td style="vertical-align:top;width:33%;"><p style="font-size:10px;font-weight:800;color:#0B2F3A;margin:0 0 7px;text-transform:uppercase;">MY ACCOUNT</p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/login" style="font-size:10px;color:#6b7280;text-decoration:none;">Login</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/register" style="font-size:10px;color:#6b7280;text-decoration:none;">Register</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/membership" style="font-size:10px;color:#6b7280;text-decoration:none;">Membership</a></p><p style="margin:0 0 4px;"><a href="${FRONTEND_URL}/wishlist" style="font-size:10px;color:#6b7280;text-decoration:none;">Wishlist</a></p></td></tr></table><div style="text-align:center;margin-top:14px;"><a href="https://facebook.com/bagchee" style="display:inline-block;width:30px;height:30px;background:#1877f2;border-radius:50%;color:#fff;text-decoration:none;font-size:13px;font-weight:900;line-height:30px;margin:0 3px;text-align:center;">f</a><a href="https://instagram.com/bagchee" style="display:inline-block;width:30px;height:30px;background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%);border-radius:50%;color:#fff;text-decoration:none;font-size:13px;line-height:30px;margin:0 3px;text-align:center;">&#128247;</a><a href="https://twitter.com/bagchee" style="display:inline-block;width:30px;height:30px;background:#000;border-radius:50%;color:#fff;text-decoration:none;font-size:11px;font-weight:900;line-height:30px;margin:0 3px;text-align:center;">&#120143;</a><a href="https://youtube.com/bagchee" style="display:inline-block;width:30px;height:30px;background:#ff0000;border-radius:50%;color:#fff;text-decoration:none;font-size:13px;line-height:30px;margin:0 3px;text-align:center;">&#9654;</a><a href="https://wa.me/bagchee" style="display:inline-block;width:30px;height:30px;background:#25d366;border-radius:50%;color:#fff;text-decoration:none;font-size:13px;line-height:30px;margin:0 3px;text-align:center;">&#128172;</a></div></div>` },
  { name: 'New Site Announcement', subject: 'Welcome to the New Bagchee — Enjoy 15% Off to Celebrate! 🎉', body: `<div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border:2px solid #f59e0b;border-radius:10px;padding:20px;text-align:center;margin:0 0 28px;"><p style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">&#127881; Celebrate our New Site with us!</p><p style="color:#78350f;font-size:15px;margin:0 0 16px;line-height:1.6;">Experience the all-new Bagchee &mdash; faster, smarter and more beautiful than ever.</p><div style="display:inline-block;background:#ffffff;border:2px dashed #f59e0b;border-radius:8px;padding:10px 28px;"><p style="color:#6b7280;font-size:10px;margin:0 0 2px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Your 15% off promo code</p><p style="color:#0c2340;font-size:24px;font-weight:900;margin:0;letter-spacing:0.15em;font-family:monospace;">BAGCHEE15</p></div></div><p style="font-size:16px;font-weight:700;color:#0B2F3A;margin:0 0 8px;">Hello, Reader!</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 28px;">Our brand-new website is live! To celebrate, enjoy a special discount. Experience an easier, faster way to find your favourite books today.</p><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 6px;padding-bottom:10px;border-bottom:2px solid #f3f4f6;">NEW &amp; NOTABLE</p><p style="font-size:20px;font-weight:800;color:#0B2F3A;margin:0 0 22px;">What&rsquo;s new?</p><div style="margin:0 0 16px;border-left:3px solid #008DDA;padding:10px 14px;background:#f0f8ff;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#128269;&nbsp; New Search and Listing</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">Find exactly what you want with our advanced filters. Search by author, category, language, format and more.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721663/bagchee/newsletter-screenshots/search.png" alt="Search and Listing" style="width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" /></div><div style="margin:0 0 16px;border-left:3px solid #008DDA;padding:10px 14px;background:#f0f8ff;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#128218;&nbsp; Improved Product Page</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">Detailed descriptions and high-quality book previews. Table of contents, sample pages and related titles all in one place.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721664/bagchee/newsletter-screenshots/book-detail.png" alt="Product Page" style="width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" /></div><div style="margin:0 0 16px;border-left:3px solid #008DDA;padding:10px 14px;background:#f0f8ff;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#128179;&nbsp; Easy Checkout</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">Faster, secure, and seamless payment experience with PayPal and multiple trusted payment options worldwide.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721664/bagchee/newsletter-screenshots/new-arrivals.png" alt="Easy Checkout" style="width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" /></div><div style="margin:0 0 16px;border-left:3px solid #008DDA;padding:10px 14px;background:#f0f8ff;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#10084;&#65039;&nbsp; My Account</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">All your favourites, order history and tracking in one place. Manage your wishlist and addresses with ease.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721665/bagchee/newsletter-screenshots/my-account.png" alt="My Account" style="width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" /></div><div style="margin:0 0 16px;border-left:3px solid #008DDA;padding:10px 14px;background:#f0f8ff;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#127873;&nbsp; E-gift Cards</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">Perfect for gifting the joy of reading. Send a Bagchee e-gift card to anyone, anywhere in the world.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721666/bagchee/newsletter-screenshots/gift-card.png" alt="E-gift Cards" style="width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" /></div><div style="margin:0 0 28px;border-left:3px solid #f59e0b;padding:10px 14px;background:#fffbeb;border-radius:0 8px 8px 0;"><p style="font-size:14px;font-weight:800;color:#0B2F3A;margin:0 0 4px;">&#128241;&nbsp; Complete Mobile Friendly</p><p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.7;">Shop seamlessly on any device. Our new site is fully optimised for mobile &mdash; browse, buy and track orders on the go.</p><img src="https://res.cloudinary.com/dgmkcyrl7/image/upload/v1779721667/bagchee/newsletter-screenshots/mobile.png" alt="Mobile Friendly" style="width:100%;max-width:220px;border-radius:10px;display:block;margin:0 auto;border:1px solid #e5e7eb;" /></div><div style="border-top:1px solid #e5e7eb;margin:0 0 28px;"></div><div style="text-align:center;padding:8px 0 4px;"><p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-style:italic;font-weight:400;color:#0B2F3A;margin:0 0 10px;line-height:1.3;letter-spacing:-0.01em;">The story doesn&rsquo;t end here&hellip;</p><p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.7;">Experience the all-new Bagchee and uncover a world of unforgettable reads.</p><a href="${FRONTEND_URL}" target="_blank" style="display:inline-block;background-color:#008DDA;color:#ffffff;text-decoration:none;padding:14px 44px;font-size:15px;font-weight:700;border-radius:8px;letter-spacing:0.04em;">CONTINUE TO BAGCHEE.COM</a><p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;text-align:center;margin:22px 0 12px;">A PEEK INTO BAGCHEE</p><table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;"><tr><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/new-arrivals" style="display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127381;</p><p style="font-size:10px;font-weight:700;color:#1d4ed8;margin:0;">New Arrivals</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#11088;</p><p style="font-size:10px;font-weight:700;color:#15803d;margin:0;">Popular Titles</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/best-sellers" style="display:block;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#128293;</p><p style="font-size:10px;font-weight:700;color:#b45309;margin:0;">Bestsellers</p></a></td><td width="25%" style="padding:4px;"><a href="${FRONTEND_URL}/sale" style="display:block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;text-decoration:none;"><p style="font-size:18px;margin:0 0 4px;">&#127991;</p><p style="font-size:10px;font-weight:700;color:#b91c1c;margin:0;">Sale</p></a></td></tr></table></div>` },
];

const getFullEmailHtml = (subject, bodyHtml) => bodyHtml.trimStart().startsWith('<!DOCTYPE') ? bodyHtml : `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F7EEDD;">
<div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:#F7EEDD;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid #e6decd;">
    <div style="background-color:#008DDA;padding:30px 35px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr><td style="text-align:center;padding-bottom:6px;">
          <div style="display:inline-block;border:2px solid rgba(255,255,255,0.35);border-radius:8px;padding:5px 18px;">
            <span style="color:#FFFFFF;font-size:26px;font-weight:900;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Helvetica,Arial,sans-serif;">BAGCHEE</span>
          </div>
        </td></tr>
        <tr><td style="text-align:center;">
          <p style="color:#FFFFFF;margin:4px 0 0;opacity:0.85;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Inter',Helvetica,Arial,sans-serif;">Books That Stick</p>
        </td></tr>
      </table>
    </div>
    <div style="padding:40px 30px;color:#0B2F3A;font-size:15px;line-height:1.7;">${bodyHtml}</div>
    <div style="background-color:#fffdf5;padding:20px;text-align:center;border-top:1px solid #e6decd;">
      <p style="font-size:11px;color:#4A6fa5;margin:0 0 8px;"><a href="${FRONTEND_URL}" target="_blank" style="color:#008DDA;text-decoration:underline;">VIEW IN BROWSER</a></p>
      <p style="font-size:11px;color:#4A6fa5;margin:0 0 6px;"><a href="${FRONTEND_URL}/privacy-policy" target="_blank" style="color:#4A6fa5;text-decoration:underline;">Privacy Policy</a> &nbsp;|&nbsp; <a href="${FRONTEND_URL}/unsubscribe" target="_blank" style="color:#4A6fa5;text-decoration:underline;">Unsubscribe</a></p>
      <p style="font-size:12px;color:#4A6fa5;margin:0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
    </div>
  </div>
</div>
</body></html>`;

// ─── Standard Promotional Banners ────────────────────────────────────────────
const STANDARD_PROMO_BANNERS = [
  {
    id: 'membership',
    name: 'Bagchee Membership',
    subtitle: 'Save 10% Every Time You Shop',
    bgColor: '#008DDA',
    textColor: '#FFFFFF',
    link: `${FRONTEND_URL}/membership`,
  },
  {
    id: 'library',
    name: 'Bagchee Library Services',
    subtitle: 'Order from the Library Specialists',
    bgColor: '#0B2F3A',
    textColor: '#FFFFFF',
    link: `${FRONTEND_URL}/library-services`,
  },
  {
    id: 'bulk',
    name: 'Bulk Orders Made Easy',
    subtitle: 'Request a Quote',
    bgColor: '#F7EEDD',
    textColor: '#0B2F3A',
    link: `${FRONTEND_URL}/contact-us`,
  },
  {
    id: 'egiftcard',
    name: 'Bagchee E-gift Card',
    subtitle: 'The Perfect Gift for any Occasion',
    bgColor: '#FFF3E0',
    textColor: '#0B2F3A',
    link: `${FRONTEND_URL}/gift-card-detail`,
  },
];

const buildStandardPromoHtml = (promo, compact = false) => `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-radius:8px;overflow:hidden;margin:16px 0;background:${promo.bgColor};font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="padding:${compact ? '12px 20px' : '18px 24px'};text-align:center;">
      <p style="font-size:${compact ? '14px' : '16px'};font-weight:800;color:${promo.textColor};margin:0 0 3px;">${promo.name}</p>
      <p style="font-size:${compact ? '11px' : '13px'};color:${promo.textColor};opacity:0.85;margin:0 0 ${compact ? '8px' : '12px'};">${promo.subtitle}</p>
      <a href="${promo.link}" target="_blank" style="background:rgba(255,255,255,0.2);color:${promo.textColor};border:2px solid ${promo.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : '#0B2F3A'};padding:${compact ? '5px 14px' : '7px 20px'};border-radius:4px;text-decoration:none;font-size:${compact ? '11px' : '12px'};font-weight:bold;display:inline-block;">Learn More →</a>
    </td>
  </tr>
</table>`;

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
            {bookUsdPrice(value) && (
              <p className="text-[10px] text-gray-500 font-bold">{bookUsdPrice(value)}</p>
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
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [catTreeLoading, setCatTreeLoading] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');

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

  // Fetch categories for tree — book categories only (no CDs/DVDs/handicrafts; those media are dead)
  useEffect(() => {
    const load = async () => {
      setCatTreeLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/category/fetch?withProducts=true`);
        if (res.data.status) setMainCategories(dedupeByTitle(res.data.data || []));
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
    setBuilderBanners(prev => [...prev, { type: 'promo', code: '', text: '', bgColor: '#FFD700', imageUrl: '', link: '', promoId: null, promoData: null, position: 'top' }]);
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
      const price = bookUsdPrice(p);
      return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:540px;margin:0 auto 20px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    ${imgSrc ? `<td style="width:90px;vertical-align:top;padding:12px;"><img src="${imgSrc}" alt="${p.title}" width="80" style="display:block;border-radius:4px;object-fit:cover;" /></td>` : ''}
    <td style="vertical-align:top;padding:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0B2F3A;">${p.title}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#4A6fa5;">ID: ${p.bagcheeId}</p>
      ${price ? `<p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#008DDA;">${price}</p>` : ''}
      <a href="${FRONTEND_URL}/books/${p.bagcheeId}/${p.slug || p.bagcheeId}" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:8px 18px;font-size:13px;font-weight:bold;border-radius:6px;">View Book</a>
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
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <button
                        onClick={() => updateBanner(idx, 'type', 'promo')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-montserrat border-2 transition-all ${banner.type === 'promo' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'}`}
                      >
                        <Tag size={11} /> Promo Banner
                      </button>
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
                    {builderBanners.length === 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Position:</span>
                        <button
                          onClick={() => updateBanner(idx, 'position', 'top')}
                          className={`px-3 py-1 rounded text-xs font-bold font-montserrat border transition-all ${(banner.position || 'top') === 'top' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                          Top
                        </button>
                        <button
                          onClick={() => updateBanner(idx, 'position', 'bottom')}
                          className={`px-3 py-1 rounded text-xs font-bold font-montserrat border transition-all ${banner.position === 'bottom' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                          Bottom
                        </button>
                      </div>
                    )}
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
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {['standard', 'url', 'upload', 'library'].map(tab => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => {
                                setActiveBannerTab(p => ({ ...p, [idx]: tab }));
                                if (tab === 'library') loadBannerLibrary();
                              }}
                              className={`px-3 py-1 rounded text-[10px] font-bold font-montserrat border transition-all ${(activeBannerTab[idx] || 'standard') === tab ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                              {tab === 'standard' ? 'Standard' : tab === 'url' ? 'URL' : tab === 'upload' ? 'Upload' : 'Library'}
                            </button>
                          ))}
                        </div>

                        {(activeBannerTab[idx] || 'standard') === 'standard' && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 font-montserrat">Click a banner to insert it as a promo block in the email:</p>
                            <div className="space-y-2">
                              {STANDARD_PROMO_BANNERS.map(promo => (
                                <button
                                  key={promo.id}
                                  type="button"
                                  onClick={() => {
                                    updateBanner(idx, 'type', 'promo');
                                    updateBanner(idx, 'promoId', promo.id);
                                    updateBanner(idx, 'promoData', promo);
                                    updateBanner(idx, 'link', promo.link);
                                  }}
                                  style={{ background: promo.bgColor }}
                                  className={`w-full rounded-lg p-3 text-left border-2 transition-all ${banner.promoId === promo.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-gray-300'}`}
                                >
                                  <p style={{ color: promo.textColor }} className="text-xs font-bold font-montserrat m-0">{promo.name}</p>
                                  <p style={{ color: promo.textColor, opacity: 0.8 }} className="text-[10px] font-montserrat m-0">{promo.subtitle}</p>
                                </button>
                              ))}
                            </div>
                            {banner.promoId && (
                              <p className="text-[10px] text-primary font-montserrat font-bold">
                                Selected: {STANDARD_PROMO_BANNERS.find(p => p.id === banner.promoId)?.name}
                              </p>
                            )}
                          </div>
                        )}

                        {(activeBannerTab[idx] || 'standard') === 'url' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 font-montserrat mb-1 block">Image URL</label>
                            <input value={banner.imageUrl} onChange={(e) => updateBanner(idx, 'imageUrl', e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-primary font-mono" />
                          </div>
                        )}

                        {(activeBannerTab[idx] || 'standard') === 'upload' && (
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

                        {(activeBannerTab[idx] || 'standard') === 'library' && (
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
                  <div className="relative mb-3">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={catSearchQuery}
                      onChange={(e) => setCatSearchQuery(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary font-montserrat bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {mainCategories
                      .filter(cat => !catSearchQuery || (cat.title || '').toLowerCase().includes(catSearchQuery.toLowerCase()))
                      .map(cat => {
                        const catName = cat.title || '';
                        const isChecked = selectedCategoryFilters.includes(catName);
                        return (
                          <label key={cat.id} className={`flex items-center gap-1.5 px-2.5 py-2 border rounded-lg cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggleCategoryFilter(catName)} className="accent-primary h-3 w-3 shrink-0" />
                            <span className="text-[11px] font-bold text-gray-700 truncate font-montserrat">{catName}</span>
                          </label>
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
                  srcDoc={getFullEmailHtml(subject, body || '<p style="padding:40px;color:#999;text-align:center;font-family:sans-serif;">No content yet</p>')}
                  className="w-full"
                  style={{ height: '600px', border: 'none' }}
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
