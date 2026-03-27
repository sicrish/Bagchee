import React, { lazy, Suspense } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 🟢 Import Hash Navigation Hook
import useScrollToHash from './hooks/useScrollToHash';

// 1. Import CurrencyProvider
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext.jsx';

// 1. Layouts
import WebsiteLayout from './layouts/WebsiteLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
const HelpDetail = lazy(() => import('./pages/website/HelpDetail'));

// Isse poori app mein data caching enable ho jayegi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data 5 min tak fresh rahega)
      cacheTime: 1000 * 60 * 30, // 30 minutes (memory mein data rahega)
      refetchOnWindowFocus: false, // Tab change karne par faltu fetch nahi karega
      retry: 1, // Error aane par sirf 1 baar auto-retry karega
    },
  },
});

// 2. Website Pages
// import Home from './pages/website/Home.jsx';
const Home = lazy(() => import('./pages/website/Home.jsx'));

const Membership = lazy(() => import('./pages/website/Membership.jsx'));
// import Membership from './pages/website/Membership.jsx';

const UserDashboard = lazy(() => import('./pages/website/UserDashboard.jsx'));
// import UserDashboard from './pages/website/UserDashboard.jsx';

const AllCategories = lazy(() => import('./pages/website/Categories.jsx'));
// import AllCategories from './pages/website/Categories.jsx';

const AllSubcategories = lazy(() => import('./pages/website/AllSubcategories.jsx'));

const ProductListing = lazy(() => import('./pages/website/ProductListing.jsx'));
// import ProductListing from './pages/website/ProductListing.jsx';

const BookDetail = lazy(() => import('./pages/website/BookDetail.jsx'));
// import BookDetail from './pages/website/BookDetail.jsx';

const Cart = lazy(() => import('./pages/website/Cart.jsx'));
// import Cart from './pages/website/Cart.jsx';

const Checkout = lazy(() => import('./pages/website/Checkout.jsx'));
// import Checkout from './pages/website/Checkout.jsx';

// Company Pages

const AuthorDetail = lazy(() => import('./pages/website/AuthorDetail.jsx'));

// import AboutUs from './pages/website/AboutUs.jsx';
const AboutUs = lazy(() => import('./pages/website/AboutUs.jsx'));

// import Testimonials from './pages/website/Testimonials.jsx';
const Testimonials = lazy(() => import('./pages/website/Testimonials.jsx'));

// import PublishersAuthors from './pages/website/PublishersAuthors.jsx';
const PublishersAuthors = lazy(() => import('./pages/website/PublishersAuthors.jsx'));

// import CareerOpportunities from './pages/website/CareerOpportunities.jsx';
const CareerOpportunities = lazy(() => import('./pages/website/CareerOpportunities.jsx'));

// import PrivacyPolicy from './pages/website/PrivacyPolicy.jsx';
const PrivacyPolicy = lazy(() => import('./pages/website/PrivacyPolicy.jsx'));

// import TermsConditions from './pages/website/TermsConditions.jsx';
const TermsConditions = lazy(() => import('./pages/website/TermsConditions.jsx'));

// import UsefulLinksPage from './pages/website/UsefulLinksPage.jsx';
const UsefulLinksPage = lazy(() => import('./pages/website/UsefulLinksPage.jsx'));


// Services Pages
// import LibraryServices from './pages/website/LibraryServices.jsx';
const LibraryServices = lazy(() => import('./pages/website/LibraryServices.jsx'));

// import ServiceDetails from './pages/ServiceDetails';
const ServiceDetails = lazy(() => import('./pages/website/ServiceDetails.jsx'));


// import SecureShopping from './pages/website/SecureShopping.jsx';
const SecureShopping = lazy(() => import('./pages/website/SecureShopping.jsx'));

// import FreeDelivery from './pages/website/FreeDelivery.jsx';
const FreeDelivery = lazy(() => import('./pages/website/FreeDelivery.jsx'));


// Help Pages
// import HelpDesk from './pages/website/HelpDesk.jsx';
const HelpDesk = lazy(() => import('./pages/website/HelpDesk.jsx'));

// import HelpCommonQuestions from './pages/website/Help/HelpCommonQuestions.jsx';
const HelpCommonQuestions = lazy(() => import('./pages/website/Help/HelpCommonQuestions.jsx'));

// import HelpShippingDelivery from './pages/website/Help/HelpShippingDelivery.jsx';
const HelpShippingDelivery = lazy(() => import('./pages/website/Help/HelpShippingDelivery.jsx'));

// import HelpPaymentPricing from './pages/website/Help/HelpPaymentPricing.jsx';
const HelpPaymentPricing = lazy(() => import('./pages/website/Help/HelpPaymentPricing.jsx'));

// import HelpReturnsRefunds from './pages/website/Help/HelpReturnsRefunds.jsx';
const HelpReturnsRefunds = lazy(() => import('./pages/website/Help/HelpReturnsRefunds.jsx'));

// import HelpOrdering from './pages/website/Help/HelpOrdering.jsx';
const HelpOrdering = lazy(() => import('./pages/website/Help/HelpOrdering.jsx'));

// import HelpMembership from './pages/website/Help/HelpMembership.jsx';
const HelpMembership = lazy(() => import('./pages/website/Help/HelpMembership.jsx'));

// import HelpYourAccount from './pages/website/Help/HelpYourAccount.jsx';
const HelpYourAccount = lazy(() => import('./pages/website/Help/HelpYourAccount.jsx'));

// import HelpLibraryServices from './pages/website/Help/HelpLibraryServices.jsx';
const HelpLibraryServices = lazy(() => import('./pages/website/Help/HelpLibraryServices.jsx'));

// import HelpPrivacySecurity from './pages/website/Help/HelpPrivacySecurity.jsx'
// const HelpPrivacySecurity = lazy(() => import('./pages/website/Help/HelpPrivacySecurity.jsx'));
;
// import HelpSecureShopping from './pages/website/Help/HelpSecureShopping.jsx';
const HelpSecureShopping = lazy(() => import('./pages/website/Help/HelpSecureShopping.jsx'));

// import ContactUs from './pages/website/ContactUs.jsx';
const ContactUs = lazy(() => import('./pages/website/ContactUs.jsx'));


const TraceOrder = lazy(() => import('./pages/website/TraceOrder.jsx'));
const NotFound = lazy(() => import('./pages/website/NotFound.jsx'));
const UnderMaintenance = lazy(() => import('./pages/website/UnderMaintenance.jsx'));



// import Profile from './pages/website/Account/Profile.jsx';
const Profile = lazy(() => import('./pages/website/Account/Profile.jsx'));

// import Address from './pages/website/Account/Address.jsx';
const Address = lazy(() => import('./pages/website/Account/Address.jsx'));

// import Wishlist from './pages/website/Account/Wishlist.jsx';
const Wishlist = lazy(() => import('./pages/website/Account/Wishlist.jsx'));

// import Orders from './pages/website/Account/Orders.jsx';
const Orders = lazy(() => import('./pages/website/Account/Orders.jsx'));

const GiftCardDetail = lazy(() => import('./pages/website/GiftCardDetail.jsx'));


// 3. Auth Pages
// import Register from './pages/auth/Register.jsx';
const Register = lazy(() => import('./pages/auth/Register.jsx'));

// import Login from './pages/auth/Login.jsx';
const Login = lazy(() => import('./pages/auth/Login.jsx'));


//auth for admin
// import ProtectedRoute from './components/common/ProtectedRoute.jsx';
const ProtectedRoute = lazy(() => import('./components/common/ProtectedRoute.jsx'));


// 4. Admin Pages
// import AdminDashboard from './pages/admin/AdminDashboard.jsx';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));


// Categories
// import Categories from './pages/admin/Categories.jsx';
const Categories = lazy(() => import('./pages/admin/Categories.jsx'));

// import AddCategory from './pages/admin/AddCategory.jsx';
const AddCategory = lazy(() => import('./pages/admin/AddCategory.jsx'));

// import EditCategory from './pages/admin/EditCategory.jsx';
const EditCategory = lazy(() => import('./pages/admin/EditCategory.jsx'));


// Product Types
// import ProductTypesList from './pages/admin/ProductTypesList.jsx';
const ProductTypesList = lazy(() => import('./pages/admin/ProductTypesList.jsx'));

// import AddProductType from './pages/admin/AddProductType.jsx';
const AddProductType = lazy(() => import('./pages/admin/AddProductType.jsx'));

// import EditProductType from './pages/admin/EditProductType.jsx';
const EditProductType = lazy(() => import('./pages/admin/EditProductType.jsx'));


// Products & Books
// import Products from './pages/admin/Products.jsx'; // Dashboard Grid
const Products = lazy(() => import('./pages/admin/Products.jsx'));

// import ProductList from './pages/admin/ProductList.jsx'; // 🟢 Renamed from BooksList (Generic List)
const ProductList = lazy(() => import('./pages/admin/ProductList.jsx'));

// import AddBook from './pages/admin/AddBook.jsx';
const AddBook = lazy(() => import('./pages/admin/AddBook.jsx'));

// import EditBook from './pages/admin/EditBook.jsx';
const EditBook = lazy(() => import('./pages/admin/EditBook.jsx'));


//Navigation 
// import NavigationList from './pages/admin/NavigationList.jsx';
const NavigationList = lazy(() => import('./pages/admin/NavigationList.jsx'));

// import AddNavigation from './pages/admin/AddNavigation.jsx';
const AddNavigation = lazy(() => import('./pages/admin/AddNavigation.jsx'));

// import EditNavigation from './pages/admin/EditNavigation.jsx';
const EditNavigation = lazy(() => import('./pages/admin/EditNavigation.jsx'));


//actors
// import ActorsList from './pages/admin/ActorsList.jsx';
const ActorsList = lazy(() => import('./pages/admin/ActorsList.jsx'));


// import AddActor from './pages/admin/AddActor.jsx';
const AddActor = lazy(() => import('./pages/admin/AddActor.jsx'));

// import EditActor from './pages/admin/EditActor.jsx';
const EditActor = lazy(() => import('./pages/admin/EditActor.jsx'));


//artists
// import ArtistsList from './pages/admin/ArtistsList.jsx';
const ArtistsList = lazy(() => import('./pages/admin/ArtistsList.jsx'));

// import AddArtist from './pages/admin/AddArtist.jsx';
const AddArtist = lazy(() => import('./pages/admin/AddArtist.jsx'));

// import EditArtist from './pages/admin/EditArtist.jsx';
const EditArtist = lazy(() => import('./pages/admin/EditArtist.jsx'));

//authors
// import AuthorsList from './pages/admin/AuthorsList.jsx';
const AuthorsList = lazy(() => import('./pages/admin/AuthorsList.jsx'));

// import AddAuthors from './pages/admin/AddAuthors.jsx';
const AddAuthors = lazy(() => import('./pages/admin/AddAuthors.jsx'));

// import EditAuthors from './pages/admin/EditAuthors.jsx';
const EditAuthors = lazy(() => import('./pages/admin/EditAuthors.jsx'));


//coupons
// import CouponsList from './pages/admin/CouponsList.jsx';
const CouponsList = lazy(() => import('./pages/admin/CouponsList.jsx'));

// import AddCoupons from './pages/admin/AddCoupons.jsx';
const AddCoupons = lazy(() => import('./pages/admin/AddCoupons.jsx'));

// import EditCoupons from './pages/admin/EditCoupons.jsx';
const EditCoupons = lazy(() => import('./pages/admin/EditCoupons.jsx'));


//languages
// import LanguagesList from './pages/admin/LanguagesList.jsx';
const LanguagesList = lazy(() => import('./pages/admin/LanguagesList.jsx'));

// import AddLanguages from './pages/admin/AddLanguages.jsx';
const AddLanguages = lazy(() => import('./pages/admin/AddLanguages.jsx'));

// import EditLanguages from './pages/admin/EditLanguages.jsx';
const EditLanguages = lazy(() => import('./pages/admin/EditLanguages.jsx'));


//tag
// import TagsList from './pages/admin/TagList.jsx';
const TagsList = lazy(() => import('./pages/admin/TagList.jsx'));

// import AddTags from './pages/admin/AddTags.jsx';
const AddTags = lazy(() => import('./pages/admin/AddTags.jsx'));

// import EditTags from './pages/admin/EditTags.jsx';
const EditTags = lazy(() => import('./pages/admin/EditTags.jsx'));


//format 
// import FormatsList from './pages/admin/FormatsList.jsx';
const FormatsList = lazy(() => import('./pages/admin/FormatsList.jsx'));

// import AddFormats from './pages/admin/AddFormats.jsx';
const AddFormats = lazy(() => import('./pages/admin/AddFormats.jsx'));

// import EditFormats from './pages/admin/EditFormats.jsx';
const EditFormats = lazy(() => import('./pages/admin/EditFormats.jsx'));


//publishers 
// import PublishersList from './pages/admin/PublishersList.jsx';
const PublishersList = lazy(() => import('./pages/admin/PublishersList.jsx'));

// import AddPublishers from './pages/admin/AddPublishers.jsx';
const AddPublishers = lazy(() => import('./pages/admin/AddPublishers.jsx'));

// import EditPublishers from './pages/admin/EditPublishers.jsx';
const EditPublishers = lazy(() => import('./pages/admin/EditPublishers.jsx'));


//series

// import SeriesList from './pages/admin/SeriesList.jsx';
const SeriesList = lazy(() => import('./pages/admin/SeriesList.jsx'));

// import AddSeries from './pages/admin/AddSeries.jsx';
const AddSeries = lazy(() => import('./pages/admin/AddSeries.jsx'));

// import EditSeries from './pages/admin/EditSeries.jsx';
const EditSeries = lazy(() => import('./pages/admin/EditSeries.jsx'));


//lable

// import LabelsList from './pages/admin/LabelsList.jsx';
const LabelsList = lazy(() => import('./pages/admin/LabelsList.jsx'));

// import AddLabels from './pages/admin/AddLabels.jsx';
const AddLabels = lazy(() => import('./pages/admin/AddLabels.jsx'));

// import EditLabels from './pages/admin/EdiLabels.jsx';
const EditLabels = lazy(() => import('./pages/admin/EdiLabels.jsx'));


//help pages
// import HelpPagesList from './pages/admin/HelpPagesList.jsx';
const HelpPagesList = lazy(() => import('./pages/admin/HelpPagesList.jsx'));

// import AddHelpPages from './pages/admin/AddHelpPages.jsx';
const AddHelpPages = lazy(() => import('./pages/admin/AddHelpPages.jsx'));

// import EditHelpPages from './pages/admin/EditHelpPages.jsx';
const EditHelpPages = lazy(() => import('./pages/admin/EditHelpPages.jsx'));


//social
// import SocialsList from './pages/admin/SocialList.jsx';
const SocialsList = lazy(() => import('./pages/admin/SocialList.jsx'));


//order
// import OrdersList from './pages/admin/OrdersList.jsx';
const OrdersList = lazy(() => import('./pages/admin/OrdersList.jsx'));

// import AddOrders from './pages/admin/AddOrders.jsx';
const AddOrders = lazy(() => import('./pages/admin/AddOrders.jsx'));

// import EditOrders from './pages/admin/EditOrders.jsx';
const EditOrders = lazy(() => import('./pages/admin/EditOrders.jsx'));


//order-status
// import OrderStatusesList from './pages/admin/OrderStatusesList.jsx';
const OrderStatusesList = lazy(() => import('./pages/admin/OrderStatusesList.jsx'));

// import AddOrderStatus from './pages/admin/AddOrderStatus.jsx';
const AddOrderStatus = lazy(() => import('./pages/admin/AddOrderStatus.jsx'));

// import EditOrderStatus from './pages/admin/EditOrderStatus.jsx';
const EditOrderStatus = lazy(() => import('./pages/admin/EditOrderStatus.jsx'));


//review
// import ReviewsList from './pages/admin/ReviewsList.jsx';
const ReviewsList = lazy(() => import('./pages/admin/ReviewsList.jsx'));

// import AddReviews from './pages/admin/AddRevies.jsx';
const AddReviews = lazy(() => import('./pages/admin/AddRevies.jsx'));

// import EditReviews from './pages/admin/EditReviews.jsx';
const EditReviews = lazy(() => import('./pages/admin/EditReviews.jsx'));


//courier
// import CouriersList from './pages/admin/CouriersList.jsx';
const CouriersList = lazy(() => import('./pages/admin/CouriersList.jsx'));

// import AddCouriers from './pages/admin/AddCouriers.jsx';
const AddCouriers = lazy(() => import('./pages/admin/AddCouriers.jsx'));

// import EditCourier from './pages/admin/EditCourier.jsx';
const EditCourier = lazy(() => import('./pages/admin/EditCourier.jsx'));


//shipping
// import ShippingOptionsList from './pages/admin/ShippinOptionsList.jsx';
const ShippingOptionsList = lazy(() => import('./pages/admin/ShippinOptionsList.jsx'));

// import AddShippingOptions from './pages/admin/AddShippingOptions.jsx';
const AddShippingOptions = lazy(() => import('./pages/admin/AddShippingOptions.jsx'));

// import EditShippingOptions from './pages/admin/EditShippingOptions.jsx';
const EditShippingOptions = lazy(() => import('./pages/admin/EditShippingOptions.jsx'));


//payment
// import PaymentsList from './pages/admin/PaymentsList.jsx';
const PaymentsList = lazy(() => import('./pages/admin/PaymentsList.jsx'));

// import AddPayments from './pages/admin/AddPayments.jsx';
const AddPayments = lazy(() => import('./pages/admin/AddPayments.jsx'));

// import EditPayments from './pages/admin/EditPayments.jsx';
const EditPayments = lazy(() => import('./pages/admin/EditPayments.jsx'));


///users
// import UsersList from './pages/admin/UsersList.jsx';
const UsersList = lazy(() => import('./pages/admin/UsersList.jsx'));

// import AddUser from './pages/admin/AddUser.jsx';
const AddUser = lazy(() => import('./pages/admin/AddUser.jsx'));

// import EditUser from './pages/admin/EditUser.jsx';
const EditUser = lazy(() => import('./pages/admin/EditUser.jsx'));

// import SectionTitlesList from './pages/admin/SectionTitlesList.jsx';
const SectionTitlesList = lazy(() => import('./pages/admin/SectionTitlesList.jsx'));

// import AddEditHomeSection from './pages/admin/AddEditHomeSection.jsx';
const AddEditHomeSection = lazy(() => import('./pages/admin/AddEditHomeSection.jsx'));

// import HomeSectionOneProducts from './pages/admin/HomeSectionOneProducts.jsx';
const HomeSectionOneProducts = lazy(() => import('./pages/admin/HomeSectionOneProducts.jsx'));

// import AddHomeSectionProduct from './pages/admin/AddHomeSectionProduct.jsx';
const AddHomeSectionProduct = lazy(() => import('./pages/admin/AddHomeSectionProduct.jsx'));

// import EditHomeSectionProduct from './pages/admin/EditHomeSectionProduct.jsx';
const EditHomeSectionProduct = lazy(() => import('./pages/admin/EditHomeSectionProduct.jsx'));

// import HomeSectionTwoProducts from './pages/admin/HomeSectionTwoProducts.jsx';
const HomeSectionTwoProducts = lazy(() => import('./pages/admin/HomeSectionTwoProducts.jsx'));

// import AddHomeSectionTwoProduct from './pages/admin/AddHomeSectionTwoProduct.jsx';
const AddHomeSectionTwoProduct = lazy(() => import('./pages/admin/AddHomeSectionTwoProduct.jsx'));


// import MainCategoriesList from './pages/admin/MainCategoriesList.jsx';
const MainCategoriesList = lazy(() => import('./pages/admin/MainCategoriesList.jsx'));

// import AddMainCategory from './pages/admin/AddMainCategory.jsx';
const AddMainCategory = lazy(() => import('./pages/admin/AddMainCategory.jsx'));

// import EditMainCategory from './pages/admin/EditMainCategory.jsx';
const EditMainCategory = lazy(() => import('./pages/admin/EditMainCategory.jsx'));

// import NewsletterSubscribers from './pages/admin/NewsletterSubscribers.jsx';
const NewsletterSubscribers = lazy(() => import('./pages/admin/NewsletterSubscribers.jsx'));

// import NewsletterSubscriberForm from './pages/admin/NewsletterSubscriberForm.jsx';
const NewsletterSubscriberForm = lazy(() => import('./pages/admin/NewsletterSubscriberForm.jsx'));

// import TopAuthors from './pages/admin/TopAuthors.jsx';
const TopAuthors = lazy(() => import('./pages/admin/TopAuthors.jsx'));

// import AddEditTopAuthor from './pages/admin/AddEditTopAuthor.jsx';
const AddEditTopAuthor = lazy(() => import('./pages/admin/AddEditTopAuthor.jsx'));

// import MetaTagsList from './pages/admin/MetaTagsList.jsx';
const MetaTagsList = lazy(() => import('./pages/admin/MetaTagsList.jsx'));

// import HomeSaleProducts from './pages/admin/HomeSaleProducts.jsx';
const HomeSaleProducts = lazy(() => import('./pages/admin/HomeSaleProducts.jsx'));

// import HomeSaleForm from './pages/admin/HomeSaleForm.jsx';
const HomeSaleForm = lazy(() => import('./pages/admin/HomeSaleForm.jsx'));

// import HomeNewNoteworthy from './pages/admin/HomeNewNoteworthy.jsx';
const HomeNewNoteworthy = lazy(() => import('./pages/admin/HomeNewNoteworthy.jsx'));

// import HomeNewNoteworthyForm from './pages/admin/HomeNewNoteworthyForm.jsx';
const HomeNewNoteworthyForm = lazy(() => import('./pages/admin/HomeNewNoteworthyForm.jsx'));



// import HomeBestSeller from './pages/admin/HomeBestSeller.jsx';
const HomeBestSeller = lazy(() => import('./pages/admin/HomeBestSeller.jsx'));

// import HomeBestSellerForm from './pages/admin/HomeBestSellerForm.jsx';
const HomeBestSellerForm = lazy(() => import('./pages/admin/HomeBestSellerForm.jsx'));

// import HomeSlider from './pages/admin/HomeSlider.jsx';
const HomeSlider = lazy(() => import('./pages/admin/HomeSlider.jsx'));

// import AddHomeSlider from './pages/admin/AddHomeSlider.jsx';
const AddHomeSlider = lazy(() => import('./pages/admin/AddHomeSlider.jsx'));


// import BooksOfMonthList from './pages/admin/BooksOfMonthList.jsx';
const BooksOfMonthList = lazy(() => import('./pages/admin/BooksOfMonthList.jsx'));

// import BooksOfMonthForm from './pages/admin/BooksOfMonthForm.jsx';
const BooksOfMonthForm = lazy(() => import('./pages/admin/BooksOfMonthForm.jsx'));

// import BooksOfMonthPage from './components/website/home/BooksOfTheMonthPage/BooksOfMonthPage.jsx';
const BooksOfMonthPage = lazy(() => import('./components/website/home/BooksOfTheMonthPage/BooksOfMonthPage.jsx'));

// import SettingsList from './pages/admin/SettingsList.jsx';
const SettingsList = lazy(() => import('./pages/admin/SettingsList.jsx'));

// import EditSettings from './pages/admin/AddEditSettings.jsx';
const EditSettings = lazy(() => import('./pages/admin/AddEditSettings.jsx'));

// import PagesDashboard from './pages/admin/PagesDashboard.jsx';
const PagesDashboard = lazy(() => import('./pages/admin/PagesDashboard.jsx'));

// import ServicesList from './pages/admin/ServicesList.jsx';
const ServicesList = lazy(() => import('./pages/admin/ServicesList.jsx'));

// import AddEditServices from './pages/admin/AddEditServices.jsx';
const AddEditServices = lazy(() => import('./pages/admin/AddEditServices.jsx'));

// import EditAboutUs from './pages/admin/EditAboutUs.jsx';
const EditAboutUs = lazy(() => import('./pages/admin/EditAboutUs.jsx'));

// import EditTestimonials from './pages/admin/EditTestimonials.jsx';
const EditTestimonials = lazy(() => import('./pages/admin/EditTestimonials.jsx'));

// import EditAuthorsPublishers from './pages/admin/EditAuthorsPublishers.jsx';
const EditAuthorsPublishers = lazy(() => import('./pages/admin/EditAuthorsPublishers.jsx'));

// import EditPrivacy from './pages/admin/EditPrivacy.jsx';
const EditPrivacy = lazy(() => import('./pages/admin/EditPrivacy.jsx'));

// import EditTerms from './pages/admin/EditTerms.jsx';
const EditTerms = lazy(() => import('./pages/admin/EditTerms.jsx'));

// import SideBySideBannerone from './pages/admin/SideBySideBannerone.jsx';
const SideBySideBannerone = lazy(() => import('./pages/admin/SideBySideBannerone.jsx'));

// import AddEditSideBannerOne from './pages/admin/AddEditSideBannerOne.jsx';
const AddEditSideBannerOne = lazy(() => import('./pages/admin/AddEditSideBannerOne.jsx'));

// import AddSocial from './pages/admin/AddEditSocial';
const AddSocial = lazy(() => import('./pages/admin/AddEditSocial.jsx'));


// Side Banner Two Imports
// import SideBySideBannertwo from './pages/admin/SideBySideBannertwo.jsx';
const SideBySideBannertwo = lazy(() => import('./pages/admin/SideBySideBannertwo.jsx'));

// import AddEditSideBannerTwo from './pages/admin/AddEditSideBannerTwo.jsx';
const AddEditSideBannerTwo = lazy(() => import('./pages/admin/AddEditSideBannerTwo.jsx'));


// Footer Management Imports
// import FooterList from './pages/admin/FooterList.jsx';
const FooterList = lazy(() => import('./pages/admin/FooterList.jsx'));

// import AddEditFooter from './pages/admin/AddEditFooter';
const AddEditFooter = lazy(() => import('./pages/admin/AddEditFooter.jsx'));




//titles



// 🟢 Component to handle hash scrolling
const ScrollToHashHandler = () => {
  useScrollToHash();
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToHashHandler /> {/* 🟢 Hash scroll handler */}
          <Toaster position="top-center" reverseOrder={false} />
          <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-cream-50 text-primary font-bold">
               Loading Bagchee Store...
            </div>
          }>
          <Routes>

            {/* --- SECTION 1: WEBSITE (Public) --- */}
            <Route path="/" element={<WebsiteLayout />}>
              <Route index element={<Home />} />
              <Route path="membership" element={<Membership />} />
              <Route path="allcategories" element={<AllCategories />} />
              <Route path="allsubcategories/:slug" element={<AllSubcategories />} />

              <Route path="books-of-the-month" element={<BooksOfMonthPage />} />
              {/* 1. New Arrivals */}
              <Route path="new-arrivals" element={<ProductListing type="new-arrivals" />} />

              {/* 2. Bestsellers */}
              <Route path="bestsellers" element={<ProductListing type="bestsellers" />} />

              {/* 3. Recommended */}
              <Route path="recommended" element={<ProductListing type="recommended" />} />

              {/* 4. Sale Page */}
              <Route path="sale" element={<ProductListing type="sale" />} />

              {/* Search results page */}
              <Route path="books" element={<ProductListing type="search" />} />

              <Route path="books/:bagcheeId/:slug" element={<BookDetail />} />

              {/* 5. Dynamic Category Page (Jese: /category/history) */}
              <Route path="books/:slug" element={<ProductListing type="category" />} />

              {/* Cart Route */}
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />

              {/* User Account Routes — require login */}
              <Route element={<ProtectedRoute requireAuth />}>
                <Route path="account" element={<UserDashboard />} />
                <Route path="account/profile" element={<Profile />} />
                <Route path="account/address" element={<Address />} />
                <Route path="account/orders" element={<Orders />} />
                <Route path="account/wishlist" element={<Wishlist />} />
              </Route>

              {/* Company Pages */}
              <Route path="useful-links" element={<UsefulLinksPage />} />
              <Route path="about-us" element={<AboutUs />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="publishers-authors" element={<PublishersAuthors />} />
              <Route path="author/:slug" element={<AuthorDetail />} />
              <Route path="career-opportunities" element={<CareerOpportunities />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms-conditions" element={<TermsConditions />} />
              <Route path="gift-card-detail" element={<GiftCardDetail />} /> {/* 🟢 Ye naya premium page */}

              {/* Services Pages */}
              <Route path="services" element={<LibraryServices />} />
              {/* 🟢 Naya Details page (Id ke sath) */}
  <Route path="/service-details/:id" element={<ServiceDetails />} />
              
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="browse-categories" element={<AllCategories />} />
              <Route path="secure-shopping" element={<SecureShopping />} />
              <Route path="free-delivery" element={<FreeDelivery />} />

              {/* Help Pages */}
              <Route path="help" element={<HelpDesk />} />
              <Route path="/help/:id" element={<HelpDetail />} />
              {/* <Route path="help/1" element={<HelpCommonQuestions />} />
              <Route path="help/2" element={<HelpShippingDelivery />} />
              <Route path="help/3" element={<HelpPaymentPricing />} />
              <Route path="help/4" element={<HelpReturnsRefunds />} />
              <Route path="help/5" element={<HelpOrdering />} />
              <Route path="help/6" element={<HelpMembership />} />
              <Route path="help/7" element={<HelpYourAccount />} />
              <Route path="help/8" element={<HelpLibraryServices />} />
              <Route path="help/9" element={<HelpSecureShopping />} /> */}
              {/* <Route path="help/10" element={<HelpPrivacySecurity />} /> */}
              <Route path="trace-order" element={<TraceOrder />} />
              <Route path="manage-account" element={<Profile />} />
              {/* <Route path="payment-options" element={<PaymentOptions />} /> */}
              {/* <Route path="shipping-info" element={<ShippingInfo />} />
              <Route path="returns-refunds" element={<ReturnsRefunds />} /> */}
              <Route path="contact-us" element={<ContactUs />} />
              <Route path="forgot-password" element={<UnderMaintenance />} />
              <Route path="disclaimer" element={<UnderMaintenance />} />

            </Route>

            {/* --- SECTION 2: AUTH --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />


            <Route element={<ProtectedRoute allowedRole="admin" />}>
              {/* --- SECTION 3: ADMIN DASHBOARD --- */}
              <Route path="/admin" element={<AdminLayout />}>

                {/* Dashboard Home */}
                <Route index element={<AdminDashboard />} />

                {/* 1. Category Management */}
                <Route path="categories" element={<Categories />} />
                <Route path="add-category" element={<AddCategory />} />
                <Route path="edit-category/:id" element={<EditCategory />} />

                {/* 2. Product Types Management */}
                <Route path="product-types" element={<ProductTypesList />} />
                <Route path="add-product-type" element={<AddProductType />} />
                <Route path="edit-product-type/:id" element={<EditProductType />} />

                {/* 3. Products Management */}
                <Route path="products" element={<Products />} /> {/* Grid View (Category selection) */}

                <Route path="add-book" element={<AddBook />} />
                <Route path="edit-book/:id" element={<EditBook />} />



                <Route path="navigation" element={<NavigationList />} />
                <Route path="add-navigation" element={<AddNavigation />} />
                <Route path="edit-navigation/:id" element={<EditNavigation />} />
                <Route path="actors" element={<ActorsList />} />
                <Route path="add-actor" element={<AddActor />} />
                <Route path="edit-actor/:id" element={<EditActor />} />
                <Route path="artists" element={<ArtistsList />} />
                <Route path="add-artist" element={<AddArtist />} />
                <Route path="edit-artist/:id" element={<EditArtist />} />
                <Route path="authors" element={<AuthorsList />} />
                <Route path="add-authors" element={<AddAuthors />} />
                <Route path="edit-author/:id" element={<EditAuthors />} />
                <Route path="coupons" element={<CouponsList />} />
                <Route path="add-coupons" element={<AddCoupons />} />
                <Route path="edit-coupons/:id" element={<EditCoupons />} />
                <Route path="languages" element={<LanguagesList />} />
                <Route path="add-languages" element={<AddLanguages />} />
                <Route path="edit-languages/:id" element={<EditLanguages />} />
                <Route path="tags" element={<TagsList />} />
                <Route path="add-tags" element={<AddTags />} />
                <Route path="edit-tags/:id" element={<EditTags />} />
                <Route path="formats" element={<FormatsList />} />
                <Route path="add-formats" element={<AddFormats />} />
                <Route path="edit-formats/:id" element={<EditFormats />} />
                <Route path="publishers" element={<PublishersList />} />
                <Route path="add-publishers" element={<AddPublishers />} />
                <Route path="edit-publishers/:id" element={<EditPublishers />} />
                <Route path="series" element={<SeriesList />} />
                <Route path="add-series" element={<AddSeries />} />
                <Route path="edit-series/:id" element={<EditSeries />} />
                <Route path="labels" element={<LabelsList />} />
                <Route path="add-labels" element={<AddLabels />} />
                <Route path="edit-labels/:id" element={<EditLabels />} />
                <Route path="help-pages" element={<HelpPagesList />} />
                <Route path="add-help-pages" element={<AddHelpPages />} />
                <Route path="edit-help-pages/:id" element={<EditHelpPages />} />
                <Route path="socials" element={<SocialsList />} />

                {/* 1. Add New Social */}
                <Route path="add-socials" element={<AddSocial />} />

                {/* 3. Edit Social  */}
                <Route path="edit-socials/:id" element={<AddSocial />} />


                <Route path="orders" element={<OrdersList />} />
                <Route path="add-orders" element={<AddOrders />} />
                <Route path="edit-orders/:id" element={<EditOrders />} />
                <Route path="order-status" element={<OrderStatusesList />} />
                <Route path="add-order-status" element={<AddOrderStatus />} />
                <Route path="edit-order-status/:id" element={<EditOrderStatus />} />
                <Route path="reviews" element={<ReviewsList />} />
                <Route path="add-reviews" element={<AddReviews />} />
                <Route path="edit-reviews/:id" element={<EditReviews />} />
                <Route path="couriers" element={<CouriersList />} />
                <Route path="add-couriers" element={<AddCouriers />} />
                <Route path="edit-couriers/:id" element={<EditCourier />} />
                <Route path="shipping-options" element={<ShippingOptionsList />} />
                <Route path="add-shipping-options" element={<AddShippingOptions />} />
                <Route path="edit-shipping-options/:id" element={<EditShippingOptions />} />
                <Route path="payments" element={<PaymentsList />} />
                <Route path="add-payments" element={<AddPayments />} />
                <Route path="edit-payments/:id" element={<EditPayments />} />
                <Route path="users" element={<UsersList />} />
                <Route path="add-user" element={<AddUser />} />
                <Route path="edit-user/:id" element={<EditUser />} />
                <Route path="titles" element={<SectionTitlesList />} />

                <Route path="add-home-section" element={<AddEditHomeSection />} />


                <Route path="edit-home-section/:id" element={<AddEditHomeSection />} />
                <Route path="home-section-1" element={<HomeSectionOneProducts />} />
                <Route path="add-home-section-1-product" element={<AddHomeSectionProduct />} />
                <Route path="edit-home-section-1/:id" element={<EditHomeSectionProduct />} />
                <Route path="home-section-2" element={<HomeSectionTwoProducts />} />



                {/* ✅ Section 2 Add Page (Agar banaya hai to) */}
                <Route path="add-home-section-2-product" element={<AddHomeSectionTwoProduct />} />


                <Route path="main-categories" element={<MainCategoriesList />} />


                <Route path="add-main-category" element={<AddMainCategory />} />


                <Route path="edit-main-category/:id" element={<EditMainCategory />} />
                <Route path="newsletter-subs" element={<NewsletterSubscribers />} />
                <Route path="add-newsletter-subscriber" element={<NewsletterSubscriberForm />} />
                <Route path="edit-newsletter-subscriber/:id" element={<NewsletterSubscriberForm />} />
                <Route path="top-authors" element={<TopAuthors />} />
                <Route path="add-top-author" element={<AddEditTopAuthor />} />
                <Route path="edit-top-author/:id" element={<AddEditTopAuthor />} />
                <Route path="meta-tags" element={<MetaTagsList />} />
                <Route path="sale-today" element={<HomeSaleProducts />} />
                {/* Add Page */}
                <Route path="add-home-sale" element={<HomeSaleForm />} />

                {/* Edit Page (Dynamic ID) */}
                <Route path="edit-home-sale/:id" element={<HomeSaleForm />} />
                <Route path="new-and-noteworthy" element={<HomeNewNoteworthy />} />

                {/* 2. Add Page */}
                <Route path="add-new-noteworthy" element={<HomeNewNoteworthyForm />} />

                {/* 3. Edit Page */}
                <Route path="edit-new-noteworthy/:id" element={<HomeNewNoteworthyForm />} />
                {/* 1. List Page */}
                <Route path="home-best-seller" element={<HomeBestSeller />} />

                {/* 2. Add New Page */}
                <Route path="add-home-best-seller" element={<HomeBestSellerForm />} />

                {/* 3. Edit Page (ID ke saath) */}
                <Route path="edit-home-best-seller/:id" element={<HomeBestSellerForm />} />

                {/* /* 1. List Page (Table View) */}
                <Route path="home-slider" element={<HomeSlider />} />

                {/* 2. Add New Slider */}
                <Route path="add-home-slider" element={<AddHomeSlider />} />

                {/* 3. Edit Slider (Dynamic ID ke saath) */}
                <Route path="edit-home-slider/:id" element={<AddHomeSlider />} />

                {/* 🟢 NEW: Books of the Month Management */}
                <Route path="books-of-the-month" element={<BooksOfMonthList />} />
                <Route path="add-books-of-the-month" element={<BooksOfMonthForm />} />
                <Route path="edit-books-of-the-month/:id" element={<BooksOfMonthForm />} />

                {/* 🟢 Pages Management*/}
                <Route path="pages" element={<PagesDashboard />} />

                <Route path="books" element={<ProductList />} />

                {/* 🟢 Settings Routes */}
                <Route path="settings" element={<SettingsList />} />
                <Route path="add-setting" element={<EditSettings />} />
                <Route path="edit-setting/:id" element={<EditSettings />} />

                {/* 🟢 SERVICES MANAGEMENT (Unique Route) */}
                <Route path="services" element={<ServicesList />} />
                <Route path="services/add" element={<AddEditServices />} />
                <Route path="services/edit/:id" element={<AddEditServices />} />
                <Route path="about-us" element={<EditAboutUs />} />
                <Route path="testimonials" element={<EditTestimonials />} />
                <Route path="authors-publishers" element={<EditAuthorsPublishers />} />
                <Route path="privacy" element={<EditPrivacy />} />
                <Route path="terms-of-use" element={<EditTerms />} />
                {/* 🟢  SideBySide Banner Management  */}
                <Route path="side-banner-one" element={<SideBySideBannerone />} />
                <Route path="add-side-banner-one" element={<AddEditSideBannerOne />} />
                <Route path="edit-side-banner-one/:id" element={<AddEditSideBannerOne />} />

                {/* 🟢 Side Banner Two Routes */}
                <Route path="side-banner-two" element={<SideBySideBannertwo />} />
                <Route path="add-side-banner-two" element={<AddEditSideBannerTwo />} />
                <Route path="edit-side-banner-two/:id" element={<AddEditSideBannerTwo />} />

                {/* 🟢 Footer Management Routes */}
                <Route path="footer" element={<FooterList />} />
                <Route path="add-footer" element={<AddEditFooter />} />

                <Route path="edit-footer/:id" element={<AddEditFooter />} />


              </Route>
            </Route>

            {/* Global Fallback */}
            <Route path="*" element={<NotFound />} />

          </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </CartProvider>
    </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;