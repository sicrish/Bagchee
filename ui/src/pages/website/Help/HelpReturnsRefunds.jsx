import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpReturnsRefunds = () => {
  const faqs = [
    {
      q: "How do you make a return or exchange?",
      a: "If you're not satisfied with any item or you want to exchange, you can return your order within 10 days of receiving it. you must send the parcel back to us within 14 days. Once we get it, you'll be refunded the price of the item(s) within 14 days. You'll be responsible for the cost of returning the item to us, unless we delivered it to you in error or it is faulty. It is your responsibility to ensure safe return of the item(s) to us. Contact us or get in touch with Customer Services for details of the address to use for your return. If you no longer have your receipt slip to hand, please ensure that you include a note in the parcel with details of your name, address and order number. Failure to include these details may result in your return remaining unprocessed. Please ensure you obtain a proof of posting receipt. We recommend you use a registered mail service that includes insurance, as we cannot give you a refund if we do not receive the book, or if it becomes damaged in transit."
    },
    {
      q: "Damaged or incorrect book(s)",
      a: "If your book(s) has arrived damaged or if we have sent you the wrong book(s) please contact us and include the order number and details. Please do not return your damaged or incorrect book until you have received a response to your email from customer services."
    },
    {
      q: "How will you be refunded?",
      a: "Bagchee will refund the returned book(s) upon receipt, via the same method that you originally use to pay for the book(s). Please be aware that refunds can take up to 30 days to appear on your statement."
    },
    {
      q: "Can I change my delivery address after I've ordered?",
      a: "We understand that everyone makes mistakes and occasionally you may want to amend an order. If this is the case, please use the form on our Contact Us page as quickly as possible, sending us as much information as you can so that we can do our best to help. However, if the order is already shipped, then we may not be able to change the details."
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
            <span className="text-gray-900 font-medium">Return and Refunds</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Return and Refunds
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

export default HelpReturnsRefunds;
