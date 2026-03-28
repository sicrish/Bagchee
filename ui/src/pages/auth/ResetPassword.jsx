'use client';

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-xl border border-gray-100 text-center">
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      <h2 className="text-3xl text-text-main mb-8 uppercase tracking-wide font-display">
        RESET PASSWORD
      </h2>

      <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-xl border border-gray-100">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md">
            <Logo className="h-12 w-auto text-white" />
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          <p className="text-sm text-text-muted text-center leading-relaxed">
            Create a new password for <strong className="text-text-main">{email}</strong>
          </p>

          {/* New Password */}
          <div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
              className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
              className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-4 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Password requirements hint */}
          <div className="text-xs text-text-muted space-y-1 bg-gray-50 p-3 rounded-lg">
            <p className="font-bold text-gray-500 mb-1">Password must have:</p>
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

          <div className="text-center mt-6 text-sm text-text-muted">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline ml-1 font-montserrat">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
