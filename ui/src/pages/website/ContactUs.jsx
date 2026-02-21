import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
  });

  const [captcha, setCaptcha] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState(generateCaptcha());
  const [captchaError, setCaptchaError] = useState(false);

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 100);
    const num2 = Math.floor(Math.random() * 100);
    return { num1, num2, answer: num1 + num2 };
  }

  const [formStatus, setFormStatus] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCaptchaChange = (e) => {
    setCaptcha(e.target.value);
    setCaptchaError(false);
  };

  const handleRefreshCaptcha = () => {
    setCaptchaQuestion(generateCaptcha());
    setCaptcha("");
    setCaptchaError(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (parseInt(captcha) !== captchaQuestion.answer) {
      setCaptchaError(true);
      return;
    }

    setFormStatus("submitted");
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: "",
      });
      setCaptcha("");
      setCaptchaQuestion(generateCaptcha());
      setFormStatus("");
    }, 3000);
  };

const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Address",
      details: ["4384/4A Ansari Road", "Daryaganj, New Delhi 110002"],
      description: "Visit our headquarters in New Delhi, India",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "WhatsApp",
      details: ["+91-11-4104-8000"],
      description: "Chat with us on WhatsApp for quick support",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      details: ["email@bagchee.com"],
      description: "Send us an email and we'll respond within 24 hours",
    },
  ];

  const faqCategories = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard Airmail delivery typically takes 4-6 weeks. Express courier takes 2-3 weeks. Delivery times vary by destination country.",
        },
        {
          q: "Can I track my order?",
          a: "Yes! You'll receive a tracking number via email once your order ships. You can track it on our website or the courier's website.",
        },
        {
          q: "Do you ship internationally?",
          a: "Yes, we ship to over 100 countries worldwide. Shipping costs vary based on destination and weight.",
        },
      ],
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "We accept returns within 30 days of delivery for unopened, undamaged books in original condition. Return shipping costs are covered by the customer.",
        },
        {
          q: "How long do refunds take?",
          a: "Refunds are processed within 5-10 business days after we receive your returned item.",
        },
        {
          q: "Can I return a damaged book?",
          a: "Absolutely! If your book arrives damaged, contact us immediately with photos. We'll arrange a replacement or refund at no cost to you.",
        },
      ],
    },
    {
      category: "Payment",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and various local payment methods depending on your country.",
        },
        {
          q: "Is it safe to pay online?",
          a: "Yes! We use 256-bit SSL encryption and PCI-DSS compliant payment processors to ensure your payment information is completely secure.",
        },
        {
          q: "Do you offer installment payments?",
          a: "For orders over ₹10,000, we partner with select financial institutions to offer installment options. Check at checkout for availability.",
        },
      ],
    },
    {
      category: "Account & Membership",
      questions: [
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page, enter your email, and you'll receive a password reset link within minutes.",
        },
        {
          q: "What's included in Bagchee Membership?",
          a: "Members get 10% off all purchases, free worldwide delivery, exclusive offers, early access to new releases, and priority customer support.",
        },
        {
          q: "Can I cancel my membership anytime?",
          a: "Yes, you can cancel anytime with no penalties. Your benefits remain active until your membership expires.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Feature Banner */}

      {/* Breadcrumb */}
      {/* <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Contact Us</span>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Get in Touch
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              Have a question? We're here to help! Contact us through any of
              these channels or fill out the form below.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {/* Contact Info Cards */}
          {/* <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="bg-cream-100 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {info.icon}
                  </div>
                  <h3 className="text-lg font-display font-bold text-text-main mb-2">
                    {info.title}
                  </h3>
                  <div className="space-y-1 mb-3">
                    {info.details.map((detail, idx) => (
                      <p
                        key={idx}
                        className="font-semibold text-primary text-sm"
                      >
                        {detail}
                      </p>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm font-body">
                    {info.description}
                  </p>
                </div>
              ))}
            </div>
          </section> */}

          {/* Contact Form Section */}
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Contact Info Card */}
              <div className="md:col-span-1 bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-cream-100 rounded-lg border border-gray-200"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-main mb-1">
                          {info.title}
                        </h4>
                        <div className="space-y-0.5 mb-2">
                          {info.details.map((detail, idx) => (
                            <p
                              key={idx}
                              className="font-semibold text-primary text-sm"
                            >
                              {detail}
                            </p>
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm font-body">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form Card */}
              <div className="md:col-span-2 bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-6">
                  Send us a Message
                </h2>

                {formStatus === "submitted" && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold text-center">
                      ✓ Thank you for your message! We'll get back to you within 24 hours.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-text-main mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-text-main mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="How can we help?"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold text-text-main mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="orders">Orders & Shipping</option>
                        <option value="returns">Returns & Refunds</option>
                        <option value="payment">Payment Issues</option>
                        <option value="account">Account & Membership</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-text-main mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Tell us more about your inquiry..."
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body resize-none"
                    />
                  </div>

                  {/* Captcha */}
                  <div>
                    <label htmlFor="captcha" className="block text-sm font-semibold text-text-main mb-2">
                      Security Check *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex items-center gap-3 bg-white px-4 py-2 border border-gray-200 rounded-lg">
                        <span className="font-bold text-lg text-primary">
                          {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                        </span>
                        <button
                          type="button"
                          onClick={handleRefreshCaptcha}
                          className="text-sm text-primary hover:text-primary-hover underline"
                        >
                          Refresh
                        </button>
                      </div>
                      <input
                        type="number"
                        id="captcha"
                        value={captcha}
                        onChange={handleCaptchaChange}
                        required
                        placeholder="Enter answer"
                        className={`w-full sm:w-32 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body ${captchaError ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      />
                    </div>
                    {captchaError && (
                      <p className="text-red-500 text-sm mt-1">Incorrect answer. Please try again.</p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-bold font-display uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 font-body">
                    * Required fields. We'll get back to you as soon as possible.
                  </p>
                </form>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          {/* <section className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqCategories.map((category, catIdx) => (
                <div key={catIdx} className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                  <h3 className="text-xl font-display font-bold text-text-main mb-6 pb-4 border-b-2 border-primary">
                    {category.category}
                  </h3>
                  <div className="space-y-4">
                    {category.questions.map((item, qIdx) => (
                      <div key={qIdx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h4 className="font-semibold text-text-main mb-2">
                          {item.q}
                        </h4>
                        <p className="text-gray-700 font-body leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section> */}

          {/* Map/Location Section */}
          <section className="">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-8 md:p-10 bg-gradient-to-r from-primary/5 to-secondary/5 text-center">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                  Headquarters
                </h2>
                <p className="text-gray-700 font-body max-w-2xl mx-auto mb-6">
                  Visit our office in New Delhi, India to experience our
                  physical bookstore and meet our team in person.
                </p>
                <div className="space-y-2 text-gray-700 font-body">
                  <p className="font-semibold">Bagchee.com</p>
                  <p>4384/4A Ansari Road</p>
                  <p>Daryaganj, New Delhi 110002</p>
                  <p>India</p>
                </div>
              </div>
            </div>
          </section>

          {/* Response Time Section */}
          {/* <section>
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                Expected Response Time
              </h2>
              <p className="text-gray-700 font-body mb-6">
                We value your time and make it our priority to respond quickly
                to all inquiries.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-bold text-primary text-lg">Email</p>
                  <p className="text-gray-600 font-body">Within 24 hours</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-bold text-primary text-lg">Phone</p>
                  <p className="text-gray-600 font-body">Same business day</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-bold text-primary text-lg">
                    Form Submission
                  </p>
                  <p className="text-gray-600 font-body">Within 24-48 hours</p>
                </div>
              </div>
            </div>
          </section> */}
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
