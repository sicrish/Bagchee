import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Mail,
  Package,
  FileText,
  Image,
  User,
  CheckCircle,
} from "lucide-react";
import axios from "../../utils/axiosConfig";
import { createSafeHtml } from '../../utils/sanitize';

const PublishersAuthors = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/authors-publishers/get`);
        if (res.data.status && res.data.data) {
          setPageData(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load Authors & Publishers data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const hasContent = pageData && (pageData.pageContent || pageData.page_content);
  const content = pageData?.pageContent || pageData?.page_content || '';
  const title = pageData?.title || 'Publisher & Author Guidelines';

  const sections = [
    {
      title: "How to Submit Content",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed font-body">
          <p>Content has two primary categories at Bagchee.com: <strong>bibliographic data</strong> (title, author, etc.) and <strong>merchandising data</strong> (description, cover image, etc.).</p>
          <p>Listing a book with Bagchee.com is to send in bibliographic data. Bibliographic data should be sent at least <strong>60 days prior to publication</strong>, or as soon as possible. If data changes before publication, please send updates and they will be applied.</p>
          <p>While bibliographic data will ensure the book's listing on Bagchee.com, the more merchandising data provided by the publisher -- cover image, promotional copy, etc. -- the more likely it is that the book will sell.</p>
          <p className="text-sm text-gray-600 italic">Please note that this data must be provided by the publisher and self-published authors. All data is subject to verification.</p>
        </div>
      ),
    },
    {
      title: "Sending Your Information",
      icon: <Mail className="w-5 h-5" />,
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed font-body">
          <div>
            <h4 className="font-bold text-text-main mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Email (Recommended for 50 or fewer titles)</h4>
            <p>If you are a publisher or distributor who offers 50 or fewer titles via Bagchee.com, this is the preferred means for adding content.</p>
            <p className="mt-2">Please send your content via email to: <a href="mailto:email@bagchee.com" className="text-primary hover:underline font-semibold">email@bagchee.com</a></p>
          </div>
          <div>
            <h4 className="font-bold text-text-main mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> CD-ROM, Zip Disk, or Floppy Disk</h4>
            <p className="mb-2">These media provide an optional but slower method for sending us your information. If you are submitting content on CD-ROM or zip/floppy disk, it should be mailed to:</p>
            <div className="bg-cream-100 rounded-lg p-4 border border-gray-200">
              <p className="font-semibold">Bagchee.com</p>
              <p>Images Inquiry - Sample Book Program</p>
              <p>4384/4A Ansari Road</p>
              <p>New Delhi 110 002</p>
              <p>India</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-text-main mb-2">Physical Books or Jackets</h4>
            <p>Publishers without electronic capability may send us books or jackets so we can scan the covers. This process takes more time, but if you prefer this method, please mail to the same address above.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Required Book Information",
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed font-body">
          <p className="font-semibold text-text-main">A basic bibliographic data record consists of the following items:</p>
          <ul className="space-y-2 ml-4">
            {["ISBN: International Standard Book Number", "Title: Full book title", "Author: Author name(s)", "Publisher: Publisher name", "Format: Hardcover, Paperback, etc.", "Price: Retail price", "Publication Date: Release date", "Description: Brief description (no hyperlinks)", "Table of Content: Simple list of chapters (no bullets or page numbers)", "Author Bio: Information about the author(s)", "Discount: Discount to Bagchee.com (not to consumer)"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">&#8226;</span>
                <span><strong>{item.split(':')[0]}:</strong>{item.split(':').slice(1).join(':')}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Book Cover Image Guidelines",
      icon: <Image className="w-5 h-5" />,
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed font-body">
          <p>Book cover images are very important in helping our customers become more familiar with your product. Book cover image files sent to Bagchee.com should have the following attributes:</p>
          <ul className="space-y-2 ml-4">
            {["Resolution of 72 dpi", "Image size of 400 pixels in the longest dimension (height or width). Larger images will be accepted.", "Image saved in .jpg format and have the \".jpg\" file extension", "File named according to the ISBN of the item (e.g., 0000000000.jpg)", "Flat scan of front cover only - no shadow, border, or space around image", "Image should have no rotation - the top edge should be at the top", "Image should not be a stand-up product-display photo or part of a collage"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">&#8226;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Author Photo Guidelines",
      icon: <User className="w-5 h-5" />,
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed font-body">
          <p>Submit an author photo for our use with an author biography to help our customers know more about the creator of the work. Follow these specifications:</p>
          <ul className="space-y-2 ml-4">
            {["Image resolution should be 72 dpi", "Image should be at least 100 pixels wide", "Image should be saved in the .jpg file format", "Name files with the author's name and the extension \".jpg\" (e.g., public.john.q.jpg)", "Image should not include a border or any special formatting", "Image should not include anything besides the author's image"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">&#8226;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Publishers & Authors</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-main mb-4">{title}</h1>
            <p className="text-gray-600 text-base md:text-lg font-body max-w-2xl mx-auto">Everything you need to know about submitting your books to Bagchee.com</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasContent ? (
            <div className="bg-cream-100 rounded-xl border border-gray-200 p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="prose prose-lg max-w-none font-body text-gray-700 leading-relaxed" dangerouslySetInnerHTML={createSafeHtml(content)} />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={index} className="bg-cream-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                    <button onClick={() => toggleSection(index)} className="w-full flex items-center justify-between p-6 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-primary">{section.icon}</div>
                        </div>
                        <h2 className="text-lg md:text-xl font-display font-bold text-text-main">{section.title}</h2>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 flex-shrink-0 ${openSection === index ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === index ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="p-6 pt-0 border-t border-gray-100">{section.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 md:mt-16">
                <div className="bg-cream-100 rounded-xl border border-gray-200 p-8 md:p-10 shadow-sm text-center">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-4">Ready to Submit Your Book?</h2>
                  <p className="text-gray-600 font-body mb-6 max-w-2xl mx-auto">Have questions or ready to get started? Contact us today and we'll be happy to assist you.</p>
                  <a href="mailto:email@bagchee.com" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold">Contact Us</a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishersAuthors;
