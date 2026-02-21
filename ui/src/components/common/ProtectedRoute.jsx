import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRole }) => {
  const [isAuth, setIsAuth] = useState(null); 
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem('token'); 
        
        if (!token) {
          console.warn("No token found in localStorage");
          setIsAuth(false);
          return;
        }

        // 🟢 Debugging: Check karein backend URL sahi hai ya nahi
        const API_URL = process.env.REACT_APP_API_URL;
        
        // MongoDB se verify karne ke liye call
        const res = await axios.get(`${API_URL}/user/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 🟢 Backend success check karein (Aapke controller ke status key ke hisab se)
        if (res.data.success || res.data.status) {
          setIsAuth(true);
          // MongoDB se aaya latest role set karein
          setUserRole(res.data.user?.role || res.data.userDetails?.role); 
        } else {
          setIsAuth(false);
        }
      } catch (error) {
        // 🔴 Agar 404 User Not Found aa raha hai toh yahan error dikhega
        console.error("Verification Error details:", error.response?.data);
        setIsAuth(false);
      }
    };

    verifyUser();
  }, []);

  if (isAuth === null) {
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

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    console.error(`Access Denied: Required ${allowedRole}, but user is ${userRole}`);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;