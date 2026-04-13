'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Check } from 'lucide-react'; // Check ko bhi add kar lein checkbox ke liye agar aage kaam aaye;
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query'; // 🟢 React Query Mutation
import { encryptData } from '../../utils/encryption.js'; // 🔒 Encryption Utility

const Register = () => {
    const navigate = useNavigate();

    // 1. State Management
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        repeatPassword: ""
    });


    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);


    // 2. Handle Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🟢 3. React Query Mutation Setup
    const registerMutation = useMutation({
        mutationFn: async (registerData) => {
            const url = `${process.env.REACT_APP_API_URL}/user/register`;

            // 🔒 Step: Data ko encrypt karke bhej rahe hain (MNC Standard)
            const encryptedPayload = encryptData(registerData);

            // Backend middleware 'payload' key dhundega
            const response = await axios.post(url, { payload: encryptedPayload });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.status) {
                toast.success(data.msg || "User registered successfully");
                navigate('/login'); // Redirect to login
            } else {
                toast.error(data.msg);
            }
        },
        onError: (error) => {
            console.error("🔴 Registration Error Details:", error);
            const errorMsg = error.response?.data?.msg || "Registration failed. Try again.";
            toast.error(errorMsg);
        }
    });

    // 4. Handle Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        // Client Side Validation
        if (formData.password !== formData.repeatPassword) {
            return toast.error("Passwords do not match");
        }

        // 🟢 Trigger Mutation
        registerMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 overflow-x-hidden w-full ">

            {/* --- PAGE TITLE --- */}
            <h2 className="text-2xl md:text-3xl text-text-main mb-6 md:mb-8 uppercase tracking-slick font-display animate-fadeInLeft text-center">
                REGISTER
            </h2>

            {/* --- CARD --- */}
            <div className="max-w-xl w-full bg-white p-6 md:p-10 rounded-2xl shadow-2xl border border-cream-200 animate-fadeInRight mx-auto">

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
                <form className="space-y-5" onSubmit={handleSubmit}>

                    {/* Row 1: Names */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First name."
                                required
                                className="w-full bg-white border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-3 md:py-3.5 outline-none transition-all placeholder-text-muted/50 shadow-sm"
                            />
                        </div>
                        <div className="w-full">
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last name."
                                required
                                className="w-full bg-white border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-3 md:py-3.5 outline-none transition-all placeholder-text-muted/50 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Row 2: Email */}
                    <div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            required
                            className="w-full bg-white border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-3 md:py-3.5 outline-none transition-all placeholder-text-muted/50 shadow-sm"
                        />
                    </div>

                    {/* Row 3: Passwords */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative group w-full">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                className="w-full bg-white border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-3 md:py-3.5 outline-none transition-all placeholder-text-muted/50 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className=" relative group w-full">
                            <input
                                type={showRepeatPassword ? "text" : "password"}
                                name="repeatPassword"
                                value={formData.repeatPassword}
                                onChange={handleChange}
                                placeholder="Repeat password"
                                required
                                className="w-full bg-white border border-cream-200 text-text-main text-sm font-body rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-3 md:py-3.5 outline-none transition-all placeholder-text-muted/50 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                                {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Button - registerMutation.isPending manages loading state */}
                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className={`w-full md:w-auto px-10 py-3.5 md:py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm uppercase tracking-slick shadow-lg shadow-primary/30 transform hover:-translate-y-1 transition-all duration-300 font-montserrat ${registerMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {registerMutation.isPending ? 'Creating Account...' : 'CREATE ACCOUNT'}
                        </button>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center mt-6 text-sm text-text-muted">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-primary hover:text-primary-hover hover:underline ml-1 font-montserrat transition-all">
                                Sign in NOW
                            </Link>
                        </p>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Register;