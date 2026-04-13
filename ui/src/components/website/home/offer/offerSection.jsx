import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../../../utils/axiosConfig.js";

const PremiumOfferBar = () => {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/settings/public`);
      return res.data.status && res.data.data ? res.data.data : null;
    },
    staleTime: 600000,
  });

  if (isLoading || !settingsData || !settingsData.topbarPromotion) {
    return null;
  }

  // 🟢 LOGIC: HTML tags hatane ke liye function
  const cleanText = (html) => {
    if (!html) return "";
  
    // 1. Sabse pehle line-breaking tags (p, div, br, li) ko newline (\n) mein badlein
    // Isse humein pata chal jayega ki kahan se nayi line shuru ho rahi hai
    let text = html.replace(/<\/p>|<br\s*\/?>|<\/div>|<\/li>/gi, "\n");
  
    // 2. Baaki bache saare HTML tags (<a>, <span>, <b> etc.) ko poori tarah delete kar dein
    text = text.replace(/<[^>]*>/g, "");
  
    // 3. HTML Entities (jaise &nbsp;) ko normal space mein badlein
    text = text.replace(/&nbsp;/g, " ");
  
    // 4. Text ko lines mein split karein, khali lines hatayein aur join karein
    const finalString = text
      .split("\n")                 // Nayi line par todien
      .map(line => line.trim())    // Extra spaces saaf karein
      .filter(line => line !== "") // Khali array elements hatayein
      .join("  |  ");              // Beech mein " | " laga kar wapas ek line banayein
  
    return finalString.toUpperCase();
  };

  const displayText = cleanText(settingsData?.topbarPromotionText || settingsData?.topbar_promotion_text);

  return (
    <div className="w-full bg-accent text-black py-2 text-center font-montserrat relative shadow-sm border-b border-black/5">
      <div className="container mx-auto px-4">
        <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
          {displayText}
        </p>
      </div>
    </div>
  );
};

export default PremiumOfferBar;