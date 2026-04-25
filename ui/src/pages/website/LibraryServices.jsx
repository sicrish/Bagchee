import React, { useState, useEffect } from "react";
import { createSafeHtml } from '../../utils/sanitize';
import axios from "../../utils/axiosConfig";
import toast from "react-hot-toast";
import { ChevronRight, Sparkles, BookOpen, Globe, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import LibraryHeroImg from "../../assets/images/website/services/library-hero.png";

const LibraryServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/services/list`);
        if (res.data.status) {
          setServices(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getTabImage = (index) => `/service-${index + 1}.png`;
  const activeService = services[activeTab] || null;

  // Handle Explore Button Click
  const handleExplore = () => {
    if (activeService) {
      // Yahan aap apne route ke hisaab se URL set karein
      // Example: /service-details/12345
      navigate(`/service-details/${activeService.id || activeService._id}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50 font-body">
      {/* ─── 🟢 TOP HERO BRANDING SECTION ─── */}
      <section className="bg-[#F7EEDD] relative overflow-hidden border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left Side: Graphic Element */}
            <div className="w-full lg:w-1/2 animate-fadeInLeft">
              <div className="relative">
                <img
                  src={LibraryHeroImg} alt="Library Illustration"
                  className="w-full max-w-md mx-auto h-auto drop-shadow-2xl"
                  onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/2232/2232688.png"}
                />
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              </div>
            </div>

            {/* Right Side: Branding Text */}
            <div className="w-full lg:w-1/2 text-center lg:text-left animate-fadeInRight">
              <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full mb-6 border border-cream-200">
                <Sparkles size={16} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark font-montserrat">Trusted since 1990</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main mb-6 leading-tight uppercase tracking-tighter">
                Bagchee Library <br /> <span className="text-primary">Services</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-4 max-w-xl font-body">
                Established in 1990, Bagchee has been serving libraries around the world for almost 30 years. Our customers value us for the quality and accuracy of our services and for our industry-leading and innovative solutions.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl font-body">
                We specialize in providing a comprehensive range of high-quality acquisitions and collection development support services to academic and research libraries for Indian and South Asian titles.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none"><circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="40" strokeDasharray="20 20" /></svg>
        </div>
      </section>

      {/* ─── 🔵 STICKY TAB NAVIGATION ─── */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-start lg:justify-center overflow-x-auto scrollbar-hide px-3">
            {services.map((service, index) => (
              <button
                key={service.id}
                onClick={() => setActiveTab(index)}
                className={`group relative px-8 py-6 text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap shrink-0
                  ${activeTab === index ? "text-primary" : "text-gray-400 hover:text-gray-700"}`}
              >
                {service.title}
                <span className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 rounded-t-full 
                  ${activeTab === index ? "bg-primary w-full" : "bg-transparent w-0 group-hover:w-1/2 group-hover:bg-gray-200"}`}
                />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── 📑 CONTENT SECTION (Box Details Only) ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeService ? (
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden animate-fadeInUp">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
           
              {/* Right: Box Description & Button */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-primary mb-6">
                  <BookOpen size={24} />
                  <div className="h-[2px] w-12 bg-primary" />
                </div>
                
                <h2 className="text-3xl font-display font-bold text-text-main mb-4">
                  {activeService.title}
                </h2>

                {/* Box Description */}
                <div
                  className="prose prose-lg max-w-none font-body text-gray-600 leading-relaxed mb-8 line-clamp-4"
                  dangerouslySetInnerHTML={createSafeHtml(activeService.boxDesc)}
                />

                {/* Explore Button */}
                <div className="mt-auto">
                  <button 
                    onClick={handleExplore}
                    className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-montserrat font-bold uppercase text-xs tracking-widest transition-all hover:pr-6"
                  >
                    Explore 
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Globe className="mx-auto text-cream-200 mb-4" size={64} />
            <p className="text-gray-400 font-montserrat tracking-widest uppercase text-sm">No Service Selected</p>
          </div>
        )}
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LibraryServices;