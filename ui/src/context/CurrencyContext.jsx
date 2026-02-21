import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // 1. Currency state (Default ab 'INR' kar diya hai)
  const [currency, setCurrency] = useState(localStorage.getItem('bagchee_currency') || 'INR');
  
  // 2. Rates state (Base Currency: INR)
  // Yahan values "1 INR = Kitna Foreign Currency" ke hisab se hain
  const [exchangeRates, setExchangeRates] = useState({
    INR: 1,         // Base Price
    USD: 0.012,     // 1 INR approx $0.012
    EUR: 0.011,     // 1 INR approx €0.011
    GBP: 0.0095     // 1 INR approx £0.0095
  });

  // 3. Currency Symbols
  const symbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£'
  };

  // 4. API Call to fetch latest rates based on INR
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const apiKey = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
        // 🟢 CHANGE: Ab hum API se bol rahe hain ki Base Currency 'INR' rakho
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`);
        
        if (!apiKey) {
            console.error("❌ API Key missing in .env file");
            return;
        }
        if (response.data && response.data.conversion_rates) {
          setExchangeRates(response.data.conversion_rates);
          // console.log("Rates Updated (Base INR):", response.data.conversion_rates);
        }
      } catch (error) {
        console.error("Currency API Error:", error);
        // Error aane par upar wale fallback rates use honge
      }
    };

    fetchRates();
  }, []);

  // 5. Currency save in LocalStorage
  useEffect(() => {
    localStorage.setItem('bagchee_currency', currency);
  }, [currency]);

  // 6. Magic Function
  const formatPrice = (price) => {
    if (!price) return "0.00";
    
    // API se rate nikalo, agar nahi mila to 1 maan lo
    const rate = exchangeRates[currency] || 1;
    
    // Convert logic (Price in INR * Rate)
    const convertedAmount = (price * rate).toFixed(2);
    
    // Symbol logic
    const symbol = symbols[currency] || currency + ' ';

    return `${symbol}${convertedAmount}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};