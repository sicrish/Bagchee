import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Accordion from "../../../components/website/Accordion";

const HelpSecureShopping = () => {
  const description =
    "We guarantee that shopping with Bagchee is safe. You never have to worry about the safety of your credit card information when shopping here. If unauthorized or fraudulent charges are ever made, you do not have to pay for them. Period.";

  const faqs = [
    {
      q: "Why shopping here is safe",
      a: "At Bagchee, protecting your information is fundamental. To ensure your information is safely guarded, we use Secure Sockets Layer (SSL) technology. When giving your credit card number, SSL encrypts all personal information including your card number, name and address. With this encryption, no one is allowed to decode your information.",
    },
    {
      q: "How can you be sure any connection is secure?",
      a: "Look for an unbroken-key icon or a closed-lock icon in your browser window after accessing a server. You will usually find the icon in the lower-right or lower-left corner of your browser window, but some browsers display the icon elsewhere (near the address bar, for instance). The key or lock icon indicates that SSL is active and your information secure. You can also double-check by looking at the URL line of your browser. When accessing a secure server, the first characters of the site address will change from 'http' to 'https'.",
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
            <span className="text-gray-900 font-medium">Secure Shopping</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Secure Shopping
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

export default HelpSecureShopping;
