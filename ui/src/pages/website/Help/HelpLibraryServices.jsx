import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Accordion from "../../../components/website/Accordion";

const HelpLibraryServices = () => {
  const description =
    "At Bagchee, we understand the unique needs of library acquisitions departments and collection-development specialists. Since 1990, we've worked with world's finest libraries to help them find and acquire the Indian and south Asian titles they need. Today, more than 500 libraries use Bagchee as a primary source for Indian and South Asian titles, and large replacement and collection-development projects—as well as a source for unfilled and canceled firm orders. To know more about about Library Services please see our library services page.";

  const faqs = [
    {
      q: "How to use a purchase order on Bagchee.com?",
      a: "1. Create a Bagchee.com account if you don't already have an account, create one here. 2. Select the books you want to buy and add them to your cart. 3. Click on the 'Proceed to checkout' button and choose 'Purchase Order' for the payment type. Complete your order. 4. Receive and Pay Invoice. After the order is placed, we will send out an invoice via email or fax. Terms are net 30. Purchase Order via Email: You may send your Purchase orders via email at email@bagchee.com. Purchase order via Fax: 1-617-275-1050 (Fax should be sent in attention of Bagchee.com). Purchase Order via Mail: You may send order to Bagchee.com, 4384/4A Ansari Road, New Delhi 110 002, India.",
    },
    {
      q: "Do you offer Blanket Approval Plan for Indian and south Asian titles?",
      a: "Yes. We offer approval plan for Indian and south asian titles for libraries worldwide. Please see details of our approval plans here.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream">

      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/help" className="hover:text-primary transition-colors">
              Help
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Library Services</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Library Services
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* description */}
          <div className="mb-12 md:mb-16 ">
            <p className="text-gray-600 text-base md:text-lg font-body">
              {description}
            </p>
          </div>

          <section className="mb-12 md:mb-16">
            <Accordion items={faqs} />
          </section>

          <section className="mt-12 md:mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-8 md:p-10 text-center shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                Need More Help?
              </h2>
              <p className="text-gray-600 font-body mb-6 max-w-2xl mx-auto">
                Browse other help topics or contact our customer support team.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  to="/help"
                  className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold"
                >
                  Back to Help Center
                </Link>
                <Link
                  to="/contact-us"
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpLibraryServices;
