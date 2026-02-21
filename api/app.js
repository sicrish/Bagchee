import express from 'express';
import fileupload from 'express-fileupload';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './models/connection.js';

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

const app = express();
dotenv.config();
connectDB(); // DB Connection

const PORT = process.env.PORT || 3001;

// Directory Path Setup (ES Module fix)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 FILE UPLOAD MIDDLEWARE (Updated for Local Storage)
app.use(fileupload({
   
    createParentPath: true, // Agar 'uploads' folder nahi h to khud bana dega
    limits: { fileSize: 50 * 1024 * 1024 }, // 5MB Max File Size
    abortOnLimit: true,
}));

// 2. 🟢 STATIC FOLDER (Images ko Public Access Dene ke liye)
// Browser me access hoga: http://localhost:3001/uploads/image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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