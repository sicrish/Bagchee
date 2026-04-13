import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';

/**
 * Fetches admin-managed meta tags for the current page URL.
 * Returns { title, metaTitle, metaDesc, metaKeywords } or null if not found.
 */
const usePageMeta = () => {
    const { pathname } = useLocation();
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const fetchMeta = async () => {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/meta-tags/page`,
                    { params: { url: pathname } }
                );
                if (!cancelled && res.data.status && res.data.data) {
                    setMeta(res.data.data);
                } else if (!cancelled) {
                    setMeta(null);
                }
            } catch {
                if (!cancelled) setMeta(null);
            }
        };
        fetchMeta();
        return () => { cancelled = true; };
    }, [pathname]);

    return meta;
};

export default usePageMeta;
