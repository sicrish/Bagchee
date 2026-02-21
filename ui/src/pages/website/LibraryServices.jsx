import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, BookOpen, ArrowRight } from "lucide-react";

const LibraryServices = () => {
  const services = [
    {
      title: "Approval Plans",
      description:
        "Our flexible approval plan services are designed to enrich library collections, helping libraries provide an up-to-date and comprehensive range of books and music scores to their patrons, while saving our customers time and effort. Approval plans help you acquire books that match your library's profile, goals and preferences. Our industry-leading profiling process and rich metadata are the foundation of our approval plans and help you make more informed collection development decisions. Choose to receive books through a variety of print outputs.",
    },
    {
      title: "Monographs",
      description:
        "Bagchee is a leading supplier of scholarly monographs, research materials and literary texts published throughout India and South Asia. Our innovative books services, including series and packages, are tailored to our customers' needs and can be acquired via standing or firm orders or approval plans.",
    },
    {
      title: "Standing Orders",
      description:
        "We provide a fast, reliable standing order service for book series, sets in progress, proceedings, annuals, loose-leaf publications and yearbooks, in all media.We provide a fast, reliable standing order service for book series, sets in progress, proceedings, annuals, loose-leaf publications and yearbooks, in all media.",
    },
    {
      title: "Subscriptions",
      description:
        "We deliver a full range of subscription-based information resources published worldwide, in all Indian and south Asian languages, in all media, including print journals, and back issues, and more.We deliver a full range of subscription-based information resources published worldwide, in all Indian and south Asian languages, in all media, including print journals, and back issues, and more.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Library Services</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Bagchee Library Services
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              Established in 1990, Bagchee has been serving libraries around the
              world for almost 30 years. Our customers value us for the quality
              and accuracy of our services and for our industry-leading and
              innovative solutions.
            </p>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto mt-4">
              We specialize in providing a comprehensive range of high-quality
              acquisitions and collection development support services to
              academic and research libraries for Indian and South Asian titles.
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold mt-6"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* Services Section */}
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-cream-100 rounded-xl border border-gray-200 p-8 shadow-sm"
                >
                  <h3 className="text-xl font-display font-bold text-text-main mb-4 flex items-center gap-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-700 font-body leading-relaxed">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold mt-4 transition-colors"
                  >
                    Explore <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LibraryServices;
