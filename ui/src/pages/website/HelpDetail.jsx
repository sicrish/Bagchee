import React, { useState, useEffect } from 'react';
import { createSafeHtml } from '../../utils/sanitize';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, HelpCircle } from 'lucide-react';
import axiosInstance from "../../utils/axiosConfig";

const HelpDetail = () => {
  const { id } = useParams();
  const [helpPages, setHelpPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await axiosInstance.get("/help-pages/list");
        const activeData = response.data.data || [];
        setHelpPages(activeData);

        const current = activeData.find(p => String(p.id) === id);
        setActivePage(current);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100 font-body">
      {/* ─── BREADCRUMB (Full Width) ─── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center gap-2 text-sm">
          <Link to="/help" className="text-text-muted hover:text-primary transition-colors font-montserrat">Help Center</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-text-main font-bold font-montserrat uppercase tracking-tight italic">
            {activePage?.title}
          </span>
        </div>
      </div>

      {/* ─── HORIZONTAL TABS (Quick Links in Rows) ─── */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 py-3 min-w-max">
            
            {helpPages.map((item) => (
              <Link
                key={item.id}
                to={`/help/${item.id}`}
                className={`px-5 py-2.5 rounded-full text-xs font-montserrat font-bold uppercase tracking-wider transition-all duration-300 border ${
                  id === String(item.id)
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                  : "bg-gray-50 text-text-muted border-gray-200 hover:bg-white hover:border-primary hover:text-primary"
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT (Full Width Box) ─── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <main className="animate-fadeIn">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-12 lg:p-16 min-h-[60vh]">
            {/* Title Section */}
            <div className="max-w-4xl mb-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main mb-4 uppercase tracking-tighter italic">
                {activePage?.title}
                </h1>
                <div className="w-24 h-2 bg-primary rounded-full"></div>
            </div>

            {/* Jodit/HTML Content - Full Width */}
            <div 
              className="prose prose-lg prose-blue max-w-none text-text-main leading-relaxed font-body
                prose-headings:font-display prose-headings:text-text-main prose-headings:uppercase
                prose-p:text-lg prose-p:mb-6
                prose-strong:text-primary prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-6 prose-li:mb-3"
              dangerouslySetInnerHTML={createSafeHtml(activePage?.pageContent)}
            />
          </div>
        </main>
      </div>

      {/* Style for hiding horizontal scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HelpDetail;