import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/website/common/header/header.jsx";
import Footer from "../components/website/common/footer/footer.jsx";
import PremiumOfferBar from "../components/website/home/offer/offerSection.jsx";
import usePageMeta from "../hooks/usePageMeta.js";
import { useGeo } from "../context/GeoContext.jsx";

// Site-wide default meta. react-helmet-async renders these as the baseline; the admin
// meta block below and page-level <Helmet> tags (BookDetail, AuthorDetail, ProductListing)
// override them. The matching hardcoded <meta name="description"> was removed from
// public/index.html so it can't linger as a duplicate next to the injected one.
const DEFAULT_META_TITLE = "Bagchee — Books That Stick";
const DEFAULT_META_DESC =
  "Bagchee — India's favourite online bookstore. Shop books, CDs, DVDs, music, handicrafts and more with free delivery.";

// Private / transactional routes that must NOT be indexed (cart, checkout, account, etc.).
// These are CSR-only (not on the SSR allow-list), so the static shell carries no robots tag;
// react-helmet-async injects noindex after JS, which Googlebot honours when it renders the page.
const NOINDEX_PREFIXES = [
  "/cart",
  "/checkout",
  "/account",
  "/wishlist",
  "/order-receipt",
  "/paypal-return",
  "/pay/",
];

function WebsiteLayouts() {
  const location = useLocation();
  const pageMeta = usePageMeta();
  const { isIndia, indiaMaintenance } = useGeo();

  // Newsletter confirmation link lands here (?newsletter=confirmed) — show a success
  // message at the top, then strip the param out of the URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('newsletter') === 'confirmed') {
      toast.success("You're subscribed! Thanks for confirming your Bagchee newsletter subscription. 🎉", { duration: 6000 });
      params.delete('newsletter');
      params.delete('email');
      const qs = params.toString();
      window.history.replaceState({}, '', location.pathname + (qs ? `?${qs}` : ''));
    }
  }, [location.search, location.pathname]);

  // Check if current route is an account or cart page or checkout
  const isAccountOrCartPage =
    location.pathname.startsWith("/account") ||
    // location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/pay/");
  const isNoIndexPage = NOINDEX_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  );
  if (isIndia && indiaMaintenance && location.pathname !== '/under-maintenance') {
    return <Navigate to="/under-maintenance" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{DEFAULT_META_TITLE}</title>
        <meta name="description" content={DEFAULT_META_DESC} />
        <meta property="og:title" content={DEFAULT_META_TITLE} />
        <meta property="og:description" content={DEFAULT_META_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bagchee" />
      </Helmet>
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
      {isNoIndexPage && (
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
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
