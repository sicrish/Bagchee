import React, { memo, useCallback, useState } from 'react';
import { createSafeHtml } from '../../../../utils/sanitize';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Mail, Facebook, Twitter, Instagram, ArrowRight, Loader2, Pinterest, // Pinterest ke liye
  Chrome, ChevronDown
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';


import axios from '../../../../utils/axiosConfig';
import Logo from '../../../../components/common/Logo.jsx';
import logoImg from '../../../../assets/images/common/logo.png';


// Import images (Aapke local path ke hisab se)
import visaImg from '../../../../assets/images/website/payments/Visa.svg';
import amexImg from '../../../../assets/images/website/payments/american.png';
import discoverImg from '../../../../assets/images/website/payments/Discover.png';
import mastercardImg from '../../../../assets/images/website/payments/MasterCard.svg';
import paypalImg from '../../../../assets/images/website/payments/PayPal.svg';



const NewsletterForm = memo(({ mobile }) => {
  const [email, setEmail] = useState("");

  // React Query Mutation: Backend ko data bhejne ke liye
  const mutation = useMutation({
    mutationFn: async (emailValue) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/newsletter-subs/save`, { email: emailValue });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success("Subscribed successfully! 🚀");
        setEmail(""); // Success ke baad input clear
      } else {
        toast.error(data.msg || "Failed to subscribe");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Server Error. Try again later.");
    }
  });

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email!");

    // Basic Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return toast.error("Invalid email address!");

    mutation.mutate(email);
  };

  return (
    <form
      onSubmit={handleLocalSubmit}
      className={`relative flex items-center shadow-lg rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 hover:border-accent/50 transition-colors duration-300 ${mobile ? 'w-full' : ''}`}
    >
      <input
        type="email"
        value={email}
        placeholder="Enter your email for updates..."
        onChange={(e) => setEmail(e.target.value)}
        disabled={mutation.isPending}
        className="w-full bg-transparent text-white placeholder-gray-300 px-6 py-3 focus:outline-none text-sm"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-accent text-text-main hover:bg-white hover:text-primary transition-colors px-6 py-3 flex items-center justify-center font-bold"
      >
        {mutation.isPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <ArrowRight size={18} />
        )}
      </button>
    </form>
  );
});



const renderSocialIcon = (social) => {
  // 1. Agar Image maujood hai (image path mil raha hai)
  if (social.icon_image) {
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '');
    const imageUrl = social.icon_image.startsWith('http') ? social.icon_image : `${API_BASE}${social.icon_image}`;
    return <img src={imageUrl} alt={social.title} className="w-4 h-4 object-contain" />;
  }

  // 2. Fallback: Agar image nahi hai, toh Title ke hisab se Lucide Icons
  const title = social.title.toLowerCase();
  if (title.includes('facebook')) return <Facebook size={16} />;
  if (title.includes('instagram')) return <Instagram size={16} />;
  if (title.includes('twitter') || title.includes('x')) return <Twitter size={16} />;
  if (title.includes('mail') || title.includes('email')) return <Mail size={16} />;

  if (title.includes('pinterest')) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.946-.199-2.399.041-3.432.218-.937 1.406-5.965 1.406-5.965s-.359-.718-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
    );
  }

  if (title.includes('google')) {
    return (
      <div className="flex items-center">
        <span className="font-black text-[10px]">G+</span>
      </div>
    );
  }

  // Default icon agar kuch match na kare
  return <ArrowRight size={16} />;
};


const PaymentCard = memo(({ src, alt }) => (
  <div className="h-8 w-12 bg-white rounded flex items-center justify-center shadow-md opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"><img src={src} alt={alt} className="h-4 max-w-[80%] object-contain" loading="lazy" /></div>
));


const Footer = () => {



  const navigate = useNavigate();
  const authData = localStorage.getItem('auth');
  const isLoggedIn = !!authData;


  const [openMobileCol, setOpenMobileCol] = useState(null);
  const toggleMobileCol = (colName) => {
    setOpenMobileCol(openMobileCol === colName ? null : colName);
  };



  const { data: footerData, isLoading } = useQuery({
    queryKey: ['footer-links'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/footer/list`);
      return res.data.status ? res.data.data : [];
    },
    staleTime: 600000,
  });

  const traceOrderPath = isLoggedIn ? "/account/orders" : "/trace-order";



  const handleContentClick = (e) => {
    const target = e.target.closest('a');
    if (target && target.href.includes(window.location.origin)) {
      e.preventDefault();
      const path = target.getAttribute('href').replace(window.location.origin, "");
      if (target.innerText.toLowerCase().includes("trace an order")) {
        navigate(traceOrderPath);
      } else {
        navigate(path);
      }
    }
  };





  // 1. Social Links Fetch karne ke liye
  const { data: socialLinks = [] } = useQuery({
    queryKey: ['footer-socials'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/socials/list`);
      // Filter wahi karein jo 'showInFooter' aur 'isActive' hain
      return res.data.status ? res.data.data.filter(s => s.showInFooter && s.isActive) : [];
    },
    staleTime: 600000,
  });


  // 🟢 1. Socials ko Filter Karna (WhatsApp alag, Baaki alag)
  const whatsappLink = socialLinks.find(s => s.title.toLowerCase().includes('whatsapp'));
  const otherSocialLinks = socialLinks.filter(s => !s.title.toLowerCase().includes('whatsapp'));


  // 🟢 Helper to get column by name (Case-insensitive)
  const getCol = (name) => footerData?.find(c => c.name.toLowerCase() === name.toLowerCase());

  // 🟢 NEW MAGIC FUNCTION: Dynamic text me automatic icons lagane ke liye
  // 🟢 NEW MAGIC FUNCTION: Dynamic text me automatic icons lagane ke liye (Grouping Logic)
  const formatContactInfo = (htmlString) => {
    if (!htmlString) return "";

    // Icons ke SVG code (Aapke theme ke accent color #FFC107 me)
    const mapIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;

    // Step 1: HTML saaf karo (Tags hatao, sirf text aur <br> bachao)
    let cleanText = htmlString.replace(/<(?!\/?br\s*\/?)[^>]+>/gi, '');

    // Step 2: Lines me todo
    const rawLines = cleanText.split(/(?:\r\n|\r|\n|<br\s*\/?>)/i).map(line => line.trim()).filter(line => line.length > 0);

    let resultHtml = "";
    let addressBuffer = []; // 📦 Ye buffer address ki lines ko jama karega

    // Step 3: Har line ko padho
    rawLines.forEach((line) => {
      const isEmail = line.includes('@');

      if (isEmail) {
        // Agar pichli kuch address lines jama hain, toh pehle unhe EK SATH print karo (Sirf Ek Map Icon ke sath)
        if (addressBuffer.length > 0) {
          resultHtml += `
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; line-height: 1.5;">
              ${mapIcon}
              <div style="flex: 1; word-break: break-word;">${addressBuffer.join('<br/>')}</div>
            </div>
          `;
          addressBuffer = []; // Print karne ke baad buffer khali kar do
        }

        // Ab Email print karo (Mail Icon ke sath)
        const emailLink = `<a href="mailto:${line}" style="color: inherit; text-decoration: none;">${line}</a>`;
        resultHtml += `
          <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; line-height: 1.5;">
            ${mailIcon}
            <div style="flex: 1; word-break: break-word;">${emailLink}</div>
          </div>
        `;
      } else {
        // Agar Email nahi hai, toh ise Address ka hissa maano aur buffer me daal do
        addressBuffer.push(line);
      }
    });

    // Step 4: Loop khatam hone ke baad, agar buffer me kuch bacha hai, toh usko print kar do
    if (addressBuffer.length > 0) {
      resultHtml += `
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; line-height: 1.5;">
          ${mapIcon}
          <div style="flex: 1; word-break: break-word;">${addressBuffer.join('<br/>')}</div>
        </div>
      `;
    }

    return resultHtml;
  };

  const FooterColumn = ({ title, content, colKey }) => {
    const isOpen = openMobileCol === colKey;

    return (
      <div className="space-y-0 border-b border-white/10 lg:border-none lg:space-y-5 last:border-none">
        {/* 📱 Mobile Header (Button) - Sirf mobile pe dikhega */}
        <button
          onClick={() => toggleMobileCol(colKey)}
          className="w-full flex lg:hidden items-center justify-between py-2 text-accent font-display font-bold text-lg uppercase"
        >
          <span>{title}</span>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </button>

        {/* 💻 Desktop Header - Sirf desktop pe dikhega */}
        <h3 className="hidden lg:inline-block text-accent font-display font-bold text-lg border-b border-white/10 pb-2 uppercase">
          {title}
        </h3>

        {/* 📝 Content Area */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[500px] opacity-100 ' : 'max-h-0 lg:max-h-none opacity-0 lg:opacity-100'}
        `}>
          <div
            className="footer-dynamic-content text-gray-300 text-sm"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={createSafeHtml(content)}
          />
        </div>
      </div>
    );
  };

  return (
    <footer className="bg-gradient-to-r from-primary to-primary-dark text-white pt-12 pb-6 font-body relative overflow-hidden">
      {/* Decorative Top line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

      <div className="w-full px-4 md:px-12 relative z-10">

        {/* --- NEWSLETTER: Desktop only at top --- */}
        <div className="block w-full max-w-lg mx-auto mb-8 lg:mb-10 text-center">
          <NewsletterForm mobile={true} />
        </div>

        {/* --- MAIN GRID SYSTEM --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8 mb-4 lg:mb-4 lg:border-b border-white/10 lg:pb-6">

          {/* 1️⃣ COLUMN 1: Static Logo + Address (Always Open) */}
          <div className="flex flex-col gap-3">
            <Link to="/" className="flex items-center shrink-0 group">
              <div className="flex items-center gap-3 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                  <img
                    src={logoImg}
                    alt="Bagchee"
                    className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)' }}
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xl lg:text-2xl font-semibold text-white tracking-wider uppercase font-montserrat">Bagchee</span>
                  <span className="text-[8px] lg:text-[9px] font-medium tracking-[0.2em] text-white/80 uppercase font-montserrat">Books That Stick</span>
                </div>
              </div>
            </Link>

            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              {isLoading ? (
                <div className="h-20 w-full bg-white/5 animate-pulse rounded" />
              ) : getCol("column 1") ? (
                <div
                  className="footer-dynamic-content"
                  // 🟢 YAHAN FIX KIYA HAI: formatContactInfo() ke andar data pass kar diya
                  dangerouslySetInnerHTML={createSafeHtml(formatContactInfo(getCol("column 1").content))}
                />
              ) : (
                <p>Address configuration missing.</p>
              )}
            </div>

           {/* 🟢 2. WHATSAPP SECTION (Email ke theek niche) */}
            {whatsappLink && (
              <div className="mt-0">
                <a
                  href={whatsappLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-gray-300 hover:text-[#25D366] transition-colors duration-300"
                >
                  {whatsappLink.icon_image ? (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
                      <img 
                        src={whatsappLink.icon_image.startsWith('http') ? whatsappLink.icon_image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${whatsappLink.icon_image}`} 
                        alt="WhatsApp" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  )}
                  <span className="text-sm font-bold uppercase tracking-wider text-accent font-montserrat">Chat With Us</span>
                </a>
              </div>
            )}

            {/* 🟢 3. BAAKI SOCIAL ICONS (WhatsApp ke niche) */}
            {otherSocialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {otherSocialLinks.map((social) => (
                  <a
                    key={social._id}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-accent hover:text-text-main transition-all duration-300"
                  >
                    {renderSocialIcon(social)}
                  </a>
                ))}
              </div>
            )}

            {/* --- NEWSLETTER: Mobile only beneath Column 1 --- */}
            {/* <div className="lg:hidden pt-4 pb-6 border-b border-white/10"> 
              <NewsletterForm mobile={true} />
            </div> */}
          </div>

          {/* 2️⃣ COLUMN 2: COMPANY (Accordion on Mobile) */}
          <FooterColumn
            title={getCol("column 2")?.title}
            content={getCol("column 2")?.content}
            colKey="col2"
          />

          {/* 3️⃣ COLUMN 3: SERVICES (Accordion on Mobile) */}
          <FooterColumn
            title={getCol("column 3")?.title}
            content={getCol("column 3")?.content}
            colKey="col3"
          />

          {/* 4️⃣ COLUMN 4: HELP (Accordion on Mobile) */}
          <FooterColumn
            title={getCol("column 4")?.title}
            content={getCol("column 4")?.content}
            colKey="col4"
          />

        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left pt-2">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Bagchee. All rights reserved.</p>
          <div className="flex flex-col items-center lg:items-end gap-3">
            <span className="text-[10px] text-accent font-bold uppercase tracking-widest font-montserrat">We Accept</span>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <PaymentCard src={visaImg} alt="Visa" />
              <PaymentCard src={mastercardImg} alt="Mastercard" />
              <PaymentCard src={discoverImg} alt="Discover" />
              <PaymentCard src={amexImg} alt="Amex" />
              <PaymentCard src={paypalImg} alt="PayPal" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footer-dynamic-content ul { list-style: none; padding: 0; margin: 0; }
        .footer-dynamic-content li { margin-bottom: 4px; }
        .footer-dynamic-content a { color: #d1d5db; transition: color 0.3s ease; display: inline-block; width: 100%; }
        .footer-dynamic-content a:hover { color: #FFC107; }
        
        /* 📱 Mobile Specific content padding inside accordion */
        @media (max-width: 1023px) {
           .footer-dynamic-content li { 
            margin-bottom: 0 !important; /* Extra margin ko force stop kiya */
       padding: 5px 0;
             border-bottom: 1px solid rgba(255,255,255,0.05); 
           }
           .footer-dynamic-content li:last-child { border-bottom: none; }
        }
        .footer-dynamic-content a {
       padding: 2px 0;
     }

        /* Column 1 Specific styling for Address/Email */
        .contact-info-style p { display: flex; align-items: start; gap: 10px; margin-bottom: 12px; }
      `}</style>
    </footer>
  );
};



const SocialIcon = memo(({ icon }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-accent hover:text-text-main hover:border-accent transition-all duration-300">{icon}</a>
));



export default memo(Footer);