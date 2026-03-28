import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Quote, MapPin } from 'lucide-react';
import axios from '../../utils/axiosConfig';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/testimonials/list?limit=100`);
        if (res.data.status && res.data.data) {
          const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data.testimonials || []);
          setTestimonials(items.filter(t => t.active !== false));
        }
      } catch (error) {
        console.error("Failed to load testimonials");
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Testimonials</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">Customer Testimonials</h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">See what our customers around the world are saying about their experience with Bagchee</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-cream-100 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Quote className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  {testimonial.title && (
                    <h3 className="text-lg font-bold text-text-main font-display mb-2">{testimonial.title}</h3>
                  )}

                  <p className="text-gray-700 leading-relaxed mb-6 font-body flex-grow">
                    "{testimonial.content || testimonial.message}"
                  </p>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-bold text-text-main font-display">
                      {testimonial.madeBy || testimonial.made_by || testimonial.name}
                    </p>
                    {(testimonial.location) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="font-body">{testimonial.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No testimonials available at the moment.</div>
          )}

          <div className="mt-12 md:mt-16 text-center">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Join Our Happy Customers</h2>
              <p className="text-gray-600 font-body mb-6 max-w-2xl mx-auto">Experience the same excellent service and quality that our customers love. Start shopping today!</p>
              <Link to="/" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold">Start Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
