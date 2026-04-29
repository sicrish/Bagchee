import React from "react";
import { createSafeHtml } from '../../utils/sanitize';
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Mail, ShieldCheck, Lock } from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import UsefulLinks from "../../components/website/UsefulLinks";

// 1. Fetcher function
const fetchPrivacyData = async () => {
  const { data } = await axiosInstance.get("/privacy/get");
  return data.data;
};

const PrivacyPolicy = () => {
  // 2. React Query Hook
  const { data, isLoading, isError } = useQuery({
    queryKey: ["privacyPolicy"],
    queryFn: fetchPrivacyData,
    staleTime: 1000 * 60 * 60, // 1 hour caching kyunki policy roz nahi badalti
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-red-500 font-bold font-body">Error loading Privacy Policy.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{data?.title || "Privacy Policy"}</span>
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
            {/* Dynamic Page Title */}
            <div className="text-center mb-8 md:mb-12">
             
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display  text-text-main mb-4 tracking-tight">
                {data?.title || "Privacy Policy"}
              </h1>
             
              {/* <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div> */}
            </div>

            {/* 🟢 DYNAMIC HTML CONTENT SECTION */}
            <section className="mb-10 md:mb-12">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm relative overflow-hidden">
                {/* Subtle Decorative Icon in Background */}
                <Lock className="absolute -bottom-10 -right-10 w-40 h-40 text-gray-50 opacity-50" />

                {/* Render Admin Content with Tailwind Typography support */}
                <div 
                  className="privacy-content font-body text-gray-700 leading-relaxed text-lg prose prose-blue max-w-none
                  prose-headings:font-display prose-headings:text-text-main prose-headings:mt-8 prose-headings:mb-4
                  prose-p:mb-5 prose-strong:text-primary prose-strong:font-bold"
                  dangerouslySetInnerHTML={createSafeHtml(data?.pageContent || data?.page_content)}
                />
              </div>
            </section>

            {/* Support Box (Stays Static for UX) */}
            <section>
              <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 md:p-8 lg:p-10 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                  Privacy Inquiries
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                  <p>
                    If you have any questions about this privacy statement, the practices of this site, 
                    or your dealings with Bagchee.com, you can reach our data protection team:
                  </p>
                  <div className="flex items-center gap-3 bg-white w-fit px-4 py-3 rounded-xl border border-primary/10 shadow-sm">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href="mailto:email@bagchee.com"
                      className="text-primary hover:text-primary-dark font-bold font-montserrat tracking-wide transition-colors"
                    >
                      email@bagchee.com
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Admin Side se aane wale HTML ko Styling dene ke liye CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .privacy-content h2 { 
          font-size: 1.75rem; 
          font-weight: 700; 
          color: #0B2F3A; 
          border-bottom: 2px solid #F7EEDD;
          padding-bottom: 0.5rem;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          font-family: 'Outfit', sans-serif;
        }
        .privacy-content h3 { 
          font-size: 1.25rem; 
          font-weight: 700; 
          color: #0B2F3A; 
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-family: 'Outfit', sans-serif;
        }
        .privacy-content p { 
          margin-bottom: 1.25rem; 
        }
        .privacy-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
      `}} />
    </div>
  );
};

export default PrivacyPolicy;