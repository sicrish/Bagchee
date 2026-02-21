import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpCommonQuestions = () => {
  const faqs = [
    {
      q: "How do I trace and track my order?",
      a: "For guest orders, enter your order number and email address at Trace My Order page. Returning customers, enter your email address and password at Trace My Order page."
    },
    {
      q: "How do I receive free shipping?",
      a: "Shipping is free every day for orders with an order value of $50. For orders with an order value of $49.99 or less, we offer the low flat rate of $12 per book."
    },
    {
      q: "Can I change or add to my order after it has been placed?",
      a: "Yes, but only for an hour after the order was placed. Your options are to: Contact us via Contact form. Please note: We are unable to make changes once order is shipped."
    },
    {
      q: "How do I cancel my order?",
      a: "Orders can only be canceled within an hour of being placed. Your options are to: 1. Sign In in to your personal shopping account and click 'Order' to cancel your order. 2. Contact us via Contact form. Please note: We are unable to cancel orders once order has been shipped."
    },
    {
      q: "How do I make a return or exchange?",
      a: "If you're not satisfied with any item or you want to exchange, you can return your order within 10 days of receiving it. You must send the parcel back to us within 14 days. Once we get it, you'll be refunded the price of the item(s) within 14 days. You'll be responsible for the cost of returning the item to us, unless we delivered it to you in error or it is faulty. It is your responsibility to ensure safe return of the item(s) to us. If you return a high-value item, we recommend you use a recorded delivery service. We'll refund the same means of payment as you used to make your purchase."
    },
    {
      q: "How can I contact Customer Service?",
      a: "The best way to contact us is by filling in the online contact form. The form is designed to help you specify the problem or the query and then direct it to the member of staff best suited to deal with it. We are always keen to hear from you and help with any queries or problems. We endeavour to answer all queries within 2-24 hours."
    },
    {
      q: "Which countries do you deliver to?",
      a: "We currently ship to almost all countries with free delivery of orders over $50."
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
            <span className="text-gray-900 font-medium">Common Questions</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Common Questions
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

export default HelpCommonQuestions;
