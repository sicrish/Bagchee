import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Info } from 'lucide-react';
import axios from '../../../utils/axiosConfig';
import toast from 'react-hot-toast';
import AccountLayout from '../../../layouts/AccountLayout';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const GiftCards = () => {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/gift-cards/my-balance`);
      if (res.data.status) setWalletBalance(res.data.balance || 0);
    } catch {}
  };

  useEffect(() => { fetchBalance(); }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter a gift card code");
    setRedeeming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/gift-cards/redeem`, { code: code.trim().toUpperCase() });
      if (res.data.status) {
        toast.success(res.data.msg);
        setCode('');
        setWalletBalance(res.data.newBalance);
      } else {
        toast.error(res.data.msg || "Failed to redeem");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to redeem gift card");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <AccountLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
            <Gift className="text-primary" size={24} />
            Gift Cards
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-montserrat">Redeem your e-gift card code and manage your balance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Redeem form */}
          <div className="bg-cream-100 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-text-main uppercase tracking-wide mb-5 font-montserrat">
              Redeem Gift Card
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter your gift card number in the box below. We'll add the amount to your available funds balance.
            </p>
            <form onSubmit={handleRedeem} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all tracking-widest"
              />
              <button
                type="submit"
                disabled={redeeming}
                className="w-full bg-text-main text-white font-montserrat font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {redeeming ? 'Redeeming...' : 'Submit'}
              </button>
            </form>
          </div>

          {/* Current balance */}
          <div className="bg-cream-100 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-text-main uppercase tracking-wide mb-2 font-montserrat">
              Current Gift Card Balance
            </h2>
            <p className="text-4xl font-display font-bold text-primary mt-4 mb-6">
              {walletBalance === null ? '...' : `$${walletBalance.toFixed(2)}`}
            </p>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide font-montserrat flex items-center gap-2">
                <Info size={14} className="text-primary" />
                What you should know about gift cards
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Your balance will never expire.</li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Your balance will be available to use during checkout.</li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> You can choose to pay without using your gift card balance during checkout.</li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> You don't have to use all your available balance at once.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};

export default GiftCards;
