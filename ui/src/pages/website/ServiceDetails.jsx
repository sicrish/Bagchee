import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { ArrowLeft, BookOpen, Sparkles, AlertCircle } from "lucide-react";

const ServiceDetails = () => {
  const { id } = useParams(); // URL se service ka ID nikalne ke liye
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        // Hum list ko call karke specific ID filter kar rahe hain 
        // (Agar aapke backend me direct '/services/:id' API hai, toh use call kar lena)
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/services/list`);
        
        if (res.data.status) {
          const foundService = res.data.data.find((item) => item._id === id);
          setService(foundService);
        }
      } catch (error) {
        console.error("Failed to load service details", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-montserrat uppercase tracking-widest text-sm font-bold">Loading Details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center text-center p-4">
        <AlertCircle size={64} className="text-gray-400 mb-4" />
        <h2 className="text-3xl font-display font-bold text-text-main mb-2">Service Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">The service you are looking for does not exist or has been removed.</p>
        <Link 
          to="/services" 
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-montserrat font-bold uppercase text-sm tracking-widest transition-all hover:bg-primary-dark"
        >
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body pb-20">
      
      {/* ─── 🟢 HERO HEADER ─── */}
      <section className="bg-[#F7EEDD] relative py-16 lg:py-24 border-b border-cream-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Back Button */}
          <Link 
            to="/services" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-montserrat font-bold text-xs uppercase tracking-widest mb-8 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to All Services
          </Link>

          {/* Title & Badge */}
          <div className="animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full mb-6 border border-cream-200">
              <Sparkles size={16} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark font-montserrat">Service Details</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main mb-6 leading-tight">
              {service.title}
            </h1>
            
            {/* Box description as short intro */}
            <div 
              className="text-lg text-gray-600 leading-relaxed max-w-3xl"
              dangerouslySetInnerHTML={{ __html: service.box_description }}
            />
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <BookOpen size={400} className="-mr-20 -mt-20" />
        </div>
      </section>

      {/* ─── 📑 MAIN CONTENT (Rich Text) ─── */}
      <main className="max-w-full mx-auto px-4 sm:px-6 -mt-8 relative z-20 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <div className="bg-white p-8 md:p-12 lg:p-16 rounded-3xl shadow-xl border border-gray-100">
          <div 
            className="prose prose-lg prose-blue max-w-none font-body text-gray-700 service-rich-content"
            dangerouslySetInnerHTML={{ __html: service.page_content }}
          />
        </div>
      </main>

      {/* ─── 🎨 STYLES FOR RICH TEXT ─── */}
      <style>{`
        /* These styles will only apply to the HTML coming from your backend editor */
        .service-rich-content h1, 
        .service-rich-content h2, 
        .service-rich-content h3 { 
          color: #0B2F3A; 
          font-family: 'Outfit', sans-serif; 
          font-weight: 700; 
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .service-rich-content h2 { font-size: 1.8rem; }
        .service-rich-content p { margin-bottom: 1.25rem; line-height: 1.8; }
        .service-rich-content ul { list-style: none; padding-left: 0; margin-bottom: 1.5rem; }
        .service-rich-content li { 
          position: relative; 
          padding-left: 2rem; 
          margin-bottom: 0.75rem; 
          line-height: 1.6;
        }
        .service-rich-content li::before { 
          content: '✓'; 
          position: absolute; 
          left: 0; 
          color: #008DDA; /* Primary Color */
          font-weight: bold; 
        }
        .service-rich-content a { color: #008DDA; text-decoration: underline; text-underline-offset: 4px; }
        .service-rich-content a:hover { color: #0B2F3A; }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

    </div>
  );
};

export default ServiceDetails;