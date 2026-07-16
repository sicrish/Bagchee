import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const GeoContext = createContext({ isIndia: false, indiaMaintenance: false, geoLoaded: false, country: '', orderBlocked: false });

const getIsAdmin = () => {
    try {
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        return auth.userDetails?.role === 'admin';
    } catch { return false; }
};

const readGeoCache = () => {
    try {
        const cached = sessionStorage.getItem('bagchee_geo');
        if (cached) return JSON.parse(cached);
    } catch {}
    return null;
};

export const GeoProvider = ({ children }) => {
    const cached = readGeoCache();
    const [rawIsIndia, setRawIsIndia] = useState(cached ? !!cached.isIndia : false);
    const [indiaMaintenance, setIndiaMaintenance] = useState(cached ? !!cached.maintenance : false);
    const [geoLoaded, setGeoLoaded] = useState(!!cached);
    const [country, setCountry] = useState(cached?.country ? String(cached.country).toUpperCase() : '');
    // Server-driven "browse but can't order" flag (admin blocklist countries, e.g. BD)
    const [rawOrderBlocked, setRawOrderBlocked] = useState(cached ? !!cached.orderBlocked : false);
    const [isAdmin, setIsAdmin] = useState(getIsAdmin);

    // Keep isAdmin current on mount and cross-tab login/logout
    useEffect(() => {
        setIsAdmin(getIsAdmin());
        const handleStorage = () => setIsAdmin(getIsAdmin());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        const c = readGeoCache();
        // Only trust a cache that has the full current shape — a pre-16-July cache
        // lacks orderBlocked and must be refreshed.
        if (c && c.country && c.orderBlocked !== undefined) return;
        axios.get(`${process.env.REACT_APP_API_URL}/geo`)
            .then(res => {
                const { isIndia: india, maintenance, country: ctry, orderBlocked: blocked } = res.data;
                const code = String(ctry || '').toUpperCase();
                setRawIsIndia(!!india);
                setIndiaMaintenance(!!maintenance);
                setCountry(code);
                setRawOrderBlocked(!!blocked);
                sessionStorage.setItem('bagchee_geo', JSON.stringify({ isIndia: !!india, maintenance: !!maintenance, country: code, orderBlocked: !!blocked }));
            })
            .catch(() => {})
            .finally(() => setGeoLoaded(true));
    }, []);

    // Admins bypass all IP-based restrictions (India display rules AND order blocks)
    const isIndia = rawIsIndia && !isAdmin;
    const orderBlocked = rawOrderBlocked && !isAdmin;

    return (
        <GeoContext.Provider value={{ isIndia, indiaMaintenance, geoLoaded, country, orderBlocked }}>
            {children}
        </GeoContext.Provider>
    );
};

export const useGeo = () => useContext(GeoContext);
export default GeoContext;
