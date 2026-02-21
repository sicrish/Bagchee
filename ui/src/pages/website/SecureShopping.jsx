import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Lock, CheckCircle } from 'lucide-react';

const SecureShopping = () => {
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
            <span className="text-gray-900 font-medium">Secure Shopping</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4 flex items-center justify-center gap-3">
              Secure Shopping
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              We guarantee that shopping with Bagchee is safe. You never have to worry about the safety of your credit card information when shopping here. If unauthorized or fraudulent charges are ever made, you do not have to pay for them. Period.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* Why Shopping Here Is Safe */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-8 text-center">
              Why shopping here is safe
            </h2>
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <Lock className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-body leading-relaxed">
                    At Bagchee, protecting your information is fundamental. To ensure your information is safely guarded, we use Secure Sockets Layer (SSL) technology. When giving your credit card number, SSL encrypts all personal information including your card number, name and address. With this encryption, no one is allowed to decode your information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Verify Secure Connection */}
          <section className="mb-12 md:mb-16">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6 text-center">
                How can you be sure any connection is secure?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-body">
                    Look for an unbroken-key icon or a closed-lock icon in your browser window after accessing a server.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-body">
                    You will usually find the icon in the lower-right or lower-left corner of your browser window, but some browsers display the icon elsewhere (near the address bar, for instance).
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-body">
                    The key or lock icon indicates that SSL is active and your information secure.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-body">
                    You can also double-check by looking at the URL line of your browser. When accessing a secure server, the first characters of the site address will change from "http" to "https".
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SecureShopping;
