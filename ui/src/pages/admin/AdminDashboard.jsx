import React from 'react';
import { useNavigate } from 'react-router-dom'; // 🟢 1. Import useNavigate
import DashboardCard from '../../components/admin/DashboardCard';

// Icons Import
import { 
  Sliders, List, Type, ShoppingBag, Percent, 
  Newspaper, Image, Users, LayoutTemplate 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate(); // 🟢 2. Initialize hook
  
  const cards = [
    { title: "SLIDER", icon: Sliders, link: "/admin/home-slider" },
    // { title: "SERVICES", icon: List, link: "/admin/services" },
    { title: "SECTIONS TITLES", icon: Type, link: "/admin/titles" },
    { title: "FEATURED TODAY", icon: ShoppingBag, link: "/admin/home-section-1" },
    { title: "IN THE SPOTLIGHT", icon: ShoppingBag, link: "/admin/home-section-2" },
    // { title: "SECTION 3 PRODUCTS", icon: ShoppingBag, link: "/admin/home-section-3" },
    // { title: "SECTION 4 PRODUCTS", icon: ShoppingBag, link: "/admin/home-section-4" },
    { title: "SALE TODAY", icon: Percent, link: "/admin/sale-today" },
    { title: "NEW AND NOTEWORTHY", icon: Newspaper, link: "/admin/new-and-noteworthy" },
    { title: "BestSellers", icon: Newspaper, link: "/admin/home-best-seller" },
    { title: "Books of the Month", icon: Newspaper, link: "/admin/books-of-the-month" },

    { title: "side banner1", icon: Image, link: "/admin/side-banner-one" },
    { title: "side banner2", icon: Image, link: "/admin/side-banner-two" },

    { title: "CATEGORIES", icon: List, link: "/admin/main-categories" }, // Link to Add Category
    { title: "TOP AUTHORS", icon: Users, link: "/admin/top-authors" },
    { title: "FOOTER", icon: LayoutTemplate, link: "/admin/footer" },
   

  ];

  return (
    // 🟢 3. Sirf Content Wrapper rakha hai (Sidebar hata diya)
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-text-main font-display mb-2">
            Hello, admin!
          </h1>
          <p className="text-text-muted font-montserrat text-sm tracking-widest uppercase">
            Welcome to your control panel
          </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card, index) => (
          <DashboardCard 
            key={index}
            title={card.title}
            icon={card.icon}
            // 🟢 4. Navigate Function lagaya
            onClick={() => navigate(card.link)} 
          />
        ))}
      </div>

    </div>
  );
};

export default AdminDashboard;