import express from 'express';
import helmet from 'helmet'; // 🟢 1. Security Headers ke liye
import rateLimit from 'express-rate-limit'; // 🟢 2. Bot Protection ke liye
import fileupload from 'express-fileupload';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './models/connection.js';

// 🟢 FIX 1: Decrypt Body Import karein (Check karein file path sahi ho)
import { decryptBody } from './middleware/decryptBody.js'

// Router Imports
import userroute from './routes/user.router.js';
import categoryroute from './routes/category.router.js';
import SubCategoryroute from './routes/Subcategory.js';
import Productrouter from './routes/Product.router.js';
import paymentRoutes from './routes/payment.router.js';
import bannerRoutes from './routes/banner.js';
import productTypeRoutes from "./routes/productType.routes.js";
import navigationRoutes from "./routes/navigation.routes.js";
import actorRoutes from "./routes/actor.routes.js";
import artistRoutes from "./routes/artist.routes.js";
import authorRoutes from "./routes/author.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import languageRoutes from "./routes/language.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import formatRoutes from "./routes/format.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import seriesRoutes from "./routes/series.routes.js";
import labelRoutes from "./routes/label.routes.js";
import helpPageRoutes from "./routes/helpPage.routes.js";
import orderRoutes from "./routes/order.routes.js";
import orderStatusRoutes from './routes/OrderStatus.routes.js';
import reviewRoutes from './routes/Review.routes.js';
import courierRoutes from './routes/Courier.routes.js';
import shippingOptionRoutes from './routes/ShippingOption.route.js';
import homeSectionRoutes from './routes/homeSectionRoutes.js'
import homeSectionProductRoutes from './routes/homeSectionProductRoutes.js';
import mainCategoryRoutes from './routes/mainCategoryRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import topAuthorRoutes from './routes/topAuthorRoutes.js';
import homeSaleRoutes from './routes/HomeSaleProduct.routes.js';
import homeNewNoteworthyRoutes from './routes/HomeNewNoteworthy.routes.js'; 
import homeBestSellerRoutes from './routes/homeBestSeller.routes.js';
// 🟢 1. Import Route (File ke upar)
import homeSliderRoutes from './routes/HomeSlider.routes.js';
import booksOfMonthRoutes from './routes/booksOfMonth.routes.js';
import SettingRoutes from './routes/settingsRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import aboutRoutes from './routes/aboutRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import authorsPublishersRoutes from './routes/authorsPublishersRoutes.js'
import privacyRoutes from './routes/privacyRoutes.js'
import termsRoutes from './routes/termsRoutes.js'
import sideBannerOneRoutes from './routes/sideBannerOneRoutes.js';
import socialRoutes from './routes/socialRoutes.js'
import sideBannerTwoRoutes from './routes/sideBannerTwoRoutes.js'
import footerRoutes from './routes/footerRoutes.js';



const app = express();



// 🟢 Global Limiter: Pure website ke liye
// Ek IP se 15 minute mein maximum 200 requests
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 1000, 
    message: { status: false, msg: "Too many requests, please try again after 5 min." },
    standardHeaders: true, 
    legacyHeaders: false,
});

// 🟢 Strict Limiter: Sirf Login aur Register ke liye
// Ek IP se 1 ghante mein sirf 10 attempts (Brute force protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500,                    //NOTE: isko bad me 10 krna h testing ke liye badayi h 
    message: { status: false, msg: "Too many login attempts. Try again after an hour." }
});



dotenv.config();
connectDB(); // DB Connection

const PORT = process.env.PORT || 3001;

// Directory Path Setup (ES Module fix)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false,        // NOTE: bad me change krna h dono ko 
    crossOriginEmbedderPolicy: false,
})); // 🟢 Helmet sabse pehle (Security Headers set karega)
app.use(globalLimiter);// 1. Middlewares


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(decryptBody);
app.use(express.urlencoded({ extended: true }));

app.use(fileupload({
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    abortOnLimit: true,
    responseOnLimit: "File size limit has been exceeded. Max 10MB allowed.", // 🟢 Custom message bhejega
    limitHandler: (req, res, next) => {
        return res.status(413).json({ status: false, msg: "File too large! Max 10MB allowed." });
    }
}));


const cacheOptions = {
    maxAge: '7d',          // 1. Browser 7 din tak server se nahi puchega
    etag: true,            // 2. File ki unique ID (Validation ke liye)
    lastModified: true,    // 3. File kab badli thi uski date
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, no-cache'); // Dev ke waqt useful
    }
};


// 2. 🟢 STATIC FOLDER (Images ko Public Access Dene ke liye)
// Browser me access hoga: http://localhost:3001/uploads/image.jpg
app.use('/uploads',(req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Extra safety for images
    next();
}, express.static(path.join(__dirname, 'uploads'),cacheOptions));


// ==========================================================
// 🛡️ APPLY AUTH LIMITER (Must be above /user route)
// ==========================================================
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);
// ==========================================================

// 3. Application Routes
app.use("/user", userroute);
app.use("/category", categoryroute);
app.use("/subcategory", SubCategoryroute);
app.use("/product", Productrouter);
app.use('/payments', paymentRoutes);
app.use("/banner", bannerRoutes);

app.use("/product-types", productTypeRoutes);
app.use("/navigation", navigationRoutes);
app.use("/actors", actorRoutes);
app.use("/artists", artistRoutes);
app.use("/authors", authorRoutes);
app.use("/coupons", couponRoutes);
app.use("/languages", languageRoutes);
app.use("/tags", tagRoutes);
app.use("/formats", formatRoutes);
app.use("/publishers", publisherRoutes);
app.use("/series", seriesRoutes);
app.use("/labels", labelRoutes);
app.use("/help-pages", helpPageRoutes);
app.use("/orders", orderRoutes);
app.use('/order-status', orderStatusRoutes);
app.use('/reviews', reviewRoutes);
app.use('/couriers', courierRoutes);
app.use('/shipping-options', shippingOptionRoutes);
app.use('/home-sections', homeSectionRoutes);
app.use('/home-sections/products', homeSectionProductRoutes);
app.use('/main-categories', mainCategoryRoutes);
app.use('/newsletter-subs', newsletterRoutes);
app.use('/top-authors', topAuthorRoutes);
app.use('/home-sale-products', homeSaleRoutes);
app.use('/home-new-noteworthy', homeNewNoteworthyRoutes);
app.use('/home-best-seller', homeBestSellerRoutes);
// 🟢 3. Use Route (Routes section mein)
app.use('/home-slider', homeSliderRoutes);
app.use('/books-of-the-month', booksOfMonthRoutes);
app.use('/settings',SettingRoutes);
app.use('/services', serviceRoutes)
app.use('/about-us', aboutRoutes);
app.use('/testimonials', testimonialRoutes);
app.use('/authors-publishers', authorsPublishersRoutes);
app.use('/privacy', privacyRoutes);
app.use('/terms', termsRoutes);
app.use('/side-banner-one', sideBannerOneRoutes);
app.use('/socials', socialRoutes);
app.use('/side-banner-two', sideBannerTwoRoutes);
app.use('/footer', footerRoutes);

// Step 1: Frontend ke 'dist' folder ka path set karein
// NOTE: Agar aapka folder name 'build' hai to 'dist' ki jagah 'build' likhein.
// Hum maan rahe hain: Root -> backend -> server.js & frontend -> dist
// const frontendBuildPath = path.join(__dirname, "../ui/build");

// Step 2: Backend ko bole ki static files (CSS/JS) yahan se le
// app.use(express.static(frontendBuildPath));

// Step 3: Koi bhi aisa route jo upar API mein match nahi hua, 
// uske liye React ka index.html bhejein (React Router fix)
// app.get("*", (req, res) => {
//     res.sendFile(path.join(frontendBuildPath, "index.html"));
// });

// Server Listen
// app.listen(PORT, () => {
//     console.log(`Server invoked at http://localhost:${PORT}`);
// });

// Server Listen (for local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server invoked at http://localhost:${PORT}`);
    });
}

// Export for Vercel
export default app;