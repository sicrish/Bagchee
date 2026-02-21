'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';

const Register = () => {
    const navigate = useNavigate();

    // 1. State Management (Matching Backend Controller fields)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        repeatPassword: ""
    });

    const [loading, setLoading] = useState(false);

    // 2. Handle Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client Side Validation
        if (formData.password !== formData.repeatPassword) {
            return toast.error("Passwords do not match");
        }

        setLoading(true);

        try {
            // 🟢 API CALL
            // Make sure this URL matches your Backend Route file (e.g., /api/user/register)
            const url = `${process.env.REACT_APP_API_URL}/user/register`;
         

            const response = await axios.post(url, formData);
           
            // 🟢 Handling Backend Response (Your controller sends 'status: true')
            if (response.data.status) {
                toast.success(response.data.msg); // "User registered successfully"
                navigate('/login'); // Redirect to login
            } else {
                toast.error(response.data.msg);
            }

        } catch (error) {
            console.error("🔴 Registration Error Details:", error);
            // Backend controller sends error in 'msg' or 'error' property
            const errorMsg = error.response?.data?.msg || "Registration failed. Try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 ">

            {/* --- PAGE TITLE --- */}
            <h2 className="text-3xl  text-text-main mb-8 uppercase tracking-wide font-display">
                REGISTER
            </h2>

            {/* --- CARD --- */}
            <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-xl border border-gray-100">

                {/* LOGO SECTION */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-xl shadow-md">
                        <Logo className="h-12 w-auto text-white" />
                    </div>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>

                    {/* Row 1: Names */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            <input
                                type="text"
                                name="firstName" // Must match state key
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First name."
                                required
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-3.5 outline-none transition-all placeholder-gray-500"
                            />
                        </div>
                        <div className="w-full">
                            <input
                                type="text"
                                name="lastName" // Must match state key
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last name."
                                required
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-3.5 outline-none transition-all placeholder-gray-500"
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
                            className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-3.5 outline-none transition-all placeholder-gray-500"
                        />
                    </div>

                    {/* Row 3: Passwords */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-3.5 outline-none transition-all placeholder-gray-500"
                            />
                        </div>
                        <div className="w-full">
                            <input
                                type="password"
                                name="repeatPassword"
                                value={formData.repeatPassword}
                                onChange={handleChange}
                                placeholder="Repeat password"
                                required
                                className="w-full bg-gray-100 border border-gray-200 text-text-main text-sm font-medium rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary block px-4 py-3.5 outline-none transition-all placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Button */}
                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-10 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 font-montserrat ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating...' : 'CREATE ACCOUNT'}
                        </button>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center mt-6 text-sm text-text-muted">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline ml-1 font-montserrat">
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