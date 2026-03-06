import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query Import

const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');

  // 🚀 OPTIMIZATION: React Query for Auth Caching & Speed
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['authUser', token],
    queryFn: async () => {
      if (!token) {
        console.warn("No token found in localStorage");
        throw new Error("No token"); // Seedha error throw karega
      }

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/user/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend success check
      if (res.data.success || res.data.status) {
        return res.data.user || res.data.userDetails; // Return actual user object
      }
      throw new Error("Verification failed");
    },
    retry: false, // 🟢 OPTIMIZATION: Agar 401/404 aaye toh bar-bar retry karke time waste na kare
    staleTime: 1000 * 60 * 5, // 🟢 OPTIMIZATION: 5 minute tak session cache rahega. Page change karne par loader nahi aayega!
  });

  // 1. Loading State (Aapka exact same layout aur design)
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-cream-50 font-body">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-2" size={40} />
          <p className="text-text-muted font-montserrat font-bold text-xs uppercase tracking-widest">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // 2. Not Authenticated State (Token nahi hai ya expire ho gaya)
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Based Access Control State
  if (allowedRole && user.role !== allowedRole) {
    console.error(`Access Denied: Required ${allowedRole}, but user is ${user.role}`);
    return <Navigate to="/" replace />;
  }

  // 4. Fully Authenticated & Authorized State
  return <Outlet />;
};

export default ProtectedRoute;