import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axiosConfig.js';
import ProductCardGrid from '../../ProductCardGrid.jsx';
import { Loader2 } from 'lucide-react';

const BooksOfMonthPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/books-of-the-month/active`);
                if (res.data.status) setData(res.data.data);
            } catch (err) {
                console.error("Error fetching full list:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
        window.scrollTo(0, 0); // Page load hote hi top par le jaye
    }, []);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-cream-50">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
    );

    if (!data) return null;

    return (
        <div className="bg-cream-50 min-h-screen pb-20 font-body">
            {/* Dedicated Header for Full Page */}
            <div className="bg-primary text-white py-12 md:py-12 mb-12">
                <div className="max-w-[1400px] mx-auto px-4 text-center">
                    <span className="bg-accent text-text-main text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest font-montserrat">
                        Curated Collection
                    </span>
                    <h1 className="text-4xl  font-display font-black uppercase mt-4">
                        {data.monthName} <span className="text-accent">Selection</span>
                    </h1>
                    <p className="mt-6 text-lg opacity-90 font-montserrat italic max-w-3xl mx-auto">
                        "{data.headline}"
                    </p>
                </div>
            </div>

            {/* Grid - No Slicing Here (Full Data) */}
            <div className="max-w-[1400px] mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                    {data.products.map((book) => (
                        <div key={book._id}>
                            <ProductCardGrid data={book} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BooksOfMonthPage;