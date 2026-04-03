'use client';

import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

// 🟢 Performance Optimization: Lazy Loading Components
// Isse sirf wahi code load hoga jo screen par dikhne wala hai
const PremiumOfferBar = lazy(() => import('../../components/website/home/offer/offerSection.jsx'));
const HeroSlider = lazy(() => import('../../components/website/home/heroSection/heroSection.jsx'));
const NewAndNotable = lazy(() => import('../../components/website/home/NewAndNotableSection/newAndNotableSection.jsx'));
const BestSellerSection = lazy(() => import('../../components/website/home/BestSellerSection/BestSeller.jsx'));
const DualBanner = lazy(() => import('../../components/website/home/sideBysideBanner/sideBySideBanner.jsx'));
const BooksOfTheMonthSection = lazy(() => import('../../components/website/home/BooksOfTheMonthSection/BooksOfTheMonthSection.jsx'));
const RecommendedSection = lazy(() => import('../../components/website/home/RecommendedSection/RecommendedSection.jsx'));
const SaleToday = lazy(() => import('../../components/website/home/SaleToday/SaleToday.jsx'));
const ShopByCategory = lazy(() => import('../../components/website/home/shopByCategory/shopByCategory.jsx'));
const FeaturedAuthors = lazy(() => import('../../components/website/home/featuredAuthorSection/FeaturedAuthor.jsx'));

// Loading Placeholder
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center bg-cream-50">
    <Loader2 className="animate-spin text-primary w-10 h-10 mb-2" />
    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Loading Experience...</p>
  </div>
);

function Home() {
  return (
    <div className="bg-cream-50">
      <Helmet>
        <title>Bagchee — Books That Stick</title>
        <meta name="description" content="Bagchee — India's favourite online bookstore. Shop books, CDs, DVDs, music, handicrafts and more with free delivery." />
        <meta name="keywords" content="buy books online, books india, online bookstore, bagchee, hindi books, english books, children books" />
        <meta property="og:title" content="Bagchee — Books That Stick" />
        <meta property="og:description" content="India's favourite online bookstore. Shop books, CDs, DVDs and more." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* 🟢 Suspense handles lazy loading state */}
      <Suspense fallback={<PageLoader />}>
        
        {/* <PremiumOfferBar /> */}
        
        <HeroSlider />
        
        <NewAndNotable />
        
        {/* Commented Banners preserved as per your original code */}
        {/* <BestSellerBanner /> */}
        
        <BestSellerSection />
        
        <DualBanner /> 
        
        <BooksOfTheMonthSection />
        
        <RecommendedSection />
        
        {/* <SaleTodayBanner/> */}
        
        <SaleToday />
        
        <ShopByCategory />
        
        <FeaturedAuthors />

      </Suspense>
    </div>
  );
}

export default Home;