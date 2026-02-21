import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpPaymentPricing = () => {
  const faqs = [
    {
      q: "What are your Payment options?",
      a: "You can pay using MasterCard credit or debit cards, Visa credit or debit cards, Discover, or PayPal. We also accept Payments via wire transfer, purchase order, unesco coupons, international money orders, western union or via moneygram."
    },
    {
      q: "How we price our books?",
      a: "Prices listed include VAT (if applicable) and delivery is FREE to all countries on order over $50. We display prices in US Dollars and in Euro. Just select the right currency for you in top right of website. We try to offer the most competitive prices at all times, so our prices frequently change. The prices displayed in checkout on the confirmation page / email will be those charged."
    },
    {
      q: "What is our Coupon Policy?",
      a: "Promotions apply to listed titles only, which are subject to change and availability. If you choose to purchase a product from a multi-buy offer, but do not purchase enough products to qualify for the special discount, the product will be charged at the normal price. Please note that on 3 for 2 promotions (and other multi-buy offers), the lowest priced title will always be the 'free' item. Coupons may not be combined with any other offer or coupon. Coupons may not be used toward the purchase of gift cards, magazine subscriptions, and coupon codes may be valid only for the email address associated with your account. If you choose to return a portion of your purchase, or cancel an item from your order, the coupon discount will no longer be valid."
    }
  ];

  return (
    <div className="min-h-screen bg-cream">
      
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/help" className="hover:text-primary transition-colors">Help</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Payment, Pricing & Promotions</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Payment, Pricing & Promotions
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
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
                <Link to="/help" className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold">
                  Back to Help Center
                </Link>
                <Link to="/contact-us" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold">
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

export default HelpPaymentPricing;
