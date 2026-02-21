'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Navigation ke liye
import axios from '../../utils/axiosConfig.js'; // API calls ke liye
import toast from 'react-hot-toast'; // Notifications ke liye
import { Check } from 'lucide-react';
import Logo from '../../components/common/Logo.jsx'; 

const Login = () => {
  const navigate = useNavigate();

  // 1. States for Input Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2. Handle Submit Function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend URL (Make sure ye .env me sahi ho)
      const url = `${process.env.REACT_APP_API_URL}/user/login`;
      
      const res = await axios.post(url, {
        email,
        password,
        rememberMe
      });

      if (res.data.status) {
        toast.success(res.data.msg);
        
        // 3. Save Token & User Data in LocalStorage
        localStorage.setItem("token", res.data.token); 
        localStorage.setItem("auth", JSON.stringify(res.data)); 

        // 🟢 FIX 2: Role check karne ke liye res.data.userDetails ka use karein
        // Pehle aap sirf 'user.role' likh rahe the jo undefined tha
        const userRole = res.data.userDetails?.role;

        if (userRole === 'admin') {
            navigate('/admin');
        } else {
            navigate('/account');
        }
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      console.log(error);
      const errorMsg = error.response?.data?.msg || "Login failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 ">
      
      {/* --- PAGE TITLE --- */}
      <h2 className="text-3xl  text-text-main mb-8 uppercase tracking-wide font-display">
        SIGN IN
      </h2>

      {/* --- CARD --- */}
      <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-xl border border-gray-100">
        
        {/* LOGO SECTION (Added Gradient Box for Visibility) */}
        <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md">
               <Logo className="h-12 w-auto text-white" />
            </div>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email (Backend expects email, not username) */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Remember Me & Forget Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-primary checked:bg-primary hover:border-primary focus:ring-1 focus:ring-primary/50"
                />
                <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="ml-2 text-sm text-text-muted group-hover:text-primary transition-colors">Remember me</span>
            </label>
            
            <Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors font-montserrat">
              Forget Password
            </Link>
          </div>

          {/* Button - Using Gradient from Header */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </div>

          {/* Footer Link */}
          <div className="text-center mt-6 text-sm text-text-muted">
            <p>
              Dont have an account?{' '}
              <Link to="/register" className="font-bold text-primary hover:text-primary-dark hover:underline ml-1 font-montserrat">
                Register here
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;