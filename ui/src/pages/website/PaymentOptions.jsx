import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CreditCard, Shield, DollarSign, FileText } from 'lucide-react';

const PaymentOptions = () => {
  const options = [
    {
      icon: <CreditCard className="w-6 h-6 text-primary" />,
      title: "Credit / Debit Card",
      description: "We accept all major credit and debit cards including Visa, MasterCard, and American Express. Your card details are encrypted and never stored on our servers.",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-primary" />,
      title: "PayPal",
      description: "Pay securely using your PayPal account or any card via PayPal's checkout. You do not need a PayPal account to pay by card through PayPal.",
    },
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "Purchase Order (PO)",
      description: "Institutional and library customers can pay using a Purchase Order. Submit your PO number at checkout and we will invoice your institution.",
    },
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "Wire Transfer / Bank Transfer",
      description: "We accept direct bank wire transfers for large orders. Contact us for our banking details. Orders are dispatched once funds clear.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Payment Options</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-4">
              Payment Options
            </h1>
            <p className="text-gray-600 text-base font-body max-w-2xl mx-auto">
              Bagchee offers a variety of convenient and secure payment methods. Choose the one that works best for you.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {options.map((opt, i) => (
              <div key={i} className="bg-cream-100 border border-gray-200 rounded-xl p-6 shadow-sm flex items-start gap-4">
                <div className="shrink-0 mt-1">{opt.icon}</div>
                <div>
                  <h3 className="font-display font-bold text-text-main text-lg mb-2">{opt.title}</h3>
                  <p className="text-gray-600 text-sm font-body leading-relaxed">{opt.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start gap-4">
            <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-display font-bold text-text-main mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm font-body leading-relaxed">
                All transactions on Bagchee are protected by SSL encryption. We never store your full card details. For any payment queries, please <Link to="/contact-us" className="text-primary hover:underline">contact us</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;
