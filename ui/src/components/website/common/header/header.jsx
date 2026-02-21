'use client';

import React, { useState, useEffect, Fragment, useContext, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu as MenuIcon, X, ChevronDown, Globe, LogIn, UserPlus, LogOut, List, MapPin, ChevronRight } from 'lucide-react';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import Logo from '../../../common/Logo.jsx';
import logoImg from '../../../../assets/images/common/logo.png';
import { CurrencyContext } from '../../../../context/CurrencyContext';
import { useCart } from '../../../../context/CartContext.jsx';
import axios from '../../../../utils/axiosConfig.js';

/* ---------------------------------------------------------
  🟢 HELPER COMPONENT: Dropdown Content Renderer
  ---------------------------------------------------------
*/
const DropdownContent = ({ htmlContent, onLinkClick }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    const handleClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        const url = new URL(target.href, window.location.origin);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          onLinkClick(url.pathname + url.search + url.hash);
        }
      }
    };

    contentRef.current.addEventListener('click', handleClick);
    return () => {
      contentRef.current?.removeEventListener('click', handleClick);
    };
  }, [htmlContent, onLinkClick]);

  if (!htmlContent) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm">No items available</p>
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    />
  );
};

/* ---------------------------------------------------------
  🟢 HELPER COMPONENT: Mobile HTML Parser & Accordion
  ---------------------------------------------------------
*/
const MobileHtmlAccordion = ({ htmlContent, onLinkClick }) => {
  const sections = useMemo(() => {
    if (!htmlContent) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const extractedSections = [];

    const allDivs = doc.querySelectorAll('body > div > div > div');
    const columns = allDivs.length > 0 ? Array.from(allDivs) : [doc.body];

    columns.forEach((col) => {
      const h4 = col.querySelector('h4');
      const ul = col.querySelector('ul');

      if (ul) {
        const links = Array.from(ul.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href')
        }));

        if (h4) {
          extractedSections.push({ title: h4.textContent.trim(), links });
        } else {
          if (extractedSections.length > 0) {
            extractedSections[extractedSections.length - 1].links.push(...links);
          } else {
            extractedSections.push({ title: "More Items", links });
          }
        }
      }
    });

    return extractedSections;
  }, [htmlContent]);

  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (title) => setOpenSection(openSection === title ? null : title);

  if (sections.length === 0) {
    return (
      <div
        className="p-4 text-sm font-body text-text-muted"
        onClick={onLinkClick}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div className="flex flex-col w-full bg-white rounded-lg border border-cream-200 mt-2 overflow-hidden">
      {sections.map((section, idx) => (
        <div key={idx} className="border-b border-cream-100 last:border-0">
          <button
            onClick={() => toggleSection(section.title)}
            className={`w-full flex items-center justify-between py-3 px-4 text-xs font-bold normal-case tracking-slick transition-colors font-montserrat ${
              openSection === section.title
                ? "bg-cream-50 text-primary"
                : "text-text-main hover:bg-cream-50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${openSection === section.title ? "bg-primary" : "bg-gray-300"}`}
              />
              {section.title.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}
              <span className="text-[10px] font-normal text-gray-400">
                ({section.links.length})
              </span>
            </span>
            {openSection === section.title ? (
              <ChevronDown size={14} className="text-primary" />
            ) : (
              <ChevronRight size={14} className="text-text-muted" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openSection === section.title
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col bg-white pl-4 py-2 space-y-1">
              {section.links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href && link.href.startsWith("/")) {
                      e.preventDefault();
                      // 🟢 YAHAN BHI PROCESSED HREF LAGAO
                      const processedHref = link.href
                        .replace(/&/g, "and") // '&' ko 'and' banao
                        .replace(/\s+/g, "-") // Spaces ko '-' banao
                        .toLowerCase();

                      onLinkClick(processedHref);
                    }
                  }}
                  className="block px-4 py-2 text-sm font-body text-text-muted hover:text-primary hover:translate-x-1 transition-all duration-200"
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="p-3 bg-cream-50 border-t border-cream-200">
        <a
          href="/allcategories"
          onClick={(e) => {
            e.preventDefault();
            onLinkClick("/allcategories");
          }}
          className="block w-full py-3 text-center text-xs font-bold text-white bg-primary rounded uppercase tracking-slick hover:bg-primary-hover transition-colors font-montserrat shadow-sm"
        >
          Browse All Categories &gt;
        </a>
      </div>
    </div>
  );
};


/* ---------------------------------------------------------
   MAIN HEADER COMPONENT
--------------------------------------------------------- */
const PremiumHeader = () => {

  const { currency, setCurrency } = useContext(CurrencyContext);
  const { cartItemCount, wishlistCount } = useCart();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuKey, setMenuKey] = useState(0);
  const [forceHideDropdown, setForceHideDropdown] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const currencies = ['INR', 'EUR', 'GBP', 'USD'];
  const [mobileCurrencyOpen, setMobileCurrencyOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const dropdownTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (authData) {
      setIsLoggedIn(true);
      try {
        const parsed = JSON.parse(authData);
        setUserName(parsed.userDetails?.name || "User");
      } catch (e) {
        setUserName("User");
      }
    } else {
      setIsLoggedIn(false);
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          if (currentScroll > 150) {
            setIsScrolled(true);
          } else if (currentScroll < 100) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNavigations = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/navigation/list`);

        if (res.data.status) {
          const activeNavs = res.data.data
            .filter(item => (item.status === 'active' || item.active === 'active'))
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

          setNavItems(activeNavs);
        }
      } catch (error) {
        console.error("Nav Fetch Error:", error);
      }
    };
    fetchNavigations();
  }, []);

  const handleNavigation = () => {
    setForceHideDropdown(true);
    setTimeout(() => {
      setForceHideDropdown(false);
    }, 300);
  };

  const handleInternalLink = (href) => {
    // const safePath = encodeURI(href.toLowerCase());
    navigate(href.toLowerCase());
    setMobileMenuOpen(false);
    setOpenCategory(null);
    handleNavigation();
  };

  const handleHtmlClick = (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      // console.log("🖱️ RAW HREF CLICKED:", href); // <--- LOG 1
      if (href && href.startsWith('/')) {
        e.preventDefault();

        const processedHref = href
          .toLowerCase()
          .replace(/&/g, 'and')    // '&' ko 'and' banao
          .replace(/\s+/g, '-')    // Spaces ko '-' banao
          .replace(/-+/g, '-');    // Double dash hatao
        // console.log("🚀 FINAL PROCESSED URL:", processedHref);
        handleInternalLink(processedHref);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setIsLoggedIn(false);
    setUserName("Guest");
    navigate("/login");
    window.location.reload();
  };

  const toggleCategory = (name) => setOpenCategory(openCategory === name ? null : name);

  const isSpecialLink = (name) => {
    return name && (name.toLowerCase().includes('sale') || name.toLowerCase().includes('offer'));
  };

  const handleDropdownEnter = (id) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    setActiveDropdown(id);
  };

  const handleDropdownLeave = () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchTerm)}`);
      setSearchDialogOpen(false);
    }
  };

  const openSearchDialog = () => {
    setSearchDialogOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <header className={`fixed top-0 z-50 w-full shadow-sm font-body transition-all duration-300 bg-gradient-to-r from-primary to-primary-dark text-text-light`}>

      {/* --- TOP ROW --- */}
      <div className={`border-b border-white/10 transition-all duration-300 ease-in-out relative z-20 bg-inherit ${isScrolled ? 'md:max-h-0 md:opacity-0 md:pointer-events-none py-2 md:py-0' : 'md:max-h-24 md:opacity-100 py-2 md:py-3'}`}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-2 md:gap-8">

          {/* Desktop Logo - Premium Brand */}
          <Link to="/" className="hidden lg:flex items-center shrink-0 group">
            <div className="flex items-center gap-3 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-10 h-10 object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)',
                  }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-semibold text-white tracking-wider uppercase font-montserrat">
                  Bagchee
                </span>
                <span className="text-[9px] font-medium tracking-[0.2em] text-white/80 uppercase font-montserrat">
                  Books That Stick
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile/Tablet Logo - Matching Desktop Style */}
          <Link to="/" className="lg:hidden shrink-0 group">
            <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-primary hover:bg-primary/90 rounded-lg sm:rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white flex items-center justify-center shadow-lg">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)',
                  }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm sm:text-lg font-bold text-white tracking-tight font-montserrat">
                  Bagchee
                </span>
                <span className="text-[7px] sm:text-[8px] font-medium tracking-wider text-white/80 uppercase font-montserrat">
                  Books That Stick
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 items-center max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  navigate(`/books?search=${encodeURIComponent(searchTerm)}`);
                }
              }}
              className="flex-1 relative group"
            >
              {/* Premium outer glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative flex items-center bg-white rounded-full shadow-xl border-2 border-gray-100 group-hover:border-primary/50 group-focus-within:border-primary/70 transition-all duration-300 overflow-hidden">
                {/* Input Field */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search books, authors, ISBNs, genres..."
                  className="flex-1 pl-6 pr-36 py-4 text-base font-body text-gray-800 placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                  autoComplete="off"
                />

                {/* Clear Button */}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-[120px] p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200 z-10"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}

                {/* Premium Search Button */}
                <button
                  type="submit"
                  disabled={!searchTerm.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white text-sm font-bold rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg disabled:hover:from-primary disabled:hover:to-secondary flex items-center gap-2 font-montserrat"
                >
                  <Search size={16} strokeWidth={2.5} />
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-text-light shrink-0">
            {/* Currency Dropdown */}
            <div className="hidden sm:flex items-center justify-center gap-1 cursor-pointer hover:text-accent transition-colors mr-2 group relative py-2 w-14">
              <span className="font-montserrat font-bold text-xs tracking-wide">{currency}</span>
              <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform duration-300" />
              <div className="absolute top-full right-0 pt-2 w-24 hidden group-hover:block z-50">
                <div className="bg-white shadow-xl rounded-md overflow-hidden border border-gray-100 py-1">
                  {currencies.map((c) => (
                    <div key={c} onClick={() => setCurrency(c)} className={`px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors text-text-main cursor-pointer flex items-center justify-between font-montserrat ${currency === c ? 'text-primary bg-primary/5' : ''}`}>{c}</div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={openSearchDialog} className="lg:hidden flex flex-col items-center justify-center px-2 sm:px-2.5 md:px-3 py-2 rounded-lg text-text-light hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20" aria-label="Search">
              <Search size={20} strokeWidth={2.5} className="mb-0.5" />
              {/* <span className="text-[9px] font-bold font-montserrat">Search</span> */}
            </button>

            {/* Search button ke baad aur Account icon se pehle sirf ye rahega */}
            <div className="hidden sm:block relative group">
              <Link to="/account/wishlist">
                <ActionIcon icon={<Heart size={20} />} label="Wishlist" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-text-main text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in font-montserrat">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Account Icon Desktop */}
            <div className="hidden md:flex relative group h-full items-center">
              <div className="cursor-pointer py-4">
                <ActionIcon icon={<User size={20} />} label="Account" />
              </div>
              <div className="absolute top-[85%] right-0 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top-right z-50 opacity-0 invisible transform translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 text-text-main">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-medium text-text-muted font-body">Hello, {isLoggedIn ? userName : "Guest"}</p>
                  <p className="text-xs font-bold text-primary mt-0.5 font-montserrat">{isLoggedIn ? "Welcome Back!" : "Welcome to Bagchee"}</p>
                </div>
                <div className="py-2">
                  {isLoggedIn ? (
                    <>
                      <Link to="/account" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"><User size={16} /> My Account</Link>
                      <Link to="/account/orders" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"><List size={16} /> Orders</Link>
                      <Link to="/account/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"><User size={16} /> Profile</Link>
                      <Link to="/account/address" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"><MapPin size={16} /> Address</Link>
                      <Link to="/account/wishlist" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"><Heart size={16} /> Wishlist</Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-text-main hover:bg-red-50 hover:text-red-600 transition-colors font-bold normal-case font-montserrat text-left"><LogOut size={16} /> Sign Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-montserrat"><LogIn size={16} /> <span className="font-medium">Login</span></Link>
                      <Link to="/register" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-montserrat"><UserPlus size={16} /> <span className="font-medium">Register</span></Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 🟢 MOBILE ACCOUNT DROPDOWN (Exactly like Desktop) */}
            <div className="block md:hidden relative">
              <button
                onClick={() => setMobileAccountOpen(!mobileAccountOpen)}
                className="relative z-50 pt-1"
              >
                <ActionIcon icon={<User size={22} />} label="Account" />
              </button>

              {/* Mobile Floating Menu Drawer */}
              {mobileAccountOpen && (
                <>
                  {/* Background overlay to close dropdown on outside tap */}
                  <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setMobileAccountOpen(false)}></div>

                  {/* The Dropdown Box (Positioned under icon) */}
                  <div className="absolute top-full right-[-10px] mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 z-50 text-text-main origin-top-right animate-in fade-in zoom-in">

                    {/* Header: User Detail */}
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-xs font-medium text-text-muted font-body">Hello, {isLoggedIn ? userName : "Guest"}</p>
                      <p className="text-xs font-bold text-primary mt-0.5 font-montserrat">{isLoggedIn ? "Welcome Back!" : "Welcome to Bagchee"}</p>
                    </div>

                    <div className="py-2">
                      {isLoggedIn ? (
                        <>
                          <Link to="/account" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat">
                            <User size={16} /> My Account
                          </Link>
                          <Link to="/account/orders" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat">
                            <List size={16} /> Orders
                          </Link>
                          <Link to="/account/profile" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat">
                            <User size={16} /> Profile
                          </Link>
                          <Link to="/account/address" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat">
                            <MapPin size={16} /> Address
                          </Link>
                          <Link 
  to="/account/wishlist" 
  onClick={() => setMobileAccountOpen(false)} 
  className="flex items-center justify-between px-5 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold normal-case font-montserrat"
>
  <div className="flex items-center gap-3">
    <Heart size={16} /> Wishlist
  </div>
  {/* 🟢 Badge right side me dikhega bilkul clean */}
  {wishlistCount > 0 && (
    <span className="bg-accent text-text-main text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
      {wishlistCount}
    </span>
  )}
</Link>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={() => { handleLogout(); setMobileAccountOpen(false); }} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-text-main hover:bg-red-50 hover:text-red-600 transition-colors font-bold normal-case font-montserrat text-left">
                            <LogOut size={16} /> Sign Out
                          </button>
                        </>
                      ) : (
                        <div className="px-4 py-2 space-y-2">
                          <Link to="/login" onClick={() => setMobileAccountOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-lg font-montserrat transition-transform active:scale-95">
                            <LogIn size={16} /> Login
                          </Link>
                          <Link to="/register" onClick={() => setMobileAccountOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary text-primary text-xs font-bold rounded-xl font-montserrat transition-transform active:scale-95">
                            <UserPlus size={16} /> Register
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <Link to="/cart">
                <ActionIcon icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />} label="Cart" />
                {/* 🟢 Static '2' ko cartItemCount se replace kiya */}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-text-main text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full font-montserrat shadow-sm animate-in zoom-in">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-text-light hover:text-accent transition-colors ml-1">
              <MenuIcon size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW (DESKTOP) --- */}
      <div className="hidden lg:block bg-white border-b-2 border-gray-100 relative" style={{ overflow: 'visible' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center justify-center gap-1 relative z-10">
            {navItems.map((nav, idx) => {
              const navName = nav.item || nav.name || "Link";
              const hasDropdown = nav.dropdown === 'active' && nav.dropdown_content;
              const dropdownId = `nav-${nav._id || idx}`;

              return (
                <div
                  key={nav._id || idx}
                  className="relative group/navitem"
                  onMouseEnter={() => hasDropdown && handleDropdownEnter(dropdownId)}
                  onMouseLeave={handleDropdownLeave}
                >
                  {/* Navigation Link */}
                  <Link
                    to={nav.link || "#"}
                    onClick={handleNavigation}
                    className={`relative flex items-center gap-2 px-5 py-4 text-sm tracking-wide transition-all duration-200 font-body group text-gray-800 hover:text-primary hover:bg-primary/5 ${activeDropdown === dropdownId ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <span className="relative">
                      {navName}
                      {/* Active underline indicator */}
                      <span
                        className={`absolute left-0 right-0 bottom-0 h-0.5 bg-primary transform origin-center transition-transform duration-300 ${
                          activeDropdown === dropdownId
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      ></span>
                    </span>
                    {hasDropdown && (
                      <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${activeDropdown === dropdownId ? 'rotate-180' : 'group-hover:rotate-180'}`}
                      />
                    )}
                  </Link>

                  {/* Dropdown Menu - Raw HTML Content Display */}
                  {hasDropdown && !forceHideDropdown && (
                    <div
                      className={`fixed left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden transition-all duration-200 ease-out origin-top z-50 ${
                        activeDropdown === dropdownId
                          ? 'opacity-100 visible scale-100 translate-y-0'
                          : 'opacity-0 invisible scale-95 -translate-y-2 pointer-events-none'
                      }`}
                      style={{ 
                        width: "70vw",
                        maxWidth: "70vw",
                        top: isScrolled ? "48px" : "140px",
                      }}
                    >
                      {/* Dropdown Content - Render HTML as-is */}
                      <DropdownContent
                        htmlContent={nav.dropdown_content}
                        onLinkClick={(href) => {
                          handleInternalLink(href);
                          setActiveDropdown(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* --- MOBILE Sidebar --- */}
      <Transition show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60] lg:hidden" onClose={setMobileMenuOpen}>
          <TransitionChild as={Fragment} enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex z-50">
            <TransitionChild as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <DialogPanel className="relative flex w-[85%] max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-2xl h-full border-r border-cream-200 text-text-main">

                {/* 🔵 Mobile Menu Header - CHANGED TO BLUE (Primary) */}
                <div className="flex px-5 pt-6 pb-4 justify-between items-center border-b border-primary-dark bg-primary">
                  <Logo className="h-10 w-auto text-white" /> {/* Logo white for blue bg */}
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white hover:text-accent hover:bg-primary-dark rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 px-4 py-4 space-y-2 font-montserrat">
                  {/* DYNAMIC MOBILE LIST */}
                  {navItems.map((nav) => {
                    const navName = nav.item || nav.name || "Link";
                    const hasDropdown = nav.dropdown === 'active' && nav.dropdown_content;
                    const isOpen = openCategory === navName;

                    return (
                      <div key={nav._id} className="border-b border-cream-100 last:border-0 pb-1">
                        {hasDropdown ? (
                          <>
                            <button
                              onClick={() => toggleCategory(navName)}
                              className={`flex w-full items-center justify-between py-3 text-base font-bold tracking-wide transition-colors ${isOpen ? 'text-primary' : 'text-text-main hover:text-primary'
                                }`}
                            >
                              {navName} <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
                            </button>

                            <div className={`pl-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                              <MobileHtmlAccordion
                                htmlContent={nav.dropdown_content}
                                onLinkClick={handleInternalLink}
                              />
                            </div>
                          </>
                        ) : (
                          <Link
                            to={nav.link}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block py-3 text-base font-bold tracking-wide text-text-main hover:text-primary `}
                          >
                            {navName}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Account & Currency */}
                <div className="flex px-5 pt-6 pb-6 justify-between items-start border-b border-cream-200 bg-cream-50 mt-auto gap-4">


                  <div className="relative">
                    <button onClick={() => setMobileCurrencyOpen(!mobileCurrencyOpen)} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors bg-white border border-cream-200 px-3 py-1.5 rounded-full h-8 shadow-sm">
                      <Globe size={14} /><span className="text-sm font-bold font-montserrat">{currency}</span><ChevronDown size={14} className={`transition-transform ${mobileCurrencyOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`absolute bottom-full right-0 mb-2 w-24 bg-white shadow-xl rounded-lg border border-cream-200 overflow-hidden transition-all duration-200 ${mobileCurrencyOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                      {currencies.map((c) => (
                        <div key={c} onClick={() => { setCurrency(c); setMobileCurrencyOpen(false); }} className={`px-4 py-2 text-xs font-bold hover:bg-cream-50 transition-colors text-text-main cursor-pointer text-center font-montserrat ${currency === c ? 'text-primary bg-primary/5' : ''}`}>{c}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* SEARCH DIALOG */}
      <Transition show={searchDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={setSearchDialogOpen}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 font-montserrat">Search Books</h3>
                    <button
                      onClick={() => setSearchDialogOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Search Form */}
                  <form onSubmit={handleSearchSubmit} className="p-6">
                    <div className="relative">
                      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title, author, ISBN..."
                        className="w-full pl-12 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body"
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!searchTerm.trim()}
                      className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white text-sm font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-montserrat"
                    >
                      Search
                    </button>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

    </header>
  );
};

const ActionIcon = ({ icon, label }) => (
  <div className="flex flex-col items-center cursor-pointer group text-text-light hover:text-accent transition-colors">
    {icon}
    <span className="text-[10px] font-bold mt-1 hidden lg:block opacity-80 group-hover:opacity-100 font-montserrat tracking-widest">{label}</span>
  </div>
);

export default PremiumHeader;