import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Users, Mail, Loader2, ArrowLeft, FileText, FlaskConical, Clock, Trash2, Package, X, PlusCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../../utils/imageUrl';

// ─── Pre-built Email Templates ───
const EMAIL_TEMPLATES = [
  {
    name: 'Blank',
    subject: '',
    body: ''
  },
  {
    name: 'Bagchee New Site Launch',
    subject: 'Celebrate our new site with us and get 20% off!',
    body: `
<div style="background-color: #f4f4f4; padding: 20px 10px; font-family: 'Montserrat', Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-collapse: collapse; border: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 700px; margin: 0 auto;">

<tr>
  <td align="center" bgcolor="#008DDA" style="padding: 15px 10px; border: 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; max-width: 960px; margin: 0 auto;">
    <tr>
        <td align="center" style="background-color: #0d8bd0; padding: 8px;">
          
          <a href="https://ui-production-2b96.up.railway.app/" target="_blank" style="text-decoration: none; display: inline-block; border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 5px 24px;">
            
            <span style="display: inline-block; width: 48px; height: 48px; background: #ffffff; border-radius: 12px; text-align: center; line-height: 48px; vertical-align: middle; margin-right: 16px;">
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777378372/logo_iaapi2.png" width="30" height="30" alt="Bagchee Logo" style="vertical-align: middle; margin: 0; border: none; outline: none; display: inline-block;"/>
            </span>
  
            <span style="display: inline-block; text-align: left; vertical-align: middle;">
              <span style="display: block; font-family: 'Jost', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 2px; line-height: 1;">BAGCHEE</span>
              <span style="display: block; font-family: 'Jost', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; color: #ffffff; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 6px; line-height: 1;">Books that stick</span>
            </span>
            
          </a>
          
        </td>
      </tr>

      
      
    </table>
  </td>
</tr>

   <tr>
      <td align="center" bgcolor="#ffffff" style="padding: 10px 20px 5px 20px;">
        <p style="margin: 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 16px; color: #0B2F3A; font-weight: bold;">
          🎉 Celebrate our new site with us and get 20% off
        </p>
      </td>
    </tr>
<tr>
      <td align="center" bgcolor="#FFD700" style="padding: 15px 20px;">
        <h1 style="margin: 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 24px; color: #0B2F3A;">
          Your 20% off promo code: 
          <span style="background: #ffffff; padding: 4px 15px; border-radius: 5px; display: inline-block; vertical-align: middle; margin-left: 8px;">123abc</span>
        </h1>
      </td>
    </tr>

    

   <tr>
      <td style="padding: 20px 30px 15px 40px; color: #4A4A4A; font-size: 14px; line-height: 1.6; font-family: 'Montserrat', Helvetica, Arial, sans-serif;">
        <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #0B2F3A;">Hello, Reader!</h2>
        <p style="margin: 0;">Our brand-new website is live! To celebrate, enjoy a special discount. Experience an easier, faster way to find your favorite books today.</p>  </td>
    </tr>

    <tr>
      <td align="center" style="padding: 0px 40px 30px 40px;">
        <a href="https://ui-production-2b96.up.railway.app/" target="_blank" style="text-decoration: none;">
          
          <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777368222/Screenshot_2026-04-28_145244_uftpga.png" alt="New Website Preview" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 15px rgba(0,0,0,0.08);" />
          
        </a>
      </td>
    </tr>

    <tr>
      <td style="padding: 10px 40px 40px 40px; font-family: 'Montserrat', Helvetica, Arial, sans-serif;">
        <h3 style="padding-bottom: 10px; color: #333;">What's new?</h3>
        
        <table width="100%" cellpadding="12" cellspacing="0">
          
          <tr>
            <td style="border-left: 4px solid #008DDA; background: #f9f9f9; margin-bottom: 20px; display: block; width: 100%; border-radius: 0 4px 4px 0;">
              <strong style="color: #008DDA; font-size: 15px;">🔍 New Search and Listing</strong><br/>
              <span style="font-size: 13px; color: #666; display: inline-block; margin-top: 4px;">Find exactly what you want with our advanced filters.</span>
              
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777368913/Screenshot_2026-04-28_150440_dbkxkh.png" alt="Search Feature" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;" />
            </td>
          </tr>

          <tr>
            <td style="border-left: 4px solid #008DDA; background: #f9f9f9; margin-bottom: 20px; display: block; width: 100%; border-radius: 0 4px 4px 0;">
              <strong style="color: #008DDA; font-size: 15px;">📖 Improved Product Page</strong><br/>
              <span style="font-size: 13px; color: #666; display: inline-block; margin-top: 4px;">Detailed descriptions and high-quality book previews.</span>
              
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777369305/Screenshot_2026-04-28_151126_sypgd9.png" alt="Product Page" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;" />
            </td>
          </tr>

          <tr>
            <td style="border-left: 4px solid #008DDA; background: #f9f9f9; margin-bottom: 20px; display: block; width: 100%; border-radius: 0 4px 4px 0;">
              <strong style="color: #008DDA; font-size: 15px;">🛒 Easy Checkout</strong><br/>
              <span style="font-size: 13px; color: #666; display: inline-block; margin-top: 4px;">Faster, secure, and seamless payment experience.</span>
              
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777369894/Screenshot_2026-04-28_152120_b6cyjn.png" alt="Checkout" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;" />
            </td>
          </tr>

          <tr>
            <td style="border-left: 4px solid #008DDA; background: #f9f9f9; margin-bottom: 20px; display: block; width: 100%; border-radius: 0 4px 4px 0;">
              <strong style="color: #008DDA; font-size: 15px;">❤️ My Account</strong><br/>
              <span style="font-size: 13px; color: #666; display: inline-block; margin-top: 4px;">All your favorites and tracking in one place.</span>
              
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777369645/Screenshot_2026-04-28_151700_ylshjb.png" alt="My Account" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;" />
            </td>
          </tr>

          <tr>
            <td style="border-left: 4px solid #008DDA; background: #f9f9f9; display: block; width: 100%; border-radius: 0 4px 4px 0;">
              <strong style="color: #008DDA; font-size: 15px;">🎁 E-gift Cards</strong><br/>
              <span style="font-size: 13px; color: #666; display: inline-block; margin-top: 4px;">Perfect for gifting the joy of reading.</span>
              
              <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777369772/Screenshot_2026-04-28_151919_cwgjz2.png" alt="Gift Cards" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;" />
            </td>
          </tr>

        </table>
      </td>
    </tr>

  <tr>
      <td align="center" style="padding: 20px 40px 50px 40px;">
        
        <h3 style="margin: 0 0 10px 0; font-family: 'Merriweather', Georgia, serif; font-size: 24px; font-style: italic; color: #0B2F3A; font-weight: normal; letter-spacing: 0.5px;">
          The story doesn't end here...
        </h3>
        
        <p style="margin: 0 0 30px 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6;">
          Experience the all-new Bagchee and uncover a world of unforgettable reads.
        </p>
        
       <a href="https://ui-production-2b96.up.railway.app/" target="_blank" style="background-color: #FFD700; color: #111111; padding: 15px 35px; text-decoration: none; display: inline-block; border-radius: 6px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          Continue to Bagchee.com
        </a>
        
      </td>
    </tr>

    <tr>
      <td align="center" style="padding: 20px 40px 20px 40px; background-color: #ffffff; border-top: 1px solid #f0f0f0;">
           
        <p style="margin: 0 0 15px 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; color: #555555;">
          Order ahead and have it waiting for you. &nbsp;
          <a href="https://ui-production-2b96.up.railway.app/" style="color: #008DDA; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #008DDA;">
            LEARN MORE &rarr;
          </a>
        </p>
        
        <a href="https://ui-production-2b96.up.railway.app/" target="_blank" style="text-decoration: none;">
          <img src="https://res.cloudinary.com/dmfb5ysx8/image/upload/v1777464195/ChatGPT_Image_Apr_29_2026_05_31_36_PM_ztew1i.png" alt="Local Bagchee Store" width="100%" style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" />
        </a>

      </td>
    </tr>
  <tr>
      <td align="center" bgcolor="#333333" style="padding: 40px 20px; font-family: 'Montserrat', Helvetica, Arial, sans-serif;">
        
        <p style="margin: 0 0 20px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999999;">
          <a href="#" style="color: #999999; text-decoration: underline;">VIEW IN BROWSER</a>
        </p>

        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ffffff; font-weight: 800;">
          <a href="https://www.bagchee.com" style="color: #ffffff; text-decoration: none;">www.bagchee.com</a>
        </h3>

        <p style="margin: 0 0 25px 0; font-size: 12px; color: #008DDA; font-weight: 600;">
          <a href="#" style="color: #008DDA; text-decoration: none;">About</a> &nbsp;|&nbsp; 
          <a href="#" style="color: #008DDA; text-decoration: none;">Terms & Conditions</a> &nbsp;|&nbsp; 
          <a href="#" style="color: #008DDA; text-decoration: none;">Privacy</a>
        </p>

        <p style="margin: 0 0 10px 0; font-size: 11px; color: #cccccc; line-height: 1.6;">
          You are receiving this e-mail because you have signed up to the Bagchee newsletter.<br/>
          Your personal details won't be given to any third parties.<br/>
          You can <a href="#" style="color: #008DDA; text-decoration: none;">update your subscription</a> or <a href="#" style="color: #008DDA; text-decoration: none;">unsubscribe</a> anytime you want.
        </p>


        <p style="margin: 20px 0 10px 0; font-size: 11px; color: #999999;">
          <a href="#" style="color: #999999; text-decoration: underline;">Update Your Preferences</a> &nbsp;|&nbsp; 
          <a href="#" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #999999;">
          &copy; 2026 Bagchee. All Rights Reserved.
        </p>

      </td>
    </tr>

  </table>
</div>
    `
  },
  {
    name: 'Coupon / Promo Code',
    subject: 'Exclusive Offer Just for You!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:5px;">MEMBER ONLY <span style="color:#e53935;">OFFER</span></h1>
  <div style="background:#e53935; border-radius:12px; padding:30px; margin:20px auto; max-width:480px; color:#fff;">
    <p style="font-size:22px; font-weight:bold; margin:0;">CELEBRATE</p>
    <p style="font-size:16px; margin:5px 0;">our new collection and get</p>
    <p style="font-size:52px; font-weight:bold; margin:10px 0; font-style:italic;">10% off</p>
    <p style="font-size:16px; margin-top:15px;">Use promo code</p>
    <p style="display:inline-block; border:2px dashed #fff; padding:8px 24px; font-size:24px; font-weight:bold; letter-spacing:3px; margin:8px 0;">BAGCHEE10</p>
    <p style="font-size:16px; margin-top:8px;">at checkout</p>
  </div>
  <p style="color:#666; font-size:13px; margin-top:15px;">Valid for a limited time only. Cannot be combined with other offers.</p>
</div>`
  },
  {
    name: 'New Arrivals',
    subject: 'New Arrivals This Week at Bagchee!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:10px;">New Arrivals</h1>
  <p style="color:#666; font-size:15px; line-height:1.6; max-width:480px; margin:0 auto 25px;">
    Discover our latest collection of handpicked Indian books. From timeless classics to contemporary masterpieces, find your next great read.
  </p>
  <div style="background:#f8f4eb; border-radius:12px; padding:25px; margin:0 auto; max-width:480px;">
    <p style="font-size:18px; color:#0B2F3A; font-weight:bold; margin:0 0 8px;">This Week's Highlights</p>
    <p style="color:#666; font-size:14px; margin:0;">Browse our freshly added titles across Religion & Spirituality, History, Art & Architecture, and more.</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/new-arrivals" style="display:inline-block; background:#008DDA; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Browse New Arrivals</a>
  </div>
</div>`
  },
  {
    name: 'Sale / Discount',
    subject: 'Sale Today - Up to 25% Off at Bagchee!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#e53935; font-size:36px; font-weight:bold; margin-bottom:5px;">SALE TODAY</h1>
  <p style="color:#0B2F3A; font-size:20px; margin:0 0 20px;">Up to <strong>25% OFF</strong> on selected titles</p>
  <div style="background:linear-gradient(135deg, #e53935, #c62828); border-radius:12px; padding:30px; margin:0 auto; max-width:480px; color:#fff;">
    <p style="font-size:48px; font-weight:bold; margin:0;">25% OFF</p>
    <p style="font-size:16px; margin:10px 0 0;">on hundreds of books across all categories</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/sale" style="display:inline-block; background:#e53935; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Shop the Sale</a>
  </div>
  <p style="color:#999; font-size:12px; margin-top:20px;">Offer valid while stocks last. Free delivery worldwide on orders over $50.</p>
</div>`
  },
  {
    name: 'Membership',
    subject: 'Join Bagchee Membership - Save 10% Every Day!',
    body: `<div style="text-align:center; padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:28px; margin-bottom:10px;">Bagchee Membership</h1>
  <p style="color:#666; font-size:15px; line-height:1.6; max-width:480px; margin:0 auto 25px;">
    Become a Bagchee member and enjoy exclusive benefits on every purchase.
  </p>
  <div style="background:#008DDA; border-radius:12px; padding:30px; margin:0 auto; max-width:480px; color:#fff;">
    <p style="font-size:42px; font-weight:bold; margin:0;">10% OFF</p>
    <p style="font-size:18px; margin:8px 0;">on every order, every day</p>
    <p style="font-size:14px; opacity:0.9; margin-top:15px;">Plus free priority shipping, early access to new arrivals, and exclusive member-only deals.</p>
  </div>
  <div style="margin-top:25px;">
    <a href="https://ui-production-cf27.up.railway.app/membership" style="display:inline-block; background:#008DDA; color:#fff; text-decoration:none; padding:14px 36px; font-size:15px; font-weight:bold; border-radius:8px;">Become a Member</a>
  </div>
</div>`
  },
  {
    name: 'Newsletter / Weekly Update',
    subject: 'Your Weekly Book Digest from Bagchee',
    body: `<div style="padding:20px 0;">
  <h1 style="color:#0B2F3A; font-size:24px; text-align:center; margin-bottom:20px;">Your Weekly Book Digest</h1>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Dear Reader,
  </p>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Here's what's new at Bagchee this week. We've added exciting new titles and have some special recommendations just for you.
  </p>
  <div style="border-left:4px solid #008DDA; padding:15px 20px; background:#f0f8ff; margin:20px 0; border-radius:0 8px 8px 0;">
    <p style="color:#0B2F3A; font-weight:bold; margin:0 0 5px;">Editor's Pick of the Week</p>
    <p style="color:#666; font-size:14px; margin:0;">Add your recommended book title and description here.</p>
  </div>
  <p style="color:#666; font-size:15px; line-height:1.7;">
    Happy reading!<br/>
    <strong>The Bagchee Team</strong>
  </p>
</div>`
  },
  {
    name: 'New Site Launch',
    subject: 'Celebrate the New Bagchee — and Get 20% Off!',
    body: `<div style="font-family:'Inter',Helvetica,Arial,sans-serif; color:#333; max-width:580px; margin:0 auto;">

  <!-- Promo Banner -->
  <div style="background:#f5a623; border-radius:10px; padding:24px 30px; text-align:center; margin-bottom:28px;">
    <p style="font-size:13px; color:#7a4e00; margin:0 0 6px; font-weight:600; letter-spacing:1px; text-transform:uppercase;">Celebrate our new site with us and get</p>
    <p style="font-size:15px; color:#7a4e00; margin:0 0 12px;">Your 20% off promo code:</p>
    <p style="font-size:40px; font-weight:800; color:#0B2F3A; margin:0; letter-spacing:4px;">NEWSITE20</p>
    <p style="font-size:12px; color:#7a4e00; margin:10px 0 0; opacity:0.8;">Use at checkout. Valid for a limited time.</p>
  </div>

  <!-- Greeting -->
  <p style="font-size:18px; font-weight:700; color:#0B2F3A; margin:0 0 8px;">Hello!</p>
  <p style="font-size:15px; color:#555; line-height:1.7; margin:0 0 30px;">
    We've been working hard on the new Bagchee and we're excited to share what's new. Here's a quick look at what we've built for you.
  </p>

  <!-- Feature 1: Search & Listing -->
  <div style="border-left:4px solid #008DDA; padding:14px 20px; background:#f0f8ff; border-radius:0 8px 8px 0; margin-bottom:20px;">
    <p style="font-size:16px; font-weight:700; color:#0B2F3A; margin:0 0 5px;">🔍 Improved Search &amp; Listings</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0;">
      Find exactly what you're looking for with our new live search and improved listing pages. Switch between list and grid view to match your browsing style.
    </p>
  </div>

  <!-- Feature 2: Product Page -->
  <div style="border-left:4px solid #f5a623; padding:14px 20px; background:#fffdf5; border-radius:0 8px 8px 0; margin-bottom:20px;">
    <p style="font-size:16px; font-weight:700; color:#0B2F3A; margin:0 0 5px;">📖 Improved Product Page</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0;">
      Richer book details, author bios, related titles, and a quick-look modal so you can preview any book in a flash without leaving the page.
    </p>
  </div>

  <!-- Feature 3: Checkout -->
  <div style="border-left:4px solid #43a047; padding:14px 20px; background:#f1f8f1; border-radius:0 8px 8px 0; margin-bottom:20px;">
    <p style="font-size:16px; font-weight:700; color:#0B2F3A; margin:0 0 5px;">🛒 Easy Checkout</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0;">
      Fewer steps, saved addresses, multiple payment options, and gift card support — getting your books has never been this smooth.
    </p>
  </div>

  <!-- Feature 4: My Account -->
  <div style="border-left:4px solid #8e24aa; padding:14px 20px; background:#fdf4ff; border-radius:0 8px 8px 0; margin-bottom:20px;">
    <p style="font-size:16px; font-weight:700; color:#0B2F3A; margin:0 0 5px;">❤️ My Account — All Your Favourites in One Place</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0;">
      Your wishlist, order history, and account details all in one clean dashboard. Track your orders and pick up right where you left off.
    </p>
  </div>

  <!-- Perks row -->
  <div style="display:flex; gap:12px; margin-bottom:28px; flex-wrap:wrap;">
    <div style="flex:1; min-width:140px; background:#f8f4eb; border-radius:10px; padding:16px; text-align:center;">
      <p style="font-size:22px; margin:0 0 4px;">🎁</p>
      <p style="font-size:13px; font-weight:700; color:#0B2F3A; margin:0 0 3px;">E-gift Cards</p>
      <p style="font-size:12px; color:#666; margin:0;">The perfect gift for every reader</p>
    </div>
    <div style="flex:1; min-width:140px; background:#f8f4eb; border-radius:10px; padding:16px; text-align:center;">
      <p style="font-size:22px; margin:0 0 4px;">🚚</p>
      <p style="font-size:13px; font-weight:700; color:#0B2F3A; margin:0 0 3px;">Free Shipping Worldwide</p>
      <p style="font-size:12px; color:#666; margin:0;">On every order, everywhere</p>
    </div>
    <div style="flex:1; min-width:140px; background:#f8f4eb; border-radius:10px; padding:16px; text-align:center;">
      <p style="font-size:22px; margin:0 0 4px;">🏷️</p>
      <p style="font-size:13px; font-weight:700; color:#0B2F3A; margin:0 0 3px;">10% Off for Members</p>
      <p style="font-size:12px; color:#666; margin:0;">Every day, on every order</p>
    </div>
  </div>

  <!-- New Arrivals + Sale -->
  <div style="background:#0B2F3A; border-radius:10px; padding:24px 28px; text-align:center; margin-bottom:28px;">
    <p style="color:#f5a623; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin:0 0 8px;">What's on right now</p>
    <p style="color:#fff; font-size:20px; font-weight:800; margin:0 0 6px;">New Arrivals &amp; Sale</p>
    <p style="color:#ccc; font-size:14px; margin:0 0 18px; line-height:1.6;">Fresh titles added weekly. Plus hundreds of books on sale — up to 25% off.</p>
    <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
      <a href="https://ui-production-2b96.up.railway.app/new-arrivals" style="display:inline-block; background:#f5a623; color:#0B2F3A; text-decoration:none; padding:12px 28px; font-size:14px; font-weight:800; border-radius:8px;">New Arrivals →</a>
      <a href="https://ui-production-2b96.up.railway.app/sale" style="display:inline-block; background:#e53935; color:#fff; text-decoration:none; padding:12px 28px; font-size:14px; font-weight:800; border-radius:8px;">Shop the Sale →</a>
    </div>
  </div>

  <!-- CTA -->
  <div style="text-align:center; margin-bottom:10px;">
    <p style="font-size:16px; color:#555; font-style:italic; margin:0 0 14px;">There is more… but you better see it for yourself.</p>
    <a href="https://ui-production-2b96.up.railway.app" style="display:inline-block; background:#008DDA; color:#fff; text-decoration:none; padding:15px 40px; font-size:15px; font-weight:800; border-radius:8px; letter-spacing:0.5px;">Continue to Bagchee.com →</a>
  </div>

</div>`
  }
];

const AUDIENCE_OPTIONS = [
  { key: 'subscribers', label: 'All subscribers' },
  { key: 'members', label: 'All members' },
  { key: 'purchasers', label: 'All with purchase' },
  { key: 'categories', label: 'Categories subscribers' },
  { key: 'specific', label: 'Selected subscribers' },
];

const SendEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editor = useRef(null);
  const preselectedEmails = location.state?.selectedEmails || [];

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [audience, setAudience] = useState(preselectedEmails.length > 0 ? ['specific'] : ['subscribers']);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);

  // Product picker
  const [productIdsInput, setProductIdsInput] = useState('');
  const [pickedProducts, setPickedProducts] = useState([]);
  const [productFetchLoading, setProductFetchLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const editorConfig = useMemo(() => ({
    height: 400,
    placeholder: 'Compose your email content here...',
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'link', '|',
      'align', '|',
      'hr', 'table', '|',
      'undo', 'redo', '|',
      'fullsize'
    ],
    removeButtons: ['file', 'video'],
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
  }), []);

  // Fetch recipient count when audience changes
  useEffect(() => {
    if (audience.length === 0) {
      setRecipientCount(0);
      return;
    }
    const fetchCount = async () => {
      setCountLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/recipients-count?audience=${audience.join(',')}`);
        if (res.data.status) {
          setRecipientCount(res.data.count);
        }
      } catch {
        setRecipientCount(0);
      } finally {
        setCountLoading(false);
      }
    };
    fetchCount();
  }, [audience, API_BASE_URL]);

  // Fetch scheduled emails
  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/scheduled`);
        if (res.data.status) {
          setScheduledEmails(res.data.data);
        }
      } catch {
        // ignore
      }
    };
    fetchScheduled();
  }, [API_BASE_URL]);

  const toggleAudience = (key) => {
    setAudience(prev =>
      prev.includes(key)
        ? prev.filter(a => a !== key)
        : [...prev, key]
    );
  };

  const handleLoadTemplate = () => {
    const tmpl = EMAIL_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!tmpl) return;
    if (tmpl.name === 'Blank') {
      setSubject('');
      setBody('');
      return;
    }
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    toast.success(`"${tmpl.name}" template loaded`);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return toast.error('Please enter a test email address.');
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');

    setTestLoading(true);
    const toastId = toast.loading(`Sending test to ${testEmail}...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send-test`, {
        subject: subject.trim(),
        body,
        testEmail: testEmail.trim()
      });

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
      } else {
        toast.error(res.data.msg || 'Failed to send test', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send test email', { id: toastId });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');
    if (audience.length === 0) return toast.error('Please select at least one audience.');
    if (recipientCount === 0) return toast.error('No recipients found for selected audience.');

    // If sendAt is set, schedule instead of sending immediately
    if (sendAt) {
      const sendAtDate = new Date(sendAt);
      if (sendAtDate <= new Date()) {
        return toast.error('Scheduled time must be in the future.');
      }

      const confirmed = window.confirm(
        `Schedule this email for ${sendAtDate.toLocaleString()}?\n\nSubject: ${subject}\nRecipients: ~${recipientCount.toLocaleString()}`
      );
      if (!confirmed) return;

      setLoading(true);
      const toastId = toast.loading('Scheduling campaign...');

      try {
        const res = await axios.post(`${API_BASE_URL}/email-campaign/schedule`, {
          subject: subject.trim(),
          body,
          audience,
          sendAt: sendAtDate.toISOString(),
          ...(audience.includes('specific') && { specificEmails: preselectedEmails })
        });

        if (res.data.status) {
          toast.success(res.data.msg, { id: toastId });
          setSubject('');
          setBody('');
          setSendAt('');
          // Refresh scheduled list
          const listRes = await axios.get(`${API_BASE_URL}/email-campaign/scheduled`);
          if (listRes.data.status) setScheduledEmails(listRes.data.data);
        } else {
          toast.error(res.data.msg || 'Failed to schedule', { id: toastId });
        }
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to schedule campaign', { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Send immediately
    const confirmed = window.confirm(
      `Send this email to ~${recipientCount.toLocaleString()} recipient(s) NOW?\n\nSubject: ${subject}`
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading(`Sending to ${recipientCount.toLocaleString()} recipients...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send`, {
        subject: subject.trim(),
        body,
        audience,
        ...(audience.includes('specific') && { specificEmails: preselectedEmails })
      });

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setSubject('');
        setBody('');
      } else {
        toast.error(res.data.msg || 'Failed to send', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send campaign', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled email?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/email-campaign/scheduled/${id}`);
      if (res.data.status) {
        toast.success('Scheduled email cancelled.');
        setScheduledEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to cancel');
    }
  };

  // Product picker handlers
  const handleFetchProducts = async () => {
    const raw = productIdsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return toast.error('Paste at least one product ID.');
    setProductFetchLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/products-preview`, { ids: raw });
      if (res.data.status) {
        const found = res.data.data;
        if (found.length === 0) return toast.error('No products found for those IDs.');
        // merge, avoid duplicates
        setPickedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...found.filter(p => !existingIds.has(p.id))];
        });
        const notFound = raw.filter(id =>
          !found.some(p => p.bagcheeId === id || p.isbn13 === id || p.isbn10 === id)
        );
        if (notFound.length > 0) toast(`${found.length} found, ${notFound.length} not found: ${notFound.join(', ')}`, { icon: '⚠️' });
        else toast.success(`${found.length} product(s) loaded.`);
        setProductIdsInput('');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to fetch products.');
    } finally {
      setProductFetchLoading(false);
    }
  };

  const handleRemovePickedProduct = (id) => {
    setPickedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleInsertProductCards = () => {
    if (pickedProducts.length === 0) return toast.error('No products to insert.');
    const cards = pickedProducts.map(p => {
      const imgSrc = getProductImageUrl(p);
      const price = p.price ? `$${p.price}` : '';
      return `
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:540px;margin:0 auto 20px;border:1px solid #e6decd;border-radius:8px;overflow:hidden;font-family:Inter,Helvetica,Arial,sans-serif;">
  <tr>
    ${imgSrc ? `<td style="width:90px;vertical-align:top;padding:12px;">
      <img src="${imgSrc}" alt="${p.title}" width="80" style="display:block;border-radius:4px;object-fit:cover;" />
    </td>` : ''}
    <td style="vertical-align:top;padding:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0B2F3A;">${p.title}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#4A6fa5;">ID: ${p.bagcheeId}</p>
      ${price ? `<p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#008DDA;">${price}</p>` : ''}
      <a href="${process.env.REACT_APP_FRONTEND_URL || '#'}/books/${p.bagcheeId}" style="display:inline-block;background:#008DDA;color:#fff;text-decoration:none;padding:8px 18px;font-size:13px;font-weight:bold;border-radius:6px;">View Book</a>
    </td>
  </tr>
</table>`;
    }).join('\n');

    setBody(prev => (prev && prev !== '<p><br></p>' ? prev + '\n' + cards : cards));
    toast.success(`${pickedProducts.length} product card(s) inserted into email.`);
  };

  // Get min datetime for the picker (now + 5 min)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    sending: 'bg-blue-100 text-blue-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/newsletter-subs')}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Send Email Campaign
          </h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">Compose and send emails to your audience</p>
        </div>
      </div>

      <div className="max-w-4xl">

        {/* Email Template Selector */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <FileText size={13} className="inline mr-1 -mt-0.5" /> Email Template
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat bg-white cursor-pointer"
            >
              {EMAIL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.name} value={tmpl.name}>{tmpl.name}</option>
              ))}
            </select>
            <button
              onClick={handleLoadTemplate}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              Load
            </button>
          </div>
        </div>

        {/* Product Picker */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">
            <Package size={13} className="inline mr-1 -mt-0.5" /> Product Picker
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Paste product IDs (Bagchee ID or ISBN), one per line or comma-separated. Fetched products will be inserted as cards into the email body.</p>

          <div className="flex gap-3 mb-3">
            <textarea
              value={productIdsInput}
              onChange={(e) => setProductIdsInput(e.target.value)}
              placeholder={"BB1234\nBB5678\n9780123456789"}
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono resize-none"
            />
            <button
              onClick={handleFetchProducts}
              disabled={productFetchLoading}
              className="self-start bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-sm whitespace-nowrap"
            >
              {productFetchLoading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
              Fetch
            </button>
          </div>

          {pickedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {pickedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-cream-50 border border-cream-200 rounded-lg">
                    {getProductImageUrl(p) && (
                      <img
                        src={getProductImageUrl(p)}
                        alt={p.title}
                        className="w-10 h-14 object-cover rounded shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">{p.title}</p>
                      <p className="text-[10px] text-primary font-mono">{p.bagcheeId}</p>
                      {p.price && (
                        <p className="text-[10px] font-bold text-gray-500">${p.price}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePickedProduct(p.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleInsertProductCards}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-montserrat font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <PlusCircle size={15} /> Insert {pickedProducts.length} Product Card{pickedProducts.length > 1 ? 's' : ''} into Email
              </button>
            </>
          )}
        </div>

        {/* Audience Selector — Checkboxes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3 block">
            Select Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIENCE_OPTIONS.map((opt) => {
              const checked = audience.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${checked
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAudience(opt.key)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Users size={16} className={checked ? 'text-primary' : 'text-gray-400'} />
                    <span className={`text-sm font-bold font-montserrat ${checked ? 'text-primary' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selected subscribers info */}
          {audience.includes('specific') && preselectedEmails.length > 0 && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs font-bold text-primary font-montserrat mb-1">{preselectedEmails.length} subscriber(s) selected from list:</p>
              <p className="text-[11px] text-gray-500 font-mono break-all">{preselectedEmails.slice(0, 5).join(', ')}{preselectedEmails.length > 5 ? ` +${preselectedEmails.length - 5} more` : ''}</p>
            </div>
          )}

          {/* Recipient Count Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-montserrat">Recipients:</span>
            {countLoading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-montserrat">
                {recipientCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Subject Line */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New Arrivals This Week at Bagchee!"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
          />
        </div>

        {/* Email Body Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Content
          </label>
          <div className="border rounded-lg overflow-hidden">
            <JoditEditor
              ref={editor}
              value={body}
              config={editorConfig}
              onBlur={(newContent) => setBody(newContent)}
            />
          </div>
        </div>

        {/* Send At (Scheduler) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <Clock size={13} className="inline mr-1 -mt-0.5" /> Send At (Optional)
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Leave empty to send immediately, or pick a date/time to schedule</p>
          <input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            min={getMinDateTime()}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
          />
          {sendAt && (
            <button
              onClick={() => setSendAt('')}
              className="ml-3 text-xs text-red-500 hover:text-red-700 font-montserrat font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Test Email */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            <FlaskConical size={13} className="inline mr-1 -mt-0.5" /> Test Email
          </label>
          <p className="text-[11px] text-gray-400 mb-3 font-montserrat">Send a preview to yourself before sending to all recipients</p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email address"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
            />
            <button
              onClick={handleSendTest}
              disabled={testLoading}
              className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              {testLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Sending...</>
              ) : (
                <><FlaskConical size={14} /> Send Test</>
              )}
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
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {sendAt ? 'Scheduling...' : 'Sending...'}</>
            ) : sendAt ? (
              <><Clock size={16} /> Schedule Campaign</>
            ) : (
              <><Send size={16} /> Send Campaign</>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/newsletter-subs')}
            className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
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
                      <td className="py-3 pr-4 font-montserrat text-gray-700 max-w-[200px] truncate">
                        {email.subject}
                      </td>
                      <td className="py-3 pr-4 font-montserrat text-gray-500 text-xs whitespace-nowrap">
                        {new Date(email.sendAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full font-montserrat ${statusColors[email.status] || 'bg-gray-100 text-gray-500'}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-montserrat text-xs text-gray-500">
                        {email.status === 'sent' ? `${email.sent} sent, ${email.failed} failed` : '-'}
                      </td>
                      <td className="py-3">
                        {email.status === 'pending' && (
                          <button
                            onClick={() => handleCancelScheduled(email.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Cancel"
                          >
                            <Trash2 size={15} />
                          </button>
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
    </div>
  );
};

export default SendEmail;
