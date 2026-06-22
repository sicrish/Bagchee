'use client';

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/reset-password`, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success(data.msg);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || 'Failed to reset password. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) return toast.error('Please fill in both fields.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return toast.error('Password must contain at least one uppercase letter and one number.');
    }

    resetMutation.mutate({ email, token, newPassword });
  };

  // If no token or email in URL, show invalid link message
  if (!token || !email) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white p-10 rounded-2xl shadow-2xl border border-cream-200 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-main font-display mb-2">Invalid Reset Link</h3>
          <p className="text-sm text-text-muted mb-6">This password reset link is invalid or has expired.</p>
          <Link
            to="/forgot-password"
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg font-montserrat"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 overflow-x-hidden w-full">

      <h2 className="text-3xl text-text-main mb-8 uppercase tracking-slick font-display animate-fadeInLeft">
        RESET PASSWORD
      </h2>

      <div className="max-w-[98%] sm:max-w-xl w-full bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl border border-cream-200 animate-fadeInRight">

        {/* Logo — linked to home */}
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 block cursor-pointer"
          >
            <Logo className="h-12 w-auto text-white" />
          </Link>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          <p className="text-sm text-text-muted text-center leading-relaxed">
            Create a new password for <strong className="text-text-main">{email}</strong>
          </p>

          {/* New Password */}
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
              className="w-full bg-cream-100/30 border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-4 pr-12 outline-none transition-all placeholder-text-muted/50"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
              className="w-full bg-cream-100/30 border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-4 pr-12 outline-none transition-all placeholder-text-muted/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password requirements hint */}
          <div className="text-xs text-text-muted space-y-1 bg-cream-50 p-3 rounded-lg">
            <p className="font-bold text-text-muted mb-1">Password must have:</p>
            <p className={newPassword.length >= 8 ? 'text-green-600' : ''}>- At least 8 characters</p>
            <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>- At least one uppercase letter</p>
            <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>- At least one number</p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={resetMutation.isPending}
              className={`px-12 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${resetMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {resetMutation.isPending ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </div>

          <div className="text-center mt-6 text-sm text-text-muted border-t border-cream-100 pt-6">
            <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline font-montserrat flex items-center justify-center gap-1">
              &larr; Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
