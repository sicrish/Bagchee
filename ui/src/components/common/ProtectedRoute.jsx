import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');

  // 🚀 MNC OPTIMIZATION: Logic to handle Guest vs User
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['authUser', token],
    queryFn: async () => {
      // 1. Agar token nahi hai, toh API call mat karo, seedha null return karo (No Error)
      if (!token) return null;

      const API_URL = process.env.REACT_APP_API_URL;
      try {
        const res = await axios.get(`${API_URL}/user/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success || res.data.status) {
          return res.data.user || res.data.userDetails;
        }
        return null;
      } catch (err) {
        // Agar token invalid hai toh localStorage saaf karo aur null bhejo
        localStorage.removeItem('token');
        localStorage.removeItem('auth');
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minute caching
    enabled: !!token || !!allowedRole, // Sirf tab chalega jab token ho YA role protection chahiye ho
  });

  // 1. Loading State: Sirf tab dikhao jab token verify ho raha ho
  if (isLoading && token) {
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

  // 2. 🟢 Guest Access Logic:
  // Agar 'allowedRole' pass nahi kiya gaya (jaise Checkout route par), 
  // toh guest user ko bina roke aage jaane do.
  if (!allowedRole) {
    return <Outlet />;
  }

  // 3. 🔴 Protected Access Logic (Admin/User Only):
  // Agar role maanga hai (allowedRole) aur user nahi hai, tabhi login bhejenge.
  if (!user || isError) {
    return <Navigate to="/login" replace />;
  }

  // 4. Role Authorization:
  // Agar user hai par uska role match nahi karta.
  if (allowedRole && user.role !== allowedRole) {
    console.error(`Access Denied: Required ${allowedRole}, but user is ${user.role}`);
    return <Navigate to="/" replace />;
  }

  // 5. Authorized: Proceed to page
  return <Outlet />;
};

export default ProtectedRoute;