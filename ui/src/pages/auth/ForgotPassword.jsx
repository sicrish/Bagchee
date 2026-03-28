'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/forgot-password`, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success('Reset link sent! Check your email.');
        setSent(true);
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || 'Something went wrong. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      <h2 className="text-3xl text-text-main mb-8 uppercase tracking-wide font-display">
        FORGOT PASSWORD
      </h2>

      <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-xl border border-gray-100">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md">
            <Logo className="h-12 w-auto text-white" />
          </div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-main font-display">Check Your Email</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              We've sent a password reset link to <strong className="text-text-main">{email}</strong>.
              <br />Please check your inbox and spam folder.
            </p>
            <p className="text-xs text-text-muted mt-4">The link will expire in 15 minutes.</p>

            <button
              onClick={() => { setSent(false); forgotMutation.reset(); }}
              className="mt-4 text-sm font-bold text-primary hover:text-primary-dark transition-colors font-montserrat"
            >
              Didn't receive it? Try again
            </button>

            <div className="pt-4">
              <Link to="/login" className="text-sm font-bold text-primary hover:text-primary-dark hover:underline font-montserrat">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>

            <p className="text-sm text-text-muted text-center leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>

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

            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${forgotMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {forgotMutation.isPending ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
            </div>

            <div className="text-center mt-6 text-sm text-text-muted">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline ml-1 font-montserrat">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
