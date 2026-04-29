import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import axios from "../../utils/axiosConfig";

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (parseInt(captcha) !== captchaQuestion.answer) {
      setCaptchaError(true);
      return;
    }

    setSubmitting(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      await axios.post(`${API_URL}/contact/submit`, formData);
      setFormStatus("submitted");
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", category: "general", message: "" });
        setCaptcha("");
        setCaptchaQuestion(generateCaptcha());
        setFormStatus("");
      }, 3000);
    } catch (err) {
      setSubmitError(err.response?.data?.msg || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

const contactInfo = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Address",
    details: ["4384/4A Ansari Road", "Daryaganj, New Delhi 110002"],
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email",
    details: ["email@bagchee.com"],
    static: true,
  },
  {
    icon: <FaWhatsapp className="w-6 h-6" />,
    title: "WhatsApp",
    whatsapp: "+911141048000",
    details: ["Chat on WhatsApp"],
  },
];

  return (
    <div className="min-h-screen bg-cream">

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
                            info.whatsapp ? (
                              <a
                                key={idx}
                                href={`https://wa.me/${info.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-primary text-sm hover:underline flex items-center gap-1"
                              >
                                {detail}
                              </a>
                            ) : (
                              <p
                                key={idx}
                                className="font-semibold text-primary text-sm"
                                style={info.static ? { userSelect: 'none', pointerEvents: 'none' } : {}}
                              >
                                {detail}
                              </p>
                            )
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
                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-semibold text-center">{submitError}</p>
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
                      disabled={submitting}
                      className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-bold font-display uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                      {submitting ? "Sending..." : "Send Message"}
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
