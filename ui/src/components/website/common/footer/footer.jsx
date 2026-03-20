import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';
import Logo from '../../../../components/common/Logo.jsx';

const Footer = () => {
  const authData = localStorage.getItem('auth');
  const isLoggedIn = !!authData; // Agar data hai to true, warna false

  // 🟢 Decide the link based on login status
  const traceOrderLink = isLoggedIn ? "/account/orders" : "/trace-order";
  return (
    <footer className="bg-gradient-to-r from-primary to-primary-dark text-white pt-12 pb-6 font-body relative overflow-hidden">
      {/* Top Border Highlight */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

      <div className="max-w-[1400px] mx-auto px-4 relative z-10">
        {/* --- DESKTOP NEWSLETTER (Hidden on Mobile) --- */}
        <div className="hidden lg:block max-w-lg mx-auto mb-12 text-center">
          <NewsletterForm />
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-10 border-b border-white/10 pb-10">
          {/* COLUMN 1: BRAND, ADDRESS & SOCIAL */}
          <div className="space-y-6">
            <div className="shrink-0">
              <Logo className="h-8 md:h-10 w-auto text-white" />
            </div>

            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-accent mt-1 shrink-0" />
                <p className="font-medium">
                  4384/4A Ansari Road,
                  <br />
                  New Delhi 110002,
                  <br />
                  India
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-accent shrink-0" />
                <a
                  href="mailto:email@bagchee.com"
                  className="hover:text-accent transition-colors font-medium"
                >
                  email@bagchee.com
                </a>
              </div>
            </div>

            {/* SOCIAL ICONS (Added WhatsApp) */}
            <div className="flex flex-wrap gap-2 pt-2">
              <SocialIcon icon={<Facebook size={16} />} />
              <SocialIcon icon={<Instagram size={16} />} />

              {/* WhatsApp Icon (Custom SVG for Brand Accuracy) */}
              <SocialIcon
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="text-white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                }
              />

              <SocialIcon icon={<Twitter size={16} />} />
              <SocialIcon
                icon={<span className="font-bold text-xs font-display">P</span>}
              />
              <SocialIcon icon={<Mail size={16} />} />
            </div>

            {/* --- MOBILE NEWSLETTER (Visible only on Mobile, under Logo) --- */}
            <div className="block lg:hidden pt-6 border-t border-white/10 mt-6">
              <NewsletterForm mobile />
            </div>
          </div>

          {/* COLUMN 2: COMPANY  */}
          <div>
            <h3 className="text-accent font-display font-bold text-lg mb-5 border-b border-white/10 pb-2 inline-block tracking-tight">
              COMPANY
            </h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <Link
                  to="/about-us"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/testimonials"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/publishers-authors"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Publishers & Authors
                </Link>
              </li>
              <li>
                <Link
                  to="/career-opportunities"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Career Opportunities
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-conditions"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/disclaimer"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: SERVICES */}
          <div>
            <h3 className="text-accent font-display font-bold text-lg mb-5 border-b border-white/10 pb-2 inline-block tracking-tight">
              SERVICES
            </h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <Link
                  to="/services"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Library Services
                </Link>
              </li>
              <li>
                <Link
                  to="/membership"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Membership
                </Link>
              </li>
              <li>
                <Link
                  to="/gift-card-detail"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Gift Cards
                </Link>
              </li>
              <li>
                <Link
                  to="/account/wishlist"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Wish List
                </Link>
              </li>
              <li>
                <Link
                  to="/browse-categories"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/secure-shopping"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Secure Shopping
                </Link>
              </li>
              <li>
                <Link
                  to="/free-delivery"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Free Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: HELP  */}
          <div>
            <h3 className="text-accent font-display font-bold text-lg mb-5 border-b border-white/10 pb-2 inline-block tracking-tight">
              HELP
            </h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <Link
                  to="/help"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Help Desk
                </Link>
              </li>
              <li>
                <Link
                  to={traceOrderLink}
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Trace an Order
                </Link>
              </li>
              <li>
                <Link
                  to="/manage-account"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Manage Account
                </Link>
              </li>
              <li>
                <Link
                  to="/help/3"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Payment Options
                </Link>
              </li>
              <li>
                <Link
                  to="/help/2"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  to="/help/4"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-us"
                  className="hover:text-accent transition-colors duration-300 inline-block"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left pt-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Bagchee. All rights reserved.
          </p>

          <div className="flex flex-col items-center lg:items-end gap-3">
            <span className="text-[10px] text-accent font-bold uppercase tracking-widest font-montserrat">
              We Accept
            </span>

            {/* MODERN PAYMENT ICONS */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              <PaymentCard
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                alt="Visa"
              />
              <PaymentCard
                src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg"
                alt="Mastercard"
              />
              <PaymentCard
                src="https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg"
                alt="Discover"
              />
              <PaymentCard
                src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
                alt="Amex"
              />
              <PaymentCard
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                alt="Paypal"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- SUB COMPONENTS (Memoized for Speed) ---

// 1. Newsletter Form Component
const NewsletterForm = memo(({ mobile }) => (
  <form className={`relative flex items-center shadow-lg rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 hover:border-accent/50 transition-colors duration-300 ${mobile ? 'w-full' : ''}`}>
    <input 
      type="email" 
      placeholder="Enter your email for updates..." 
      className="w-full bg-transparent text-white placeholder-gray-300 px-6 py-3 focus:outline-none text-sm"
    />
    <button className="bg-accent text-text-main hover:bg-white hover:text-primary transition-colors px-6 py-3 flex items-center justify-center font-bold">
      <ArrowRight size={18} />
    </button>
  </form>
));
NewsletterForm.displayName = 'NewsletterForm';

// 2. Social Icon Component
const SocialIcon = memo(({ icon }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-accent hover:text-text-main hover:border-accent transition-all duration-300">
    {icon}
  </a>
));
SocialIcon.displayName = 'SocialIcon';

// 3. New Slick Payment Card Component (Optimized Image Loading)
const PaymentCard = memo(({ src, alt }) => (
  <div className="h-8 w-12 bg-white rounded flex items-center justify-center shadow-md opacity-90 hover:opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer">
    <img 
      src={src} 
      alt={alt} 
      className="h-4 max-w-[80%] object-contain" 
      // 🚀 OPTIMIZATION: Jab tak user footer tak scroll nahi karta, ye 5 images download nahi hongi
      loading="lazy" 
      decoding="async"
    />
  </div>
));
PaymentCard.displayName = 'PaymentCard';

// 🚀 OPTIMIZATION: Main Footer Export
export default memo(Footer);