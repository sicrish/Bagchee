import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpYourAccount = () => {
  const faqs = [
    {
      q: "How to change your email address?",
      a: "Sign in to My Account, then click profile. You can then enter your new email address and save your changes. Your email address is your username on Bagchee.com, so it's important that you use an active email address when placing orders. We send your order confirmations and customer service communications to the email address specified on your account."
    },
    {
      q: "How to change your Password?",
      a: "You can change the password associated with your Bagchee account. Sign in to My Account, then click Profile. You can then enter your new password and save your changes."
    },
    {
      q: "How can I manage my address book?",
      a: "You can edit, delete or add shipping addresses in your Bagchee.com account. Sign in to My Account, then click Manage Address."
    },
    {
      q: "How can you view your order history?",
      a: "Sign in to My Account from the top of any page and view the Order History tab. You'll see your most recent orders and their current status, such as 'Pending' or 'Completed.' Click the Details button to view more information about the order including trade Order option."
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
            <span className="text-gray-900 font-medium">Your Account</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Your Account
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

export default HelpYourAccount;
