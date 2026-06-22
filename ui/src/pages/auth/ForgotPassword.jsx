'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { encryptData } from '../../utils/encryption.js';

// 🟢 STEP 1: Logo component ko import kiya gaya hai
import Logo from '../../components/common/Logo.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailData) => {
      const url = `${process.env.REACT_APP_API_URL}/user/forgot-password`;
      const encryptedPayload = encryptData(emailData);
      const res = await axios.post(url, { data: encryptedPayload });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        setSent(true);
      } else {
        toast.error(data.msg || "Something went wrong.");
      }
    },
    onError: (error) => {
      console.log(error);
      const errorMsg = error.response?.data?.msg || "Failed to send reset link. Please try again.";
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    forgotPasswordMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 overflow-x-hidden w-full">

      {/* --- PAGE TITLE --- */}
      <h2 className="text-3xl text-text-main mb-8 uppercase tracking-slick font-display animate-fadeInLeft">
        FORGOT PASSWORD
      </h2>

      {/* --- CARD --- */}
      <div className="max-w-[98%] sm:max-w-xl w-full bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl border border-cream-200 animate-fadeInRight">

        {/* 🟢 STEP 2: EXACTLY LOGIN JAISA LOGO SECTION ADD KIYA GAYA HAI */}
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 block cursor-pointer"
          >
            <Logo className="h-12 w-auto text-white" />
          </Link>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-main font-display">Check Your Inbox</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              If an account exists for <strong className="text-text-main">{email}</strong>, a password reset link has been sent. Please check your inbox (and spam folder).
            </p>
            <div className="pt-4 border-t border-cream-100">
              <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline font-montserrat text-sm flex items-center justify-center gap-1">
                &larr; Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Text Instructions */}
            <p className="text-sm md:text-base font-body text-text-muted mb-6 text-center">
              Please enter your Email so we can send you a link to reset your password.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 font-montserrat">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                  className="w-full bg-cream-100/30 border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-text-muted/50"
                />
              </div>

              {/* Centered Submit Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${forgotPasswordMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {forgotPasswordMutation.isPending ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center mt-6 text-sm text-text-muted border-t border-cream-100 pt-6">
                <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline font-montserrat flex items-center justify-center gap-1">
                  &larr; Back to Login
                </Link>
              </div>

            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;