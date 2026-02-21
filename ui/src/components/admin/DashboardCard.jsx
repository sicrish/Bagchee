import React from 'react';

const DashboardCard = ({ title, icon: Icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] p-5 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
    >
      {/* 🔴 Theme Based Background */}
      <div className="bg-primary text-white w-16 h-16 rounded-lg flex items-center justify-center shrink-0 shadow-md group-hover:bg-primary-dark transition-colors">
        <Icon size={32} strokeWidth={2} />
      </div>
      
      {/* Text Styling from Config */}
      <h3 className="text-text-main font-bold text-sm uppercase tracking-wider font-montserrat group-hover:text-primary transition-colors">
        {title}
      </h3>
    </div>
  );
};

export default DashboardCard;