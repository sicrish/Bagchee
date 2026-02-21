import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Package, Globe, ArrowRight } from 'lucide-react';
import UsefulLinks from '../../components/website/UsefulLinks';

const FreeDelivery = () => {
  const faqs = [
    {
      q: "How do I receive free Delivery Worldwide?",
      a: "Bagchee offers free 10-15 business day delivery worldwide on all direct orders of $50 or more (excludes monogramming, embroidery, gift boxing, membership, shipping, taxes and duties), regardless of size or destination. For orders with an order value of $49.99 or less, we offer the low flat rate of $12 per book."
    },
    {
      q: "What do I have to do?",
      a: "Place at least $50 of items in your bag. Proceed to Checkout; '10-15 Days shipping' will be pre-selected. Complete your Checkout."
    },
    {
      q: "Do you upgrade Standard delivery to Express delivery?",
      a: "Sometimes, we upgrade standard delivery orders to express delivery when order is over $300 or for heavy shipments. In 2-4 Express Delivery, we ship products via Trackable Courier Service."
    },
    {
      q: "Which countries do you deliver to?",
      a: "We currently ship to the all countries except Pakistan, North Korea. with free delivery of orders over $50."
    }
  ];

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
            <span className="text-gray-900 font-medium">Free Delivery</span>
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
            <div className="max-w-4xl">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4 flex items-center justify-center gap-3">
              Free Delivery Worldwide
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* FAQ Section */}
          <section className="mb-12 md:mb-16">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm"
                >
                  <h3 className="text-lg font-display font-bold text-text-main mb-3">
                    Q: {faq.q}
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-body">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeDelivery;
