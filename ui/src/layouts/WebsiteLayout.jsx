import React from "react";
import { Helmet } from "react-helmet-async";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/website/common/header/header.jsx";
import Footer from "../components/website/common/footer/footer.jsx";
import PremiumOfferBar from "../components/website/home/offer/offerSection.jsx";
import usePageMeta from "../hooks/usePageMeta.js";

function WebsiteLayouts() {
  const location = useLocation();
  const pageMeta = usePageMeta();

  // Check if current route is an account or cart page or checkout
  const isAccountOrCartPage =
    location.pathname.startsWith("/account") ||
    // location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/checkout");
  return (
    <>
      {pageMeta && (
        <Helmet>
          {pageMeta.title     && <title>{pageMeta.title}</title>}
          {pageMeta.metaTitle && <meta name="title" content={pageMeta.metaTitle} />}
          {pageMeta.metaDesc  && <meta name="description" content={pageMeta.metaDesc} />}
          {pageMeta.metaKeywords && <meta name="keywords" content={pageMeta.metaKeywords} />}
          {pageMeta.metaTitle && <meta property="og:title" content={pageMeta.metaTitle} />}
          {pageMeta.metaDesc  && <meta property="og:description" content={pageMeta.metaDesc} />}
        </Helmet>
      )}
      {!isAccountOrCartPage && <Header /> }
      <main
        className={
          !isAccountOrCartPage
            ? "flex-grow pt-[58px] md:pt-[150px] lg:pt-[150px] min-h-screen"
            : "min-h-screen"
        }
      >
     {!isAccountOrCartPage && <PremiumOfferBar />}
        <Outlet />
      </main>
      {!isAccountOrCartPage && <Footer />}
      {/* <Header />
            <main className='flex-grow pt-[60px] lg:pt-[160px] min-h-screen'>
                <Outlet />
            </main>
            <Footer /> */}
    </>
  );
}

export default WebsiteLayouts;
