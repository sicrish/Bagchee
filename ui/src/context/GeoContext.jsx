import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const GeoContext = createContext({ isIndia: false, indiaMaintenance: false, geoLoaded: false });

export const GeoProvider = ({ children }) => {
    const [isIndia, setIsIndia] = useState(false);
    const [indiaMaintenance, setIndiaMaintenance] = useState(false);
    const [geoLoaded, setGeoLoaded] = useState(false);

    useEffect(() => {
        const cached = sessionStorage.getItem('bagchee_geo');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setIsIndia(!!parsed.isIndia);
                setIndiaMaintenance(!!parsed.maintenance);
                setGeoLoaded(true);
                return;
            } catch {}
        }
        axios.get(`${process.env.REACT_APP_API_URL}/geo`)
            .then(res => {
                const { isIndia: india, maintenance } = res.data;
                setIsIndia(!!india);
                setIndiaMaintenance(!!maintenance);
                sessionStorage.setItem('bagchee_geo', JSON.stringify({ isIndia: !!india, maintenance: !!maintenance }));
            })
            .catch(() => {})
            .finally(() => setGeoLoaded(true));
    }, []);

    return (
        <GeoContext.Provider value={{ isIndia, indiaMaintenance, geoLoaded }}>
            {children}
        </GeoContext.Provider>
    );
};

export const useGeo = () => useContext(GeoContext);
export default GeoContext;
