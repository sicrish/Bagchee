import React from 'react'
import PremiumOfferBar from '../../components/website/home/offer/offerSection.jsx'
import HeroSlider from '../../components/website/home/heroSection/heroSection.jsx'
import NewAndNotable from '../../components/website/home/NewAndNotableSection/newAndNotableSection.jsx'
import DualBanner from '../../components/website/home/sideBysideBanner/sideBySideBanner.jsx'
import BestSellerSection from '../../components/website/home/BestSellerSection/BestSeller.jsx'
import RecommendedSection from '../../components/website/home/RecommendedSection/RecommendedSection.jsx'
import SaleToday from '../../components/website/home/SaleToday/SaleToday.jsx'
import ShopByCategory from '../../components/website/home/shopByCategory/shopByCategory.jsx'
import FeaturedAuthors from '../../components/website/home/featuredAuthorSection/FeaturedAuthor.jsx'
import BestSellerBanner from '../../components/website/home/BestSellerBanner.jsx'
import SaleTodayBanner from '../../components/website/home/SaleTodayBanner.jsx'
import BooksOfTheMonthSection from '../../components/website/home/BooksOfTheMonthSection/BooksOfTheMonthSection.jsx'

function home() {
  return (
    <>
      <PremiumOfferBar />
      <HeroSlider />
      <NewAndNotable />
      
    
      {/* <BestSellerBanner /> */}
      <BestSellerSection />
      <DualBanner /> 
      <BooksOfTheMonthSection />
      <RecommendedSection />
      {/* <SaleTodayBanner/> */}
      <SaleToday />
      <ShopByCategory />
     
      <FeaturedAuthors />
    </>
  )
}

export default home
