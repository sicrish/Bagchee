import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/website/common/header/header.jsx";
import Footer from "../components/website/common/footer/footer.jsx";
import PremiumOfferBar from "../components/website/home/offer/offerSection.jsx";

function WebsiteLayouts() {
  const location = useLocation();

  // Check if current route is an account or cart page or checkout
  const isAccountOrCartPage =
    location.pathname.startsWith("/account") ||
    // location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/checkout");
  return (
    <>
      {!isAccountOrCartPage && <Header /> }
      <main
        className={
          !isAccountOrCartPage
            ? "flex-grow pt-[58px] md:pt-[80px] lg:pt-[150px] min-h-screen"
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
