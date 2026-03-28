import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { createSafeHtml } from '../../utils/sanitize';
import UsefulLinks from '../../components/website/UsefulLinks';

const TermsConditions = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/terms/get`);
        if (res.data.status && res.data.data) {
          setPageData(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load Terms data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasContent = pageData && (pageData.pageContent || pageData.page_content);
  const content = pageData?.pageContent || pageData?.page_content || '';
  const title = pageData?.title || 'Terms & Conditions';

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Terms & Conditions</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          <div className="md:col-span-1">
            <UsefulLinks />
          </div>

          <div className="md:col-span-3">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">{title}</h1>
              <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">Please read these terms and conditions carefully before using our services</p>
              <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : hasContent ? (
              <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                <div className="prose prose-lg max-w-none font-body text-gray-700 leading-relaxed" dangerouslySetInnerHTML={createSafeHtml(content)} />
              </div>
            ) : (
              <>
                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6">Purchase Policies</h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                      <div className="bg-cream-50 border-l-4 border-primary p-4 rounded-r-lg">
                        <p>Price and availability information is subject to change without notice. While we take great care to ensure that information on our site is accurate, mistakes may occur. When a mistake is noticed we will correct it as soon as possible and will notify customers who are affected.</p>
                      </div>
                      <p>We reserve the right to cancel, terminate or not to process orders (including accepted orders) where the price or other material information on this site is inaccurate.</p>
                      <p>All the items listed on our website are not readily available in our inventories and supply is subject to availability with the suppliers.</p>
                      <p>We reserve the right to cancel an order if there is not enough inventory of an item to complete your order (or if an item is no longer available). If we cancel or do not process an order for such reason(s), we will advise you that the order has been cancelled and will either not charge you or will apply a credit to the payment type used in the order.</p>
                    </div>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6">Disclaimer</h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                      <p>Bagchee.com are merely into the legal business of buying and selling books/publications and in no way try to reproduce the publications in any form or make any other misuse whatsoever.</p>
                      <p>As per the international practice of promoting through websites and catalogues, Bagchee.com may have used the cover image, portions of blurbs and/or chapter headings from the contents page. This is purely for the purpose of promoting the relevant book only.</p>
                      <div className="bg-cream-50 border border-gray-200 p-5 rounded-lg">
                        <p className="font-semibold text-text-main mb-2">Opt-out Option:</p>
                        <p>Should any one not be interested in this kind of promotion by Bagchee.com, please write to <a href="mailto:email@bagchee.com" className="text-primary hover:underline font-semibold">email@bagchee.com</a> indicating the concern exactly for Bagchee.com to take appropriate de-listing action.</p>
                      </div>
                      <p>All the items listed on our website are not readily available in our inventories and supply is subject to availability with the suppliers.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xl font-display font-bold text-text-main mb-3">Questions About Our Terms?</h3>
                    <p className="text-gray-700 font-body mb-4">If you have any questions or concerns about our Terms & Conditions, please don't hesitate to contact us. We're here to help!</p>
                    <a href="mailto:email@bagchee.com" className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors">
                      <Mail className="w-4 h-4" /> email@bagchee.com
                    </a>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
