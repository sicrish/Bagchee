'use client';

import React, { Suspense, lazy } from 'react';
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
const FeaturedToday = lazy(() => import('../../components/website/home/FeaturedTodaysection/FeaturedToday.jsx'));
const InTheSpotlight = lazy(() => import('../../components/website/home/InTheSpotlight/InTheSpotlight.jsx'));
const EGiftcardBanner = lazy(() => import('../../components/website/home/E-GiftCardBanner.jsx'));
const DualBannerTwo = lazy(() => import('../../components/website/home/sideBysideBanner2/sideBysideBanner2.jsx'));
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
      {/* 🟢 Suspense handles lazy loading state */}
      <Suspense fallback={<PageLoader />}>

        {/* <PremiumOfferBar /> */}

        <HeroSlider />


        <NewAndNotable />
        <FeaturedToday />
        
        <InTheSpotlight />
        <BestSellerSection />

        <DualBanner />

        <BooksOfTheMonthSection />

        <RecommendedSection />

        {/* <SaleTodayBanner/> */}

        <SaleToday />
<DualBannerTwo/>
        <ShopByCategory />

        <FeaturedAuthors />

        <EGiftcardBanner />
      </Suspense>
    </div>
  );
}

export default Home;