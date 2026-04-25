import React, { useState, useEffect, useRef } from "react";
import { createSafeHtml } from '../../utils/sanitize';
import { Link, useNavigate } from "react-router-dom";
import {
  PackageSearch,
  UserCog,
  MapPin,
  Heart,
  MessageCircle,
  Mail,
  Truck,
  CreditCard,
  RefreshCcw,
  Users,
  Gift,
  HelpCircle,
  BookOpen,
  ShieldCheck, ChevronDown, ChevronRight, Search
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import axiosInstance from "../../utils/axiosConfig";

// import HelpDeskImg from "../../assets/images/website/helpdesk/helpdeskImg.avif";
// import HelpDeskImg from "../../assets/images/website/helpdesk/helpdesk.jpeg";
 import HelpDeskImg from "../../assets/images/website/helpdesk/helpdesk1.jpeg";




const HelpDesk = () => {
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);
  const [helpPages, setHelpPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch help pages from API
  useEffect(() => {
    const fetchHelpPages = async () => {
      try {
        const response = await axiosInstance.get("/help-pages/list");
        const activePages = response.data.data || [];

        setHelpPages(activePages);
        if (activePages.length > 0) {
          setActiveTab(String(activePages[0].id));
        }
      } catch (error) {
        console.error("Error fetching help pages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpPages();
  }, []);

  // Handle internal link clicks in HTML content
  useEffect(() => {
    if (!contentRef.current) return;

    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;
      if (href.startsWith("/")) {
        e.preventDefault();
        navigate(href);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener("click", handleClick);
    return () => {
      contentElement.removeEventListener("click", handleClick);
    };
  }, [navigate, activeTab]);

  const quickSolutions = [
    {
      id: 13,
      title: "View and Track Orders",
      icon: PackageSearch,
      link: "/account/orders",
    },
    {
      id: 14,
      title: "Change Password & Personal Info",
      icon: UserCog,
      link: "/account/profile",
    },
    { id: 15, title: "Update Address", icon: MapPin, link: "/account/address" },
    { id: 16, title: "View Wishlist", icon: Heart, link: "/account/wishlist" },
  ];

  const stillHaveQuestion = [
    {
      id: 17,
      title: "Contact via WhatsApp",
      icon: FaWhatsapp,
      link: "#",
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      id: 18,
      title: "Send us an Email",
      icon: Mail,
      link: "/contact-us",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
  ];

  const activeHelpPage = helpPages.find((page) => String(page.id) === activeTab);

  return (
    <div className="min-h-screen bg-cream">
      <section className="relative w-full flex items-center justify-center overflow-hidden border-b border-gray-200 aspect-[21/9] md:aspect-auto md:h-[400px]">
  
  {/* Background Image */}
  <div className="absolute inset-0 z-0">
    <img
      src={HelpDeskImg}
      alt="Help Center Background"
      // Mobile par object-contain (puri image), md par object-cover (box bharna)
      className="w-full h-full object-contain object-cover "
    />
    <div className="absolute inset-0 bg-white/60 md:bg-white/60"></div>
  </div>

  {/* Text & Search Bar */}
  <div className="relative z-10 w-full max-w-3xl px-4 text-center">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-main mb-2 md:mb-8 tracking-tight">
      Bagchee Help Center
    </h1>
  </div>
</section>
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          {/* <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-main mb-4 uppercase">
              Help Center
            </h1>
          </div> */}




          {/* ─── HELP CATEGORIES SECTION ─── */}
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {helpPages.map((page) => {

                // 🟢 Dynamic Icon Logic: Title ke basis par icon choose karna
                // Icon change karne ke liye yahan return kiye gaye icon ka naam badal dein
                const getIcon = (title) => {
                  const t = title.toLowerCase();
                  if (t.includes('order')) return PackageSearch;
                  if (t.includes('shipping') || t.includes('delivery')) return Truck;
                  if (t.includes('payment') || t.includes('pricing')) return CreditCard;
                  if (t.includes('return') || t.includes('refund')) return RefreshCcw;
                  if (t.includes('membership') || t.includes('account')) return Users;
                  if (t.includes('gift')) return Gift;
                  if (t.includes('library')) return BookOpen;
                  if (t.includes('privacy') || t.includes('security')) return ShieldCheck;
                  if (t.includes('contact')) return Mail;
                  return HelpCircle; // Default icon
                };

                const DynamicIcon = getIcon(page.title);

                return (
                  <Link
                    key={page.id}
                    to={`/help/${page.id}`}
                    className="bg-white border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group rounded-2xl relative overflow-hidden"
                  >
                    {/* Subtle Background Accent on Hover */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <div className="flex items-center gap-5 relative z-10">
                      {/* Icon Box (Modern Rounded Square instead of Circle) */}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-inner">
                          <DynamicIcon
                            className="w-7 h-7 text-primary group-hover:text-white transition-colors"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="flex flex-col text-left">
                        <h3 className="text-base md:text-lg font-display font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {page.description || `Get help and information regarding ${page.title.toLowerCase()}`}
                        </p>
                      </div>
                    </div>

                    {/* Arrow Indicator (New) */}
                    <div className="shrink-0 ml-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
          {/* ─── COMMON QUESTIONS SECTION (Accordion Style) ─── */}
          <section className="mt-16 mb-12 animate-fadeIn">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display italic text-text-main">
                Common Questions
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {helpPages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setActiveTab(activeTab === String(page.id) ? null : String(page.id))}
                    className="w-full flex items-center justify-between p-5 text-left group"
                  >
                    <span className={`font-display font-bold text-lg transition-colors ${activeTab === String(page.id) ? 'text-primary' : 'text-text-main'}`}>
                      {page.title}
                    </span>
                    <div className={`p-1 rounded-full transition-transform duration-300 ${activeTab === String(page.id) ? 'rotate-180 bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab === String(page.id) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="p-6 pt-0 border-t border-gray-50">
                      <div
                        className="prose prose-blue max-w-none text-gray-600 leading-relaxed font-body prose-headings:font-display prose-headings:text-text-main prose-p:mb-4 prose-strong:text-primary"
                        dangerouslySetInnerHTML={createSafeHtml(page.pageContent)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>


        </div>

        {/* ─── CONTACT CTA SECTION ─── */}
        <section className="mt-20 mb-12">
          <div className="max-w-3xl mx-auto text-center px-6 py-12 rounded-3xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 shadow-sm">
            {/* Decorative Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                {/* Decorative small circle */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full border-4 border-white"></div>
              </div>
            </div>

            {/* Text Content */}
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              Can't find what you're looking for? Our support team is here to help you with anything you need.
            </p>

            {/* Contact Button */}
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-display font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-1 active:scale-95"
            >
              Contact Us
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </Link>

            {/* Quick Links / Disclaimer */}
            <p className="mt-8 text-sm text-gray-400">
              Typically responds within 24 hours. By contacting us, you agree to our
              <Link to="/privacy-policy" className="underline ml-1 hover:text-primary">Privacy Policy</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpDesk;
