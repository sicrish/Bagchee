import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Universal Accordion Component for FAQs and collapsible content
 * 
 * Usage:
 * <Accordion items={[
 *   { q: "Question?", a: "Answer..." },
 *   { q: "Question 2?", a: "Answer 2..." }
 * ]} />
 */
const Accordion = ({ 
  items = [], 
  className = "",
  itemClassName = "bg-white",
  questionClassName = "text-lg font-display font-bold text-text-main",
  answerClassName = "text-gray-700 leading-relaxed font-body",
  multipleOpen = false // Allow multiple accordions open at once
}) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    if (multipleOpen) {
      // For multiple open: store array of open indices
      setOpenIndex(prev => {
        if (Array.isArray(prev)) {
          return prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index];
        }
        return [index];
      });
    } else {
      // For single open: store just the index
      setOpenIndex(openIndex === index ? null : index);
    }
  };

  const isOpen = (index) => {
    if (multipleOpen) {
      return Array.isArray(openIndex) && openIndex.includes(index);
    }
    return openIndex === index;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${itemClassName} bg-cream-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300`}
        >
          {/* Question/Header */}
          <button
            onClick={() => toggleAccordion(index)}
            className="w-full flex items-center justify-between p-6 text-left bg-cream-200/40"
            aria-expanded={isOpen(index)}
            aria-controls={`accordion-content-${index}`}
          >
            <h3 className={`pr-4 ${questionClassName}`}>{item.q}</h3>
            <ChevronDown
              className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                isOpen(index) ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Answer/Content */}
          <div
            id={`accordion-content-${index}`}
            className={`overflow-hidden bg-cream-100 transition-all duration-300 ${
              isOpen(index) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6 pt-0 border-t border-gray-100">
              <p className={answerClassName}>{item.a}</p>

              {/* Optional: If answer has additional content */}
              {item.details && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {typeof item.details === "string" ? (
                    <p className={`text-sm ${answerClassName}`}>
                      {item.details}
                    </p>
                  ) : (
                    item.details
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
