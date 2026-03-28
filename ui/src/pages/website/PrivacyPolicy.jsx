import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail } from "lucide-react";
import axios from "../../utils/axiosConfig";
import { createSafeHtml } from '../../utils/sanitize';
import UsefulLinks from "../../components/website/UsefulLinks";

const PrivacyPolicy = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/privacy/get`);
        if (res.data.status && res.data.data) {
          setPageData(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load Privacy Policy data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasContent = pageData && (pageData.pageContent || pageData.page_content);
  const content = pageData?.pageContent || pageData?.page_content || '';
  const title = pageData?.title || 'Privacy Policy';

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Privacy Policy</span>
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
              <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">Your privacy is important to us. Learn how we collect, use, and protect your information.</p>
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
                    <p className="text-gray-700 leading-relaxed font-body">Bagchee.com has created this statement to demonstrate our firm commitment to our customers' privacy. This document discloses our practices for gathering and disseminating information through our web site at www.bagchee.com.</p>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6">Information That We Collect</h2>
                    <div className="space-y-6 text-gray-700 leading-relaxed font-body">
                      <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">Account Information</h3>
                        <p>When you sign up for a Bagchee.com account, we store all information that you provide to us. Our site uses an order form for customers to request information, products, and services. We collect visitors' contact information (such as an email address). We don't collect financial information (such as account or credit card numbers).</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">Contact Information Usage</h3>
                        <p>Contact information from the order form is used to send orders and information about our company to our customers. The contact information is also used to communicate with customers when necessary. Users may choose not to receive future mailings (see the Choice/Opt-Out section below).</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">Cookies</h3>
                        <p>Your IP address and browser information are stored in a "cookie" file to help identify you and your shopping cart. A cookie is a small data file that web sites write to your hard drive. A cookie cannot read data off your hard drive nor read other cookie files.</p>
                        <p className="mt-2">You can refuse cookies by turning this option off in your browser. You do not need to have cookies turned on to purchase items from Bagchee.com. However, cookies are needed if you wish to store items in your shopping cart between visits to the site.</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">Contests and Surveys</h3>
                        <p>We run contests on our site in which we ask visitors for contact information (such as an email address). We may use this contact data to send users information about our company. Users may opt-out of receiving future mailings (see the Choice/Opt-Out section below).</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">Correspondence and Transactions</h3>
                        <p>Any email or written correspondence that you send us may be stored. Data from any monetary transaction taking place via Bagchee.com may be stored.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Uses of Collected Information</h2>
                    <p className="text-gray-700 leading-relaxed font-body">Bagchee.com uses collected information to enhance your experience online, authenticate you when you sign in, send notifications, fulfill your requests for services, contact you, customize the advertising or content that you see, and provide anonymous reporting for internal and external clients.</p>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Information Sharing</h2>
                    <p className="text-gray-700 leading-relaxed font-body">Bagchee.com does not share personal information with other individuals, organizations, or companies outside of Bagchee.com.</p>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Data Integrity</h2>
                    <p className="text-gray-700 leading-relaxed font-body">Bagchee.com processes personal information only for the purposes for which it was collected and in accordance with our Privacy Policy. We review our data collection, storage, and process practices to ensure that we only collect, store, and process the information needed to provide our services. We depend on our users to update or correct their own personal information.</p>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6">Security and Confidentiality</h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                      <p>Bagchee.com restricts access to personal information to Bagchee.com employees, who need to access the information in order to operate, sustain, improve or repair our services. These individuals are bound to confidentiality agreements and may be subject to discipline, including termination and criminal prosecution, if they fail to meet these obligations.</p>
                      <p>This site has security measures in place to protect the loss, misuse and alteration of the information under our control. Bagchee.com processes orders with a SSL Secure Commerce Server which utilizes military grade encryption to protect your information.</p>
                      <p>All credit card information is encoded with strong encryption before storage. Bagchee.com does not store, release your credit card information or mailing address to any outside organizations without your prior electronic consent.</p>
                    </div>
                  </div>
                </section>

                <section className="mb-10 md:mb-12">
                  <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Choice/Opt Out</h2>
                    <p className="text-gray-700 leading-relaxed font-body">Customers may unsubscribe from a Bagchee.com email list at any time by simply following the instructions included at the bottom of any Bagchee email message.</p>
                  </div>
                </section>

                <section>
                  <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 md:p-8 lg:p-10 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Contacting Bagchee.com</h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                      <p>If you wish to modify information previously provided, remove information from our database to avoid receiving future communications, or inquire about this privacy statement, the practices of this site, or your dealings with this site, contact us:</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                        <a href="mailto:email@bagchee.com" className="text-primary hover:underline font-semibold">email@bagchee.com</a>
                      </div>
                    </div>
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

export default PrivacyPolicy;
