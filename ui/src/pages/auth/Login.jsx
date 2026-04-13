'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query'; // 🟢 React Query Mutation
import { encryptData } from '../../utils/encryption.js'; // 🔒 Encryption Utility Import

const Login = () => {
  const navigate = useNavigate();

  // 1. States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Captcha states
  const [captchaCode, setCaptchaCode] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");


  const generateCaptcha = useCallback(() => {
    const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaCode(result);
    setUserCaptchaInput("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);


  // 🟢 2. React Query Mutation Setup
  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      const url = `${process.env.REACT_APP_API_URL}/user/login`;

      // 🔒 Yahan humne data ko encrypt karke 'payload' key mein daal diya
      const encryptedPayload = encryptData(loginData);
      // console.log("🔒 FRONTEND ENCRYPTED PAYLOAD:", encryptedPayload);

      // Ab hum backend ko readable JSON ki jagah encrypted payload bhej rahe hain
      const res = await axios.post(url, { data: encryptedPayload });
      // console.log("url",url)
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success(data.msg);

        // Save Token & User Data
        localStorage.setItem("token", data.token);
        localStorage.setItem("auth", JSON.stringify(data));

        const userRole = data.userDetails?.role;

        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/account');
        }
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      console.log(error);
      const errorMsg = error.response?.data?.msg || "Login failed. Please try again.";
      toast.error(errorMsg);
    }
  });

  // 3. Handle Submit Function
  const handleSubmit = (e) => {
    e.preventDefault();

    if (userCaptchaInput.toUpperCase() !== captchaCode) {
      toast.error("Invalid Captcha Code!");
      generateCaptcha(); // Galat hone par naya captcha generate karein
      return;
    }

    // Mutation Trigger (Data yahan se normal jayega, mutationFn ke andar encrypt hoga)
    loginMutation.mutate({
      email,
      password,
      rememberMe
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 overflow-x-hidden w-full">

      {/* --- PAGE TITLE --- */}
      <h2 className="text-3xl text-text-main mb-8 uppercase tracking-slick font-display animate-fadeInLeft">
        SIGN IN
      </h2>

      {/* --- CARD --- */}
      <div className="max-w-[98%] sm:max-w-xl w-full bg-white p-5 sm:p-8 md:p-10  rounded-2xl shadow-2xl border border-cream-200 animate-fadeInRight">

        {/* LOGO SECTION */}
        <div className="flex justify-center mb-8">
          {/* 🟢 Added Link to wrap the logo for home redirection */}
          <Link
            to="/"
            className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 block cursor-pointer"
          >
            <Logo className="h-12 w-auto text-white" />
          </Link>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-cream-100/30 border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block  px-4 py-4 outline-none transition-all placeholder-text-muted/50"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-cream-100/30 border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block pr-12 px-4 py-4 outline-none transition-all placeholder-text-muted/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>


          {/* CAPTCHA SECTION */}
          <div className="bg-cream-100 p-3 sm:p-5 rounded-xl border border-gray-200 space-y-3 sm:space-y-4 shadow-inner">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-500" /> Security Verification
              </span>
              <button type="button" onClick={generateCaptcha} className="text-primary hover:rotate-180 transition-transform duration-500">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="bg-white px-4 sm:px-6 py-3 rounded-lg border-2 border-dashed border-accent/40 flex justify-center items-center select-none pointer-events-none min-w-[120px]">
                <span className="text-lg sm:text-xl font-black tracking-slick italic text-primary font-display line-through opacity-80">
                  {captchaCode}
                </span>
              </div>
              <input
                type="text" required placeholder="Code"
                value={userCaptchaInput} onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary outline-none uppercase font-bold text-center tracking-widest text-sm sm:text-base shadow-sm"
/>
            </div>
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

          {/* Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${loginMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loginMutation.isPending ? 'SIGNING IN...' : 'SIGN IN'}
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