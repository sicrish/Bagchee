import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpShippingDelivery = () => {
  const faqs = [
    {
      q: "How do I receive free shipping?",
      a: "Shipping is free every day for orders with an order value of $50. For orders with an order value of $49.99 or less, we offer the low flat rate of $12 per book."
    },
    {
      q: "Which countries do you deliver to?",
      a: "We currently ship to the all countries with free delivery of orders over $50."
    },
    {
      q: "When Will I Receive My Order?",
      a: "The expected delivery time for each item is clearly listed on each product page and in checkout. In 12-15 Business days Standard Delivery, Postal services vary around the world and delivery speed depends on the delivery country and the item you are ordering. Sometimes, we upgrade standard delivery orders to express delivery when order is over $300 or for heavy shipments. In 2-4 Express Delivery, we ship products via Trackable Courier Service."
    },
    {
      q: "How do I trace and track my order?",
      a: "For guest orders, enter your order number and email address at Trace My Order. Returning customers orders, enter your email address and password at Trace My Order."
    },
    {
      q: "Why is the delivery time for some items longer than others and listed on product page?",
      a: "Bagchee has a selection of about 200,000 popular titles waiting for you in a local warehouse and distribution centre. It's possible that your item is delivered from a different warehouse or in some cases direct from the publisher, which requires a little extra time."
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
            <span className="text-gray-900 font-medium">Shipping & Delivery</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Shipping & Delivery
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

export default HelpShippingDelivery;
