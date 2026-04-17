'use client';

import React, { useState, useEffect, Fragment, useContext, useMemo, useRef, useCallback, memo } from 'react';
import { createSafeHtml } from '../../../../utils/sanitize';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu as MenuIcon, X, ChevronDown, Globe, LogIn, UserPlus, LogOut, List, MapPin, ChevronRight, Flame } from 'lucide-react';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import Logo from '../../../common/Logo.jsx';
import logoImg from '../../../../assets/images/common/logo.png';
import { CurrencyContext } from '../../../../context/CurrencyContext';
import { useCart } from '../../../../context/CartContext.jsx';
import axios from '../../../../utils/axiosConfig.js';

/* ---------------------------------------------------------
  🟢 HELPER COMPONENT: Dropdown Content Renderer (Memoized)
  --------------------------------------------------------- */
const DropdownContent = memo(({ htmlContent, onLinkClick }) => {
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
      dangerouslySetInnerHTML={createSafeHtml(htmlContent)}
      style={{
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    />
  );
});

DropdownContent.displayName = 'DropdownContent';

/* ---------------------------------------------------------
  🟢 HELPER COMPONENT: Mobile HTML Parser & Accordion (Memoized)
  --------------------------------------------------------- */
const MobileHtmlAccordion = memo(({ htmlContent, onLinkClick }) => {
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
        dangerouslySetInnerHTML={createSafeHtml(htmlContent)}
      />
    );
  }

  return (
    <div className="flex flex-col w-full bg-white rounded-lg border border-cream-200 mt-2 overflow-hidden">
      {sections.map((section, idx) => (
        <div key={idx} className="border-b border-cream-100 last:border-0">
          <button
            onClick={() => toggleSection(section.title)}
            className={`w-full flex items-center justify-between py-3 px-4 text-xs font-bold normal-case tracking-slick transition-colors font-montserrat ${openSection === section.title
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
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === section.title
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
                      const processedHref = link.href
                        .replace(/&/g, "and")
                        .replace(/\s+/g, "-")
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
});

MobileHtmlAccordion.displayName = 'MobileHtmlAccordion';

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
  const [forceHideDropdown, setForceHideDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // 🟢 NEW STATE: Mobile Search Dropdown Track Karne Ke Liye
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP'];
  const [mobileCurrencyOpen, setMobileCurrencyOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest");

  const dropdownTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null); // Separate ref for mobile input

  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // React Query implementation for Navigation Links
  const { data: navItems = [] } = useQuery({
    queryKey: ['navigationList'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/navigation/list`);
      if (res.data.status) {
        return res.data.data
          .filter(item => item.active === true || item.active === 'active' || item.status === 'active')
          .sort((a, b) => (Number(a.ord) || Number(a.order) || 0) - (Number(b.ord) || Number(b.order) || 0));
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

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

  const handleNavigation = useCallback(() => {
    setForceHideDropdown(true);
    setTimeout(() => {
      setForceHideDropdown(false);
    }, 300);
  }, []);

  const handleInternalLink = useCallback((href) => {
    navigate(href.toLowerCase());
    setMobileMenuOpen(false);
    setOpenCategory(null);
    handleNavigation();
  }, [navigate, handleNavigation]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("auth");
    setIsLoggedIn(false);
    setUserName("Guest");
    navigate("/");
    window.location.reload();
  }, [navigate]);

  const toggleCategory = useCallback((name) => {
    setOpenCategory(prev => prev === name ? null : name);
  }, []);

  const handleDropdownEnter = useCallback((id) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    setActiveDropdown(id);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  // Suggestions Fetch Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?keyword=${searchTerm.trim()}&limit=8`);
        if (res.data.status) {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        console.error("Suggestion API Error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Manual Search Submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/books?keyword=${encodeURIComponent(searchTerm.trim())}`);
      setSuggestions([]);
      setIsMobileSearchVisible(false); // Mobile dropdown close on search
    }
  };

  return (
    <header className={`fixed top-0 z-50 w-full shadow-sm font-body transition-all duration-300 bg-gradient-to-r from-primary to-primary-dark text-text-light`}>

      {/* --- TOP ROW --- */}
      {/* 🟢 z-index z-50 diya hai taki dropdown iske niche se slide ho */}
      <div className={`border-b border-white/10 transition-all duration-300 ease-in-out relative z-50 bg-inherit py-2 md:py-3 md:max-h-24 md:opacity-100`}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-2 md:gap-8">

          {/* Desktop Logo */}
          <Link to="/" className="hidden lg:flex items-center shrink-0 group">
            <div className="flex items-center gap-3 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-10 h-10 object-contain"
                  fetchPriority="high"
                  decoding="async"
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

          {/* Mobile/Tablet Logo */}
          <Link to="/" className="lg:hidden shrink-0 group">
            <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-primary hover:bg-primary/90 rounded-lg sm:rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white flex items-center justify-center shadow-lg">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                  fetchPriority="high"
                  decoding="async"
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
                e.stopPropagation();
                handleSearchSubmit(e);
              }}
              className="flex-1 relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative flex items-center bg-white rounded-full shadow-xl border-2 border-gray-100 group-hover:border-primary/50 group-focus-within:border-primary/70 transition-all duration-300 overflow-visible">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, keyword or ISBN"
                      className="flex-1 pl-6 pr-36 py-4 text-base font-body text-gray-800 
  placeholder:font-montserrat 
  placeholder:tracking-[0.15em] 
  placeholder:text-[9px] 
  placeholder:text-gray-400
  bg-transparent border-0 focus:outline-none focus:ring-0"
                  autoComplete="off"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-[135px] p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200 z-10"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!searchTerm.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white text-sm font-bold rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg flex items-center gap-2 font-montserrat"
                >
                  <Search size={16} strokeWidth={2.5} />
                  Search
                </button>

                {/* Desktop LIVE SUGGESTIONS DROPDOWN */}
                <SearchSuggestions
                  suggestions={suggestions}
                  isSearching={isSearching}
                  searchTerm={searchTerm}
                  onSelect={() => { setSuggestions([]); setSearchTerm(""); }}
                />
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

            {/* 🟢 NEW MOBILE SEARCH TOGGLE BUTTON (Search / X icon) */}
            <button
              onClick={() => {
                if (isMobileSearchVisible) {
                  setIsMobileSearchVisible(false);
                  setSearchTerm("");
                  setSuggestions([]);
                } else {
                  setIsMobileSearchVisible(true);
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 300); // Wait for dropdown animation
                }
              }}
              className="lg:hidden flex flex-col items-center justify-center px-2 sm:px-2.5 md:px-3 py-2 rounded-lg text-text-light hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20"
              aria-label="Search"
            >
              {isMobileSearchVisible ? (
                <X size={24} strokeWidth={2.5} className="text-accent transition-transform duration-300 rotate-90" />
              ) : (
                <Search size={22} strokeWidth={2.5} className="mb-0.5" />
              )}
            </button>

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
                      <Link to="/login" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-montserrat"><LogIn size={16} /> <span className="font-medium">LOGIN</span></Link>
                      <Link to="/register" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-montserrat"><UserPlus size={16} /> <span className="font-medium">REGISTER</span></Link>
                      <Link to="/trace-order" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors font-montserrat"><Search size={16} /> <span className="font-medium">TRACE ORDER</span></Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* MOBILE ACCOUNT DROPDOWN */}
            <div className="block md:hidden relative">
              <button
                onClick={() => setMobileAccountOpen(!mobileAccountOpen)}
                className="relative z-50 pt-1"
              >
                <ActionIcon icon={<User size={22} />} label="Account" />
              </button>

              {mobileAccountOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setMobileAccountOpen(false)}></div>
                  <div className="absolute top-full right-[-10px] mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 z-50 text-text-main origin-top-right animate-in fade-in zoom-in">
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
                            <LogIn size={16} /> LOGIN
                          </Link>
                          <Link to="/register" onClick={() => setMobileAccountOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary text-primary text-xs font-bold rounded-xl font-montserrat transition-transform active:scale-95">
                            <UserPlus size={16} /> REGISTER
                          </Link>
                          <Link to="/trace-order" onClick={() => setMobileAccountOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary text-primary text-xs font-bold rounded-xl font-montserrat transition-transform active:scale-95">
                            <Search size={16} /> TRACE ORDER
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

      {/* 🟢 NEW MOBILE DROPDOWN SEARCH BAR (Slides down from header) */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-b-4 border-primary/20 transition-all duration-300 ease-in-out z-40 overflow-visible ${isMobileSearchVisible ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'
          }`}
      >
        <div className="p-3 bg-cream-50 border-b border-gray-200">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 relative z-50">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-10 pr-4 py-3 text-sm text-text-main bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-body shadow-inner"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="bg-primary text-white px-5 py-3 rounded-lg text-xs font-bold font-montserrat shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              SEARCH
            </button>
          </form>

          {/* Mobile Suggestions Dropdown */}
          <div className="relative z-50">
            <SearchSuggestions
              suggestions={suggestions}
              isSearching={isSearching}
              searchTerm={searchTerm}
              onSelect={() => {
                setSuggestions([]);
                setSearchTerm("");
                setIsMobileSearchVisible(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW (DESKTOP) --- */}
      <div className="hidden md:block bg-white border-b-2 border-gray-100 relative" style={{ overflow: 'visible' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center justify-center gap-1 lg:gap-2 py-1.5 md:py-2 relative z-10">
            {navItems.map((nav, idx) => {
              const navName = nav.item || nav.name || "Link";
              const hasDropdown = (nav.hasDropdown === true || nav.dropdown === 'active') && (nav.dropdownContent || nav.dropdown_content);
              const dropdownId = `nav-${nav._id || idx}`;

              const isSale = navName.toLowerCase().includes('sale');
              const isGift = navName.toLowerCase().includes('gift');

              return (
                <div
                  key={nav._id || idx}
                  className="relative group/navitem flex items-center h-full px-0.5"
                  onMouseEnter={() => hasDropdown && handleDropdownEnter(dropdownId)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    to={nav.itemLink || nav.link || "#"}
                    onClick={handleNavigation}
                    className={`relative flex items-center transition-all duration-300 font-bold font-montserrat rounded-full whitespace-nowrap
                      
                    /* 🟢 RESPONSIVE SIZING: Tablet vs Desktop */
                    px-2 py-1.5           /* Tablet default */
                    lg:px-5 lg:py-2       /* Desktop back to normal */
                    text-[10px]           /* Choti tablet screens ke liye */
                    min-[850px]:text-xs   /* Medium screens ke liye */
                    lg:text-sm            /* Full Desktop screens ke liye */
                    tracking-tighter lg:tracking-normal
                
                /* 🔵 NORMAL LINKS: Capsule Style (Always Visible) */
                ${!isSale && !isGift ? `
                  ${activeDropdown === dropdownId
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary-50 text-primary-dark hover:bg-primary hover:text-white hover:shadow-md'}
                ` : ''}

                /* 🎁 E-GIFT CARD */
                ${isGift ? 'bg-accent/10 border border-accent/20 text-gray-800 hover:bg-accent hover:text-text-main' : ''}
                
                /* 🔴 SALE */
             
                /* 🔴 SALE: Wapas wahi purana logic */
                ${isSale ? 'bg-red-600 !text-white rounded-full hover:bg-text-main shadow-sm' : ''}
              `}
                  >
                    <span className="relative flex items-center">
                      {/* Sale Pulse Dot */}
                      {isSale && (
                        <span className="flex h-2 w-2 mr-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      )}
                      <span className="z-10">{navName}</span>
                    </span>

                    {hasDropdown && (
                      <ChevronDown
                        size={14}
                        strokeWidth={3}
                        className={`ml-1 transition-transform duration-300 ${activeDropdown === dropdownId ? 'rotate-180' : 'group-hover/navitem:rotate-180'}`}
                      />
                    )}
                  </Link>

                  {hasDropdown && !forceHideDropdown && (
                    <div
                      className={`fixed left-1/2 -translate-x-1/2 bg-white rounded-b-xl shadow-2xl border-x border-b border-gray-200 overflow-hidden transition-all duration-200 ease-out origin-top z-50 ${activeDropdown === dropdownId ? 'opacity-100 visible scale-100 translate-y-0' : 'opacity-0 invisible scale-95'
                        }`}
                      style={{
                        width: "70vw",
                        maxWidth: "1200px",
                        top: "146px",
                      }}
                    >
                      <div className={`h-1 w-full ${isSale ? 'bg-red-600' : 'bg-primary'}`}></div>
                      <DropdownContent
                        htmlContent={nav.dropdownContent || nav.dropdown_content}
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

                <div className="flex px-5 pt-6 pb-4 justify-between items-center border-b border-primary-dark bg-primary">
                  <Logo className="h-10 w-auto text-white" />
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white hover:text-accent hover:bg-primary-dark rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 px-4 py-4 space-y-2 font-montserrat">
                  {navItems.map((nav) => {
                    const navName = nav.item || nav.name || "Link";
                    const hasDropdown = (nav.hasDropdown === true || nav.dropdown === 'active') && (nav.dropdownContent || nav.dropdown_content);
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
                                htmlContent={nav.dropdownContent || nav.dropdown_content}
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

    </header>
  );
};

// 🟢 ActionIcon wrapped in memo to prevent re-renders when parent states change
const ActionIcon = memo(({ icon, label }) => (
  <div className="flex flex-col items-center cursor-pointer group text-text-light hover:text-accent transition-colors">
    {icon}
    <span className="text-[10px] font-bold mt-1 hidden lg:block opacity-80 group-hover:opacity-100 font-montserrat tracking-widest">{label}</span>
  </div>
));
ActionIcon.displayName = 'ActionIcon';

/* ---------------------------------------------------------
   🟢 REUSABLE SEARCH SUGGESTIONS (Desktop & Mobile)
   --------------------------------------------------------- */
const SearchSuggestions = memo(({ suggestions, isSearching, searchTerm, onSelect }) => {
  if (searchTerm.length < 3) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 rounded-b-xl">
      {isSearching ? (
        <div className="p-4 text-xs text-gray-500 italic flex items-center gap-2 font-body">
          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
          Searching matching items...
        </div>
      ) : suggestions.length > 0 ? (
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar font-body">
          {suggestions.map((item) => {
            let typeLabel = "Item";
            let displayTitle = item.title || item.categorytitle || "Unnamed";
            let subText = "";

            if (item.isbn13) {
              typeLabel = "Book";
              subText = item.author ? `by ${item.author.first_name} ${item.author.last_name}` : "";
            } else if (item.categorytitle) {
              typeLabel = "Category";
            } else if (item.first_name) {
              typeLabel = "Author";
              displayTitle = `${item.first_name} ${item.last_name}`;
            }

            return (
              <Link
                key={item._id}
                to={`/books?keyword=${encodeURIComponent(displayTitle)}`}
                onClick={() => onSelect()}
                className="flex items-center justify-between px-4 py-3 hover:bg-cream-50 transition-colors border-b border-gray-50 last:border-0 group"
              >
                <div className="flex flex-col truncate pr-4">
                  <span className="text-sm font-semibold text-text-main group-hover:text-primary truncate">
                    {displayTitle}
                  </span>
                  {subText && <span className="text-[10px] text-gray-400 italic">{subText}</span>}
                </div>

                <span className="text-[9px] font-black text-white uppercase tracking-tighter shrink-0 bg-primary/40 px-1.5 py-0.5 rounded shadow-sm group-hover:bg-primary transition-colors font-montserrat">
                  {typeLabel}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-xs text-gray-500 text-center font-body">
          No matches found for "<span className="font-bold">{searchTerm}</span>"
        </div>
      )}
    </div>
  );
});
SearchSuggestions.displayName = 'SearchSuggestions';

export default PremiumHeader;
