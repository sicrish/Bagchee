import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const SUPPORTED = ['USD', 'EUR', 'GBP'];
    const stored = localStorage.getItem('bagchee_currency');
    // Remove INR from localStorage if it was previously stored
    if (stored && !SUPPORTED.includes(stored)) {
        localStorage.removeItem('bagchee_currency');
    }
    const [currency, setCurrency] = useState(SUPPORTED.includes(stored) ? stored : 'USD');
    const [exchangeRates, setExchangeRates] = useState({ USD: 1, EUR: 0.92, GBP: 0.78 });
    const [loading, setLoading] = useState(true);

    const symbols = { USD: '$', EUR: '€', GBP: '£' };

    // 1. IP Based Currency Detection — INR excluded, fallback to USD
    useEffect(() => {
        const detectCurrency = async () => {
            if (!localStorage.getItem('bagchee_currency')) {
                try {
                    const res = await axios.get('https://ipapi.co/json/');
                    const detected = res.data?.currency;
                    if (detected && SUPPORTED.includes(detected)) {
                        setCurrency(detected);
                    } else {
                        setCurrency('USD');
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
   * formatPrice(mainPrice, _ignored, displayPrice)
   * mainPrice    — USD base price from backend
   * _ignored     — was INR price, no longer used
   * displayPrice — pre-calculated USD value to display (e.g. after discount)
   */
  const formatPrice = useCallback((mainPrice, _ignored, displayPrice) => {
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