import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { USEFUL_LINKS } from "../../constants/usefulLinks";

const UsefulLinks = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getCurrentPageLabel = () => {
    const currentLink = USEFUL_LINKS.find((link) => isActive(link.path));
    return currentLink ? currentLink.label : "Useful Links";
  };

  return (
    <>
      {/* Mobile Dropdown Menu */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-cream-100 border border-gray-300 rounded-lg text-text-main font-medium hover:border-primary transition-colors"
          >
            <span className="truncate">Useful Links</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-cream-100 border border-gray-300 rounded-lg shadow-lg z-50">
              {USEFUL_LINKS.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  onClick={() => setIsDropdownOpen(false)}
                  className={`block px-4 py-3 text-sm transition-colors border-b last:border-b-0 ${
                    isActive(link.path)
                      ? "bg-primary text-white font-medium"
                      : "text-text-main hover:bg-cream-200/40"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <div className="bg-cream-100 border border-gray-200 rounded-lg shadow-sm p-6 sticky top-4">
          <h3 className="text-lg font-bold text-text-main mb-4 pb-3 border-b border-gray-200">
            Useful Links
          </h3>
          <nav className="space-y-0">
            {USEFUL_LINKS.map((link, index) => (
              <Link
                key={link.id}
                to={link.path}
                className={`block px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive(link.path)
                    ? "bg-primary text-white font-medium"
                    : "text-text-main hover:bg-cream-200/40 hover:text-primary"
                } ${index !== USEFUL_LINKS.length - 1 ? "" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default UsefulLinks;
