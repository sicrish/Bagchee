import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, AlertCircle, CheckCircle, Mail } from 'lucide-react';

const ReturnsRefunds = () => {
  const steps = [
    { step: "1", title: "Contact Us", desc: "Email us within 30 days of receiving your order with your order number and reason for return." },
    { step: "2", title: "Get Approval", desc: "Our team will review your request and send return instructions within 2–3 business days." },
    { step: "3", title: "Ship the Book", desc: "Pack the book securely in its original condition and ship it to our address provided." },
    { step: "4", title: "Refund Processed", desc: "Once we receive and inspect the item, we will process your refund within 5–7 business days." },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Returns &amp; Refunds</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-4">
              Returns &amp; Refunds
            </h1>
            <p className="text-gray-600 text-base font-body max-w-2xl mx-auto">
              We want you to be completely satisfied with your purchase. If you are not happy for any reason, we are here to help.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          {/* Policy highlights */}
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Accepted Returns</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Wrong book received</li>
                    <li>Damaged or defective item</li>
                    <li>Significantly different from description</li>
                  </ul>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Non-Returnable Items</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Books with visible wear or damage by buyer</li>
                    <li>Digital downloads or e-books</li>
                    <li>Gift cards</li>
                    <li>Items returned after 30 days</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-text-main mb-6">How to Return</h2>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="bg-cream-100 border border-gray-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                  <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">{s.step}</span>
                  <div>
                    <h3 className="font-display font-bold text-text-main mb-1">{s.title}</h3>
                    <p className="text-gray-600 text-sm font-body">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start gap-4">
            <Mail className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-display font-bold text-text-main mb-2">Need Help?</h3>
              <p className="text-gray-600 text-sm font-body leading-relaxed">
                If you have questions about your return or refund status, please <Link to="/contact-us" className="text-primary hover:underline">contact us</Link>. We typically respond within 1–2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsRefunds;
