import axios from 'axios';
import toast from 'react-hot-toast'; // 🟢 Toast Import karein
import { encryptData } from './encryption.js';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// =================================================
// 1. REQUEST INTERCEPTOR
// =================================================
axiosInstance.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token');
        const authData = localStorage.getItem('auth');

        if (!token && authData) {
            const parsed = JSON.parse(authData);
            token = parsed.token;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // --- GLOBAL ENCRYPTION LOGIC ---
        // Humne ab PATCH ko bhi list mein add kar diya hai
        const methodsToEncrypt = ['post', 'put', 'patch'];

        if (methodsToEncrypt.includes(config.method) && config.data) {

            // FormData (Images/Files) ko encrypt nahi karna hai
            if (!(config.data instanceof FormData)) {
                console.log(`🔐 Encrypting ${config.method.toUpperCase()} request...`);

                config.data = {
                    payload: encryptData(config.data)
                };
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// =================================================
// 2. RESPONSE INTERCEPTOR (With Toast) 🟢
// =================================================
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Agar Backend ne 401 (Unauthorized) error diya
        if (error.response && error.response.status === 401) {

            // Check karein ki pehle se redirect process chal to nahi raha
            if (!isRedirecting) {
                isRedirecting = true; // Flag set karein

                console.warn("Session Expired! Redirecting...");

                // 1. Storage Clear
                localStorage.removeItem('token');
                localStorage.removeItem('auth');
                localStorage.removeItem('user');

                // 2. Toast Dikhayein (User ko batayein)
                toast.error("Session Expired! Please login again.", {
                    duration: 3000, // 3 seconds tak dikhega
                    icon: '🔒'
                });

                // 3. Delay ke baad Redirect (Taaki Toast dikh sake)
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500); // 1.5 Second ka delay
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;