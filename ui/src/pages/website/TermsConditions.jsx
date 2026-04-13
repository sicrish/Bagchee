import React from 'react';
import { createSafeHtml } from '../../utils/sanitize';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Mail, ShieldAlert } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import UsefulLinks from '../../components/website/UsefulLinks';

// 1. Fetch Function
const fetchTerms = async () => {
    const { data } = await axiosInstance.get('/terms/get');
    return data.data; // Return dynamic object from backend
};

const TermsConditions = () => {
    // 2. React Query Hook
    const { data, isLoading, isError } = useQuery({
        queryKey: ['termsConditions'],
        queryFn: fetchTerms,
        staleTime: 1000 * 60 * 30, // 30 minutes cache
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
                <p className="text-red-500 font-bold font-body">Failed to load terms data.</p>
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
                        {/* Dynamic Page Header */}
                        <div className="text-center mb-8 md:mb-12">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display  text-text-main mb-4 uppercase">
                                {data?.title || 'Terms & Conditions'}
                            </h1>
                            
                        </div>

                        {/* 🟢 Dynamic Content Section */}
                        <section className="mb-10 md:mb-12">
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm relative overflow-hidden">
                                {/* Side Accent for MNC look */}

                                {/* Render Admin Content */}
                                <div 
                                    className="terms-content font-body text-gray-700 leading-relaxed text-lg prose prose-blue max-w-none
                                    prose-headings:font-display prose-headings:text-text-main prose-headings:mt-8 prose-headings:mb-4
                                    prose-p:mb-5 prose-strong:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                                    dangerouslySetInnerHTML={createSafeHtml(data?.page_content)} 
                                />
                            </div>
                        </section>

                        {/* Static Contact Notice (Good for UX) */}
                        <section>
                            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-6 md:p-8 shadow-sm flex items-start gap-4">
                                <ShieldAlert className="w-8 h-8 text-primary shrink-0" />
                                <div>
                                    <h3 className="text-xl font-display font-bold text-text-main mb-2">
                                        Questions About Our Terms?
                                    </h3>
                                    <p className="text-gray-700 font-body mb-4">
                                        Our legal terms are designed to protect both the customer and the publisher. If you need further clarification, we are here to assist.
                                    </p>
                                    <a 
                                        href="mailto:email@bagchee.com"
                                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors bg-white px-4 py-2 rounded-lg border border-primary/20"
                                    >
                                        <Mail className="w-4 h-4" />
                                        email@bagchee.com
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Custom Styling taaki Admin Content bilkul same dikhe aapke static design jaisa */}
            <style dangerouslySetInnerHTML={{ __html: `
                .terms-content h2 { 
                    font-size: 1.875rem; 
                    font-weight: 700; 
                    color: #0B2F3A; 
                    border-bottom: 2px solid #F7EEDD;
                    padding-bottom: 0.5rem;
                    margin-top: 2rem;
                }
                .terms-content p { 
                    margin-bottom: 1.25rem; 
                }
                /* Purchase Policy highlight jaisa look dene ke liye agar strong use ho */
                .terms-content blockquote {
                    background: #fffdf5;
                    border-left: 4px solid #008DDA;
                    padding: 1rem;
                    border-radius: 0 0.5rem 0.5rem 0;
                    font-style: normal;
                }
            `}} />
        </div>
    );
};

export default TermsConditions;