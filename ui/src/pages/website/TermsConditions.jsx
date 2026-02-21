import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail } from 'lucide-react';
import UsefulLinks from '../../components/website/UsefulLinks';

const TermsConditions = () => {
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
            <span className="text-gray-900 font-medium">Terms & Conditions</span>
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
          
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Terms & Conditions
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using our services
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {/* Terms of Use Section */}
          {/* <section className="mb-10 md:mb-12">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Terms of Use
                </h2>
              </div>
            </div>
          </section> */}

          {/* Purchase Policies Section */}
          <section className="mb-10 md:mb-12">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
              
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Purchase Policies
                </h2>
              </div>
              
              <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                <div className="bg-cream-50 border-l-4 border-primary p-4 rounded-r-lg">
                  <p>
                    Price and availability information is subject to change without notice. While we take great care to ensure that information on our site is accurate, mistakes may occur. When a mistake is noticed we will correct it as soon as possible and will notify customers who are affected.
                  </p>
                </div>

                <p>
                  We reserve the right to cancel, terminate or not to process orders (including accepted orders) where the price or other material information on this site is inaccurate.
                </p>

                <p>
                  All the items listed on our website are not readily available in our inventories and supply is subject to availability with the suppliers.
                </p>

                <p>
                  We reserve the right to cancel an order if there is not enough inventory of an item to complete your order (or if an item is no longer available). If we cancel or do not process an order for such reason(s), we will advise you that the order has been cancelled and will either not charge you or will apply a credit to the payment type used in the order.
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimer Section */}
          <section className="mb-10 md:mb-12">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
      
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Disclaimer
                </h2>
              </div>
              
              <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                <p>
                  Bagchee.com are merely into the legal business of buying and selling books/publications and in no way try to reproduce the publications in any form or make any other misuse whatsoever.
                </p>

                <p>
                  As per the international practice of promoting through websites and catalogues, Bagchee.com may have used the cover image, portions of blurbs and/or chapter headings from the contents page. This is purely for the purpose of promoting the relevant book only.
                </p>

                <div className="bg-cream-50 border border-gray-200 p-5 rounded-lg">
                  <p className="font-semibold text-text-main mb-2">
                    Opt-out Option:
                  </p>
                  <p>
                    Should any one not be interested in this kind of promotion by Bagchee.com, please write to <a href="mailto:email@bagchee.com" className="text-primary hover:underline font-semibold">email@bagchee.com</a> indicating the concern exactly for Bagchee.com to take appropriate de-listing action.
                  </p>
                </div>

                <p>
                  All the items listed on our website are not readily available in our inventories and supply is subject to availability with the suppliers.
                </p>
              </div>
            </div>
          </section>

          {/* Important Notice */}
          <section>
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-6 md:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-text-main mb-3">
                    Questions About Our Terms?
                  </h3>
                  <p className="text-gray-700 font-body mb-4">
                    If you have any questions or concerns about our Terms & Conditions, please don't hesitate to contact us. We're here to help!
                  </p>
                  <a 
                    href="mailto:email@bagchee.com"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    email@bagchee.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
