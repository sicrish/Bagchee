import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const GeoContext = createContext({ isIndia: false, indiaMaintenance: false, geoLoaded: false });

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
    const [isAdmin, setIsAdmin] = useState(getIsAdmin);

    // Keep isAdmin current on mount and cross-tab login/logout
    useEffect(() => {
        setIsAdmin(getIsAdmin());
        const handleStorage = () => setIsAdmin(getIsAdmin());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        if (readGeoCache()) return; // already initialised from cache synchronously
        axios.get(`${process.env.REACT_APP_API_URL}/geo`)
            .then(res => {
                const { isIndia: india, maintenance } = res.data;
                setRawIsIndia(!!india);
                setIndiaMaintenance(!!maintenance);
                sessionStorage.setItem('bagchee_geo', JSON.stringify({ isIndia: !!india, maintenance: !!maintenance }));
            })
            .catch(() => {})
            .finally(() => setGeoLoaded(true));
    }, []);

    // Admins bypass all India IP restrictions
    const isIndia = rawIsIndia && !isAdmin;

    return (
        <GeoContext.Provider value={{ isIndia, indiaMaintenance, geoLoaded }}>
            {children}
        </GeoContext.Provider>
    );
};

export const useGeo = () => useContext(GeoContext);
export default GeoContext;
