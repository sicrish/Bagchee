import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Quote, MapPin } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Paul Strike",
      location: "United Kingdom",
      message: "My book arrived safely today. Thank you very much for all your efforts in resolving problems with this order. I will not hesitate to use BAGCHEE for future purchases of books of interest to me. My respects."
    },
    {
      name: "Joe Poletti",
      location: "North Carolina, USA",
      message: "Bagchee is interesting because it only sells books that deal with Indian perspective. What a rich resource for globalization studies. I ordered books from Bagchee and Barnes and Nobles on the same day. The Bagchee order arrived 10 days prior to Barnes and Noble."
    },
    {
      name: "John Morgan",
      location: "USA",
      message: "When I think of Bagchee I think of consistency: consistently great customer support and response time. They are consistently listening to their customer's needs. Whether you are a small to a high-end client, you still get the same attention and quality."
    },
    {
      name: "Jennefer Rose",
      location: "Los Angeles, USA",
      message: "Thank you so much for such excellent service. I was shocked how quickly I received my items. Everything was in excellent condition. I will definitely shop Bagchee again. Great job."
    },
    {
      name: "Sue Moran",
      location: "Australia",
      message: "Book arrived today. Superb book and well packed. Thank you very much for your service."
    },
    {
      name: "Anne Jesson",
      location: "USA",
      message: "From the order acknowledgement onwards I feel that I have had a first class service. The books were dispatched and arrived within days, and the prices are competitive for both the goods and the shipping."
    },
    {
      name: "Andrew Gully",
      location: "United Kingdom",
      message: "Without doubt the best online bookshop in existence!"
    },
    {
      name: "Robin Fay",
      location: "USA",
      message: "Searching for material was easy as was the ordering process."
    },
    {
      name: "Michelle Brown",
      location: "Canada",
      message: "They kept me up to date on the situation. I'm completely satisfied with their service."
    },
    {
      name: "Claudia Lohrengel",
      location: "Germany",
      message: "I think this website is absolutely brilliant I use it all the time!"
    }
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
            <span className="text-gray-900 font-medium">Testimonials</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Customer Testimonials
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              See what our customers around the world are saying about their
              experience with Bagchee
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-cream-100 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Quote Icon */}
                <div className="mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Quote className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Message */}
                <p className="text-gray-700 leading-relaxed mb-6 font-body flex-grow">
                  "{testimonial.message}"
                </p>

                {/* Author Info */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-bold text-text-main font-display">
                    {testimonial.name}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="font-body">{testimonial.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 md:mt-16 text-center">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                Join Our Happy Customers
              </h2>
              <p className="text-gray-600 font-body mb-6 max-w-2xl mx-auto">
                Experience the same excellent service and quality that our
                customers love. Start shopping today!
              </p>
              <Link
                to="/"
                className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
