import React, { useState } from "react";
import { Helmet } from 'react-helmet-async';
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
  },
  {
    icon: <WhatsAppIcon className="w-6 h-6" />,
    title: "WhatsApp",
    details: ["+91-11-4104-8000"],
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email",
    details: ["email@bagchee.com"],
  },
];

  return (
    <div className="min-h-screen bg-cream">
      <Helmet>
        <title>Contact Us — Bagchee</title>
        <meta name="description" content="Get in touch with Bagchee. Contact us for orders, queries, or feedback. We're here to help." />
      </Helmet>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-main mb-4">
              Get in Touch
            </h1>
          </div>

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
                        {/* <p className="text-gray-600 text-sm font-body">
                          {info.description}
                        </p> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form Card */}
              <div className="md:col-span-2 bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-text-main mb-6">
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
          {/* <section className="">
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
          </section> */}

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
