import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(localStorage.getItem('bagchee_currency') || 'INR');
    const [exchangeRates, setExchangeRates] = useState({ USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.78 }); // Base: USD (Universal Standard)
    const [loading, setLoading] = useState(true);

    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };

    // 1. IP Based Currency Detection (Sirf first time ke liye)
    useEffect(() => {
        const detectCurrency = async () => {
            if (!localStorage.getItem('bagchee_currency')) {
                try {
                    const res = await axios.get('https://ipapi.co/json/');
                    if (res.data && res.data.currency) {
                        setCurrency(res.data.currency);
                    }
                } catch (err) {
                    console.error("IP Detection Failed:", err);
                }
            }
        };
        detectCurrency();
    }, []);

    // 2. Fetch Latest Rates (Base USD rakhenge for better accuracy)
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const apiKey = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
                if (!apiKey) return;
                const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
                if (response.data?.conversion_rates) {
                    setExchangeRates(response.data.conversion_rates);
                }
            } catch (error) {
                console.error("Rates Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRates();
    }, []);

    useEffect(() => {
        localStorage.setItem('bagchee_currency', currency);
    }, [currency]);

  /**
 * 3. Magic Function (MNC Level Logic - Version 2.0)
 * @param {number} mainPrice - Backend 'price' (USD Base)
 * @param {number} inrPrice - Backend 'inr_price' (Fixed by Admin)
 * @param {number} displayPrice - Current calculated value to show
 */
const formatPrice = useCallback((mainPrice, inrPrice, displayPrice) => {
    // 1. Data Cleaning
    const mPrice = Number(mainPrice) || 0;
    const iPrice = (inrPrice === null || inrPrice === undefined) ? -1 : Number(inrPrice); 
    const dPrice = (displayPrice === null || displayPrice === undefined) ? mPrice : Number(displayPrice);

    let finalAmount = 0;
    const symbol = symbols[currency] || `${currency} `;

    // 2. MNC Intelligence Logic
    if (currency === 'INR') {
        if (iPrice === 0 && dPrice === 0) {
            // Case A: Admin ne fix 0 dala hai (Free Item/Shipping)
            finalAmount = 0;
        } else if (iPrice > 0) {
            // Case B: RELATIVE DISCOUNT LOGIC
            const discountRatio = mPrice > 0 ? dPrice / mPrice : 1; 
finalAmount = iPrice * discountRatio;
        } else if (iPrice === 0 && dPrice > 0) {
             // Case C: Jab dPrice (calculated total) 0 se bada ho, lekin backend 0 ho
             // Toh ise fallback calculation par le jao
             finalAmount = dPrice * (exchangeRates['INR'] || 83.5);
        } else {
            // Fallback: Agar INR field -1 (Empty) hai
            finalAmount = dPrice * (exchangeRates['INR'] || 83.5);
        }
    } else if (currency === 'USD') {
        finalAmount = dPrice;
    } else {
        const rate = exchangeRates[currency] || 1;
        finalAmount = dPrice * rate;
    }

    // 3. Rounding Fix: MNCs use precision for financial accuracy
    finalAmount = Math.round((finalAmount + Number.EPSILON) * 100) / 100;

    // 4. MNC Level Formatting (Indian vs Western Commas)
    return `${symbol}${finalAmount.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}, [currency, exchangeRates]);

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, loading, symbols }}>
            {children}
        </CurrencyContext.Provider>
    );
};