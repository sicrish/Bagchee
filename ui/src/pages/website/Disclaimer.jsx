import React from 'react';
import { createSafeHtml } from '../../utils/sanitize';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import UsefulLinks from '../../components/website/UsefulLinks';

const fetchDisclaimer = async () => {
    const { data } = await axiosInstance.get('/disclaimer/get');
    return data.data;
};

const Disclaimer = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['disclaimer'],
        queryFn: fetchDisclaimer,
        staleTime: 1000 * 60 * 30,
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
                <p className="text-red-500 font-bold font-body">Failed to load disclaimer.</p>
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
                        <span className="text-gray-900 font-medium">{data?.title || 'Disclaimer'}</span>
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
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-main uppercase tracking-tight">
                                {data?.title || 'Disclaimer'}
                            </h1>
                        </div>
                        <section className="mb-10 md:mb-12">
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm">
                                <div
                                    className="dynamic-content font-body text-gray-700 leading-relaxed text-lg"
                                    dangerouslySetInnerHTML={createSafeHtml(data?.pageContent || data?.page_content)}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .dynamic-content h2 { font-family:'Outfit',sans-serif; font-size:1.875rem; font-weight:700; color:#0B2F3A; margin-top:2.5rem; margin-bottom:1.25rem; }
                .dynamic-content h3 { font-family:'Outfit',sans-serif; font-size:1.5rem; font-weight:600; color:#008DDA; margin-top:1.5rem; border-left:4px solid #008DDA; padding-left:1rem; }
                .dynamic-content p { margin-bottom:1.25rem; }
                .dynamic-content strong { color:#008DDA; font-weight:700; }
            `}} />
        </div>
    );
};

export default Disclaimer;
