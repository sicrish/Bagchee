import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import icon13 from "../../assets/images/website/helpdesk/icon13.png";
import icon14 from "../../assets/images/website/helpdesk/icon14.png";
import icon15 from "../../assets/images/website/helpdesk/icon15.png";
import icon16 from "../../assets/images/website/helpdesk/icon16.png";
import icon17 from "../../assets/images/website/helpdesk/icon17.png";
import icon18 from "../../assets/images/website/helpdesk/icon18.png";

const HelpDesk = () => {
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [helpPages, setHelpPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch help pages from API
  useEffect(() => {
    const fetchHelpPages = async () => {
      try {
        const response = await axiosInstance.get("/help-pages/list");
        // Filter only active pages and sort alphabetically
        const activePages = response.data.data
          .filter((page) => page.status === "active")
          .sort((a, b) => a.title.localeCompare(b.title));

        setHelpPages(activePages);
        // Set first page as active tab
        if (activePages.length > 0) {
          setActiveTab(activePages[0]._id);
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

      // Check if it's an internal link
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
      title: "View and track orders",
      image: icon13,
      link: "/account/orders",
    },
    {
      id: 14,
      title: "Change Password & Personal Info",
      image: icon14,
      link: "/account/profile",
    },
    {
      id: 15,
      title: "Update Address",
      image: icon15,
      link: "/account/address",
    },
    {
      id: 16,
      title: "View WishList",
      image: icon16,
      link: "/account/wishlist",
    },
  ];

  const stillHaveQuestion = [
    { id: 17, title: "Contact by Whatsapp", image: icon17, link: "#" },
    { id: 18, title: "Email Form", image: icon18, link: "/contact-us" },
  ];

  // Get active help page
  const activeHelpPage = helpPages.find((page) => page._id === activeTab);

  return (
    <div className="min-h-screen bg-cream">

      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Help & Support</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              Find answers to your questions and get the support you need
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 text-base md:text-lg bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-center text-gray-500 mt-2 text-sm">
                Press Enter to search or browse the categories below
              </p>
            )}
          </div>

          {/* Horizontal Tabs */}
          <section className="mb-8">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading help topics...</p>
              </div>
            ) : helpPages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No help topics available at the moment.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {helpPages.map((page) => (
                  <button
                    key={page._id}
                    onClick={() => setActiveTab(page._id)}
                    className={`px-4 md:px-6 py-3 rounded-lg border-2 transition-all duration-300 ${
                      activeTab === page._id
                        ? "bg-primary text-white border-primary shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:shadow-md"
                    }`}
                  >
                    <span className="font-display font-semibold text-sm md:text-base">
                      {page.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Help Content Section */}
          <section className="mb-12 md:mb-16">
            <div className="max-w-4xl mx-auto">
              {activeHelpPage && (
                <>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6 text-center">
                    {activeHelpPage.title}
                  </h2>
                  <div
                    ref={contentRef}
                    className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm prose prose-sm md:prose-base max-w-none"
                    dangerouslySetInnerHTML={{ __html: activeHelpPage.content }}
                  />
                </>
              )}
            </div>
          </section>

          {/* Quick Solutions Section */}
          <section className="mb-12 md:mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                Quick Solutions
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {quickSolutions.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="bg-cream-50 rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mb-3 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-sm md:text-base font-display font-bold text-text-main mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto" />
                </Link>
              ))}
            </div>
          </section>

          {/* Still Have Questions Section */}
          <section className="mb-12 md:mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                Still Have Questions?
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
              {stillHaveQuestion.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="bg-cream-50 rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mb-3 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-sm md:text-base font-display font-bold text-text-main mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpDesk;
