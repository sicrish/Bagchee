import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import UsefulLinks from "../../components/website/UsefulLinks";

const AboutUs = () => {
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
            <span className="text-gray-900 font-medium">About Us</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          {/* Useful Links Sidebar */}
          <div className="md:col-span-1">
            <UsefulLinks />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">
              About Us
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>

          {/* Who We Are Section */}
          <section className="mb-10 md:mb-12">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Who We Are
                </h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed font-body">
                <p>
                  Founded in 1990 as a mail order book company in New Delhi,
                  India, Bagchee (Bagchee.com) has grown to become leading
                  international book retailer with a unique offer -- over
                  200,000 printed books and free delivery worldwide (with $50
                  spend).
                </p>
                <p>
                  We ship thousands of books every day from our fulfillment
                  centre in New Delhi, India, to more than 100 countries across
                  the world -- displaying prices in USD and Euro.
                </p>
                <p>
                  <strong>BAGCHEE.COM</strong>, the company's e-commerce
                  website, was successfully launched in 1998. The site is open
                  24/7, inviting and focused on the product. Since the site's
                  launch, we have continued to enhance its design, product
                  offerings, editorial content and customer service attributes,
                  as well as maintain our position as a value leader in book
                  e-tailing. Through Bagchee.com and our expansive online
                  community, we reach readers around the world, people who are
                  as excited about books as we are. We look forward to a future
                  filled with many new opportunities, new innovations, and, of
                  course, new books!
                </p>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="mb-10 md:mb-12">
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Our Mission
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed font-body text-lg">
                Our mission is to be the world's best destination for readers, a
                place that fosters a culture of reading and connects people with
                the books they'll love.
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section>
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                  Our Values
                </h2>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-bold text-text-main mb-2 font-display">
                    We love everything about books
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-body">
                    As entertainment, as tools of discovery, and as timeless
                    works of art, we believe books have the unique ability to
                    transport us and transform our world view.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-bold text-text-main mb-2 font-display">
                    We're nothing without our customers
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-body">
                    Bagchee would not be the destination it is now without its
                    loyal customers.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-bold text-text-main mb-2 font-display">
                    We recognize that every reader is different
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-body">
                    We know readers are as unique and complex as the books we
                    sell. We, in turn, make every effort to engage with our
                    customers, respond to their needs, and learn from their
                    feedback.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-bold text-text-main mb-2 font-display">
                    We're creative and resourceful
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-body">
                    We built our name on innovative bookselling, and we continue
                    to evolve by remaining curious and inventive.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
          </div>
        </div>
      </div>
  );
};

export default AboutUs;
