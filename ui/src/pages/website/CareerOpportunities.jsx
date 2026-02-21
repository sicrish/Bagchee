import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const CareerOpportunities = () => {
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
            <span className="text-gray-900 font-medium">
              Career Opportunities
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4 flex items-center justify-center gap-3">
              Career Opportunities
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* No Openings Message */}
          <section className="mb-12 md:mb-16">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-12 text-center shadow-sm">
              <p className="text-gray-700 font-body text-lg">
                There are no open positions at this time. Please check back
                later for future opportunities.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CareerOpportunities;
