import React from "react";

const PremiumOfferBar = () => {
  return (
    <div className="w-full bg-accent text-black py-2 text-center font-montserrat relative">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-6 text-[10px] md:text-xs font-semibold tracking-wide uppercase">
        {/* Link 1 */}
        <a
          href="/times-books"
          className="hover:text-black/80 transition-colors duration-200"
        >
          Save 10% on Times books
        </a>

        {/* Separator */}
        <span className="hidden md:inline text-black/50">|</span>

        {/* Link 2 */}
        <a
          href="/subscriptions"
          className="hover:text-black/80 transition-colors duration-200"
        >
          Book subscriptions
        </a>

        {/* Separator */}
        <span className="hidden md:inline text-black/50">|</span>

        {/* Link 3 */}
        <a
          href="/booker-shortlist"
          className="hover:text-black/80 transition-colors duration-200 flex items-center gap-2"
        >
          <span>Save 25% on Booker shortlist</span>
        </a>
      </div>
    </div>
  );
};

export default PremiumOfferBar;
