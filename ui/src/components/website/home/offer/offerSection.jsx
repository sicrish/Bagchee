import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../../../utils/axiosConfig.js";

const PremiumOfferBar = () => {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/settings/public`);
      return res.data.status ? res.data.data : null;
    },
    staleTime: 600000,
  });

  if (isLoading || !settingsData || (settingsData.topbar_promotion !== "Yes" && settingsData.topbar_promotion !== true && settingsData.topbarPromotion !== true && settingsData.topbarPromotion !== "Yes")) {
    return null;
  }

  const cleanText = (html) => {
    if (!html) return "";
    let text = html.replace(/<\/p>|<br\s*\/?>|<\/div>|<\/li>/gi, "\n");
    text = text.replace(/<[^>]*>/g, "");
    text = text.replace(/&nbsp;/g, " ");
    const finalString = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "")
      .join("  |  ");
    return finalString.toUpperCase();
  };

  const displayText = cleanText(settingsData?.topbar_promotion_text || settingsData?.topbarPromotionText);

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
