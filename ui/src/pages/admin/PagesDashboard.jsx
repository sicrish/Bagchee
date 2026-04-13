import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/admin/DashboardCard';

// Icons Import (Aapki image mein list icon use hua hai sabme)
import { ListIcon } from 'lucide-react';

const PagesDashboard = () => {
  const navigate = useNavigate();
  
  // 🟢 Image 14a39f.png ke mutabik 6 cards define kiye hain
  const pageCards = [
    { title: "SERVICES", icon: ListIcon, link: "/admin/services" },
    { title: "ABOUT US", icon: ListIcon, link: "/admin/about-us" },
    { title: "TESTIMONIALS", icon: ListIcon, link: "/admin/testimonials" },
    { title: "AUTHORS & PUBLISHERS", icon: ListIcon, link: "/admin/authors-publishers" },
    { title: "PRIVACY", icon: ListIcon, link: "/admin/privacy" },
    { title: "TERMS OF USE", icon: ListIcon, link: "/admin/terms-of-use" },
    { title: "DISCLAIMER", icon: ListIcon, link: "/admin/disclaimer" },
  ];

  return (
    // 🟢 Container with Tailwind config colors & fonts
    <div className="p-8 md:p-12 max-w-7xl mx-auto bg-cream-50 min-h-screen">
      
      

      {/* Grid Layout - 3 columns as per your image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pageCards.map((card, index) => (
          <DashboardCard 
            key={index}
            title={card.title}
            icon={card.icon}
            // 🟢 Navigation logic as per your previous Dashboard
            onClick={() => navigate(card.link)} 
          />
        ))}
      </div>

    </div>
  );
};

export default PagesDashboard;