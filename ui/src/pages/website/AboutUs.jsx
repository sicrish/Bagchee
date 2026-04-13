import React from "react";
import { createSafeHtml } from '../../utils/sanitize';
import { Link } from 'react-router-dom';
import {ChevronRight} from 'lucide-react'
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosConfig";
import UsefulLinks from "../../components/website/UsefulLinks";

// Fetch Function
const fetchAboutData = async () => {
  const { data } = await axiosInstance.get("/about-us/get");
  return data.data; // Backend structure ke hisab se data.data nikalna
};

const AboutUs = () => {
  // React Query Hook
  const { data, isLoading, isError } = useQuery({
    queryKey: ["aboutUs"],
    queryFn: fetchAboutData,
    staleTime: 1000 * 60 * 10, // 10 minutes tak data fresh rahega
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
        <p className="text-red-500 font-bold">Failed to load About Us content.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">

<div className="bg-cream-100 border-b border-gray-200">
                <div className="container mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">{data?.title || 'Terms & Conditions'}</span>
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display  text-text-main uppercase tracking-tight">
                {data?.title || "About Us"}
              </h1>
            </div>

            {/* Dynamic Content Section */}
            <section className="mb-10 md:mb-12">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm overflow-hidden relative">
                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>

                {/* HTML content from Admin with Tailwind Typography look */}
                <div 
                  className="dynamic-content font-body text-gray-700 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={createSafeHtml(data?.page_content)} 
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Internal CSS for Handling Admin HTML Tags */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dynamic-content h2 { 
          font-family: 'Outfit', sans-serif;
          font-size: 1.875rem; 
          font-weight: 700; 
          color: #0B2F3A; 
          margin-top: 2.5rem; 
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }
        .dynamic-content h3 { 
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem; 
          font-weight: 600; 
          color: #008DDA; 
          margin-top: 1.5rem; 
          border-left: 4px solid #008DDA;
          padding-left: 1rem;
        }
        .dynamic-content p { 
          margin-bottom: 1.25rem; 
        }
        .dynamic-content strong { 
          color: #008DDA; 
          font-weight: 700;
        }
      `}} />
    </div>
  );
};

export default AboutUs;