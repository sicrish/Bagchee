import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import GeoContext from './GeoContext.jsx';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const { isIndia, geoLoaded } = useContext(GeoContext);
    const stored = localStorage.getItem('bagchee_currency');
    // Never initialise to INR from localStorage — geo controls that, not user preference
    const [currency, setCurrency] = useState((stored && stored !== 'INR') ? stored : 'USD');
    const [exchangeRates, setExchangeRates] = useState({ USD: 1, EUR: 0.92, GBP: 0.78, INR: 84 });
    const [loading, setLoading] = useState(true);

    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };

    // Force INR for India, block INR for non-India (once geo is known)
    useEffect(() => {
        if (!geoLoaded) return;
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        const isAdmin = auth.userDetails?.role === 'admin';
        if (isAdmin) return; // admins bypass geo currency restriction
        if (isIndia) {
            setCurrency('INR');
            localStorage.setItem('bagchee_currency', 'INR');
        } else if (currency === 'INR') {
            setCurrency('USD');
            localStorage.setItem('bagchee_currency', 'USD');
        }
    }, [isIndia, geoLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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
   * formatPrice(mainPrice, inrPrice, displayPrice)
   * mainPrice    — USD base price from backend
   * inrPrice     — INR price set in admin (used directly when currency is INR)
   * displayPrice — pre-calculated USD value to display (e.g. after discount)
   */
  const formatPrice = useCallback((mainPrice, inrPrice, displayPrice) => {
    // INR: use the product's stored INR price directly if available,
    // otherwise fall back to USD × live exchange rate
    if (currency === 'INR') {
        const inr = Number(inrPrice) || 0;
        const fallback = Math.round(((Number(displayPrice ?? mainPrice) || 0) * (exchangeRates['INR'] || 84) + Number.EPSILON) * 100) / 100;
        const finalAmount = inr > 0 ? inr : fallback;
        return `₹${finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const usdAmount = (displayPrice === null || displayPrice === undefined)
        ? Number(mainPrice) || 0
        : Number(displayPrice) || 0;

    const rate = exchangeRates[currency] || 1;
    const finalAmount = Math.round((usdAmount * rate + Number.EPSILON) * 100) / 100;
    const symbol = symbols[currency] || `${currency} `;

    return `${symbol}${finalAmount.toLocaleString('en-US', {
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