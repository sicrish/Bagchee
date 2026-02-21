import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import UsefulLinks from "../../components/website/UsefulLinks";

const UsefulLinksPage = () => {
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
            <span className="text-gray-900 font-medium">Useful Links</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          {/* Useful Links Sidebar */}
          <div className="md:col-span-1">
            <UsefulLinks />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
                Useful Links
              </h1>
              <div className="w-20 h-1 bg-primary mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsefulLinksPage;
