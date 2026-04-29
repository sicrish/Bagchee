import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Globe, Clock, Package } from 'lucide-react';

const ShippingInfo = () => {
  const zones = [
    { region: "USA & Canada", standard: "10–15 business days", express: "5–7 business days" },
    { region: "Europe", standard: "10–15 business days", express: "5–7 business days" },
    { region: "Australia & NZ", standard: "12–18 business days", express: "7–10 business days" },
    { region: "Rest of World", standard: "15–25 business days", express: "10–14 business days" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Shipping Information</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-4">
              Shipping Information
            </h1>
            <p className="text-gray-600 text-base font-body max-w-2xl mx-auto">
              We ship from New Delhi, India to over 150 countries worldwide. Find out more about our shipping timelines and costs below.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* Shipping cost info */}
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-cream-100 border border-gray-200 rounded-xl p-5 text-center shadow-sm">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-display font-bold text-text-main mb-1">Free Shipping</h3>
                <p className="text-gray-600 text-sm">On orders over $50 (standard delivery worldwide)</p>
              </div>
              <div className="bg-cream-100 border border-gray-200 rounded-xl p-5 text-center shadow-sm">
                <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-display font-bold text-text-main mb-1">Flat Rate</h3>
                <p className="text-gray-600 text-sm">$12 per book for orders under $50</p>
              </div>
              <div className="bg-cream-100 border border-gray-200 rounded-xl p-5 text-center shadow-sm">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-display font-bold text-text-main mb-1">Processing Time</h3>
                <p className="text-gray-600 text-sm">1–3 business days from New Delhi</p>
              </div>
            </div>
          </section>

          {/* Delivery times by region */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-text-main mb-6">Estimated Delivery Times</h2>
            <div className="bg-cream-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary/10 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-montserrat font-bold text-text-main">Region</th>
                    <th className="text-left px-6 py-3 font-montserrat font-bold text-text-main">Standard</th>
                    <th className="text-left px-6 py-3 font-montserrat font-bold text-text-main">Express</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-3 font-medium text-gray-800">{z.region}</td>
                      <td className="px-6 py-3 text-gray-600">{z.standard}</td>
                      <td className="px-6 py-3 text-gray-600">{z.express}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">* Delivery times are estimates from the date of dispatch and may vary due to customs clearance.</p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start gap-4">
            <Package className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-display font-bold text-text-main mb-2">Tracking Your Order</h3>
              <p className="text-gray-600 text-sm font-body leading-relaxed">
                Once your order is dispatched, you will receive a tracking number by email. You can use it to track your shipment online. For any shipping queries, please <Link to="/contact-us" className="text-primary hover:underline">contact us</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
