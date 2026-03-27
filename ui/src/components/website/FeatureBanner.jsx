import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Crown, Award, ChevronRight } from 'lucide-react';

const FeatureBanner = () => {
  const features = [
    {
      icon: <Truck className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Fast & Free Delivery Worldwide",
      subtitle: "on orders over ₹4527.78",
      link: "/help-desk",
    },
    {
      icon: <Crown className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Bagchee Membership",
      subtitle: "Save extra 10% everyday",
      link: "/membership",
    },
    {
      icon: <Award className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Trusted Since 1990",
      subtitle: "Read our Story",
      link: "/about-us",
    }
  ];

  return (
    <div className="hidden bg-cream-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex-shrink-0 text-primary transition-transform group-hover:scale-110 duration-300">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-main text-sm sm:text-base leading-tight">
                  {feature.title}
                </p>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  {feature.subtitle}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureBanner;
