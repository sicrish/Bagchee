import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpOrdering = () => {
  const faqs = [
    {
      q: "What Forms Of Payment Do You Accept?",
      a: "We'll gladly accept Visa, MasterCard, American Express, Discover Card, JCB Card, and PayPal for all orders. We also accept Wire Transfer, Purchase Orders from libraries and institutions, International Money Orders, Unesco Coupons, Moneygram. If you have questions or concerns about credit card security on our Web site, check out our Safe Shopping Guarantee."
    },
    {
      q: "How Do I Open An Account And Get A Password?",
      a: "You can open a new account on the Create an Account page, or you will be prompted to open an account by placing your first order with us. During the ordering process, you will create your own Bagchee password."
    },
    {
      q: "Can I Have My Order Shipped To An Address Different From My Own?",
      a: "We can ship your order to just about any address you give us. When you place your order, you'll be asked to enter both a shipping and billing address—they don't need to be the same. See our Shipping Information page for more details."
    },
    {
      q: "How Long Do Items Stay In My Cart?",
      a: "One or more items added to your cart during a previous visit to our site may still appear in your cart. Any item added to your cart is reserved for you for 30 days but may be sold to others after that time. If you have to leave your Shopping Cart, it is best to return and complete your order as soon as possible."
    },
    {
      q: "How Can I Reset My Password?",
      a: "If you've forgotten your password, click the Forgot My Password link where you're logging in. You will be asked for the e-mail address on your account so we may send you password reset information."
    },
    {
      q: "How Do I Order Multiple Copies Of An Item?",
      a: "If you want more than one copy of a particular item, scroll through the search results for additional copies. To get the specific copies you want, add each item to your Shopping Cart. In cart, you can increase the quantity by changing the number in the quantity box in your cart and then clicking the Update button under your selections. Then place your order when you have finished making your selections."
    },
    {
      q: "How to use a purchase order on Bagchee.com?",
      a: "Libraries may use online ordering with www.bagchee.com using Purchase Order/Invoice payment option during checkout. Libraries/institutes wish to send purchase order via email/fax/mail can use following options. Purchase Order via Email: You may send your Purchase orders via email at email@bagchee.com. Purchase order via Fax: 1-617-275-1050 (Fax should be sent in attention of Bagchee.com). Purchase Order via Mail: You may send order to Bagchee.com, 4384/4A Ansari Road, New Delhi 110 002, India."
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
            <span className="text-gray-900 font-medium">Ordering</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Ordering
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

export default HelpOrdering;
