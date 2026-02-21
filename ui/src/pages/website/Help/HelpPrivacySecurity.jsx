import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Accordion from '../../../components/website/Accordion';

const HelpPrivacySecurity = () => {
  const faqs = [
    {
      q: "How does Bagchee protect my personal information?",
      a: "We use industry-leading security measures including 256-bit SSL encryption, secure servers, and PCI-DSS compliant payment processors. All data is encrypted both in transit and at rest. We regularly audit our security systems and comply with international data protection regulations."
    },
    {
      q: "What personal information does Bagchee collect?",
      a: "We collect information necessary for orders and account management: name, email, delivery addresses, phone number, and payment information. We also collect browsing data like pages visited and items viewed for analytics. We never store full credit card details - that's handled by secure payment processors."
    },
    {
      q: "How is my payment information protected?",
      a: "Payment information is processed through PCI-DSS Level 1 certified payment gateways. Your credit card details are never stored on our servers. We use tokenization to securely store references to your payment methods if you choose to save them."
    },
    {
      q: "Does Bagchee share my data with third parties?",
      a: "We do not sell your personal information. We share data only with trusted service providers (shipping, payment processing) who are bound by confidentiality agreements. We may share anonymized data for analytics. You can opt out of non-essential data sharing in your account settings."
    },
    {
      q: "What is your privacy policy?",
      a: "Our comprehensive Privacy Policy explains how we collect, use, and protect your information. It covers data retention, your rights, cookies, and third-party services. You can read the full policy at /privacy-policy."
    },
    {
      q: "Can I delete my account and associated data?",
      a: "Yes, you can request account deletion from your settings. We'll delete most personal data within 30 days. Some information like order history may be retained for legal and tax compliance purposes for up to 7 years."
    },
    {
      q: "What security measures protect my password?",
      a: "Your password is hashed using industry-standard bcrypt algorithms. We enforce strong password requirements (minimum 8 characters, mixed case, numbers). Never share your password. We never ask for your password via email or support channels."
    },
    {
      q: "Is my browsing data private?",
      a: "We use cookies and analytics tools to understand user behavior. This data is anonymized and used to improve our website. You can disable cookies in your browser settings, though this may affect functionality. See our Cookie Policy for details."
    },
    {
      q: "How do I enable two-factor authentication?",
      a: "Go to your account settings and click 'Security Settings'. Select 'Enable Two-Factor Authentication' and choose your method (SMS, authenticator app, or email). This adds an extra layer of protection to your account."
    },
    {
      q: "What is two-factor authentication and why should I use it?",
      a: "Two-factor authentication requires a second verification method (code from your phone or email) after entering your password. This prevents unauthorized access even if someone obtains your password. It's especially recommended for accounts with saved payment methods."
    },
    {
      q: "How secure is the Bagchee app?",
      a: "The Bagchee app uses the same security protocols as our website including SSL encryption, secure session management, and biometric login options. Always download from official app stores only. Keep your app updated for the latest security patches."
    },
    {
      q: "What should I do if I suspect unauthorized activity?",
      a: "Change your password immediately. Check your orders and payment methods for unauthorized activity. Contact our support team at security@bagchee.com with details. We'll investigate and help secure your account. Consider enabling two-factor authentication."
    },
    {
      q: "How are children's data protected on Bagchee?",
      a: "Bagchee is not intended for children under 13. If a child's data is collected, we obtain parental consent. We implement special safeguards for young users. Parents can contact us to review or delete their child's information."
    },
    {
      q: "Does Bagchee use artificial intelligence with my data?",
      a: "We may use AI/machine learning for recommendations and fraud detection. This uses anonymized data and improves your experience. You can opt out of personalized recommendations in your settings, though this may limit recommendation quality."
    },
    {
      q: "How can I access all the data Bagchee has about me?",
      a: "You have the right to access your data under privacy laws. Go to Account Settings and select 'Download My Data'. You'll receive a comprehensive report of all information Bagchee holds about you in a standard format."
    },
    {
      q: "What should I know about public reviews and comments?",
      a: "Any reviews or comments you post publicly are visible to all users. Don't include personal information, account details, or sensitive data in public comments. You can edit or delete your own reviews anytime from your account."
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
            <Link to="/help" className="hover:text-primary transition-colors">
              Help
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Privacy & Security</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              Privacy & Security
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">
              Learn how we protect your data and keep your account secure
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {/* Security Features Section */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-8 text-center">
              How We Keep You Secure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-display font-bold text-text-main mb-3">SSL Encryption</h3>
                <p className="text-gray-700 font-body">
                  All data transmitted between your device and our servers is encrypted with 256-bit SSL, the same technology used by banks.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-display font-bold text-text-main mb-3">PCI-DSS Compliance</h3>
                <p className="text-gray-700 font-body">
                  Payment processing meets PCI-DSS Level 1 standards. We never store full credit card numbers on our systems.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-display font-bold text-text-main mb-3">Secure Authentication</h3>
                <p className="text-gray-700 font-body">
                  Password hashing with bcrypt and optional two-factor authentication protect your account from unauthorized access.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-display font-bold text-text-main mb-3">Regular Audits</h3>
                <p className="text-gray-700 font-body">
                  We conduct regular security audits and penetration testing to identify and fix vulnerabilities.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Links Section */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-8 text-center">
              Important Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                to="/privacy-policy"
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-display font-bold text-text-main mb-2">Privacy Policy</h3>
                <p className="text-gray-600 font-body">
                  Complete details about our data collection, usage, and protection practices
                </p>
              </Link>

              <Link
                to="/terms-conditions"
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-display font-bold text-text-main mb-2">Terms & Conditions</h3>
                <p className="text-gray-600 font-body">
                  Legal terms of use and your rights when using Bagchee
                </p>
              </Link>

              <Link
                to="/secure-shopping"
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-display font-bold text-text-main mb-2">Secure Shopping</h3>
                <p className="text-gray-600 font-body">
                  Tips for safe online shopping and protecting your personal information
                </p>
              </Link>

              <a
                href="mailto:security@bagchee.com"
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-display font-bold text-text-main mb-2">Report Security Issue</h3>
                <p className="text-gray-600 font-body">
                  Found a security concern? Contact our security team immediately
                </p>
              </a>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section>
            <Accordion items={faqs} />
          </section>

          {/* Need More Help */}
          <section className="mt-12 md:mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-8 md:p-10 text-center shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">
                Your Security Matters
              </h2>
              <p className="text-gray-600 font-body mb-6 max-w-2xl mx-auto">
                We take data protection seriously. If you have any concerns or questions about your privacy and security, please reach out.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a
                  href="mailto:security@bagchee.com"
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold"
                >
                  Contact Security Team
                </a>
                <Link
                  to="/help"
                  className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold"
                >
                  Back to Help
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpPrivacySecurity;
