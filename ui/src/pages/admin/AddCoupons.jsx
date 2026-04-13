import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Percent, DollarSign, Layers, GitMerge, Gift, UserCheck, Crown } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

// ── Coupon types ──────────────────────────────────────────────────────────────
const COUPON_TYPES = [
  { value: 'percent_order',        label: '% Off Entire Order',  desc: 'e.g. 10% off everything',          icon: Percent   },
  { value: 'percent_section',      label: '% Off Section',       desc: 'e.g. 20% off New Arrivals only',   icon: Layers    },
  { value: 'flat_amount',          label: 'Flat Amount Off',     desc: 'e.g. $5 or $10 off',               icon: DollarSign},
  { value: 'tiered',               label: 'Tiered by Order Size',desc: 'e.g. $5 up to $100, $10 above $100', icon: GitMerge },
  { value: 'buy3get1',             label: 'Buy 3 Get 1 Free',    desc: 'Least expensive item is free',     icon: Gift      },
  { value: 'new_customer_percent', label: 'New Customer %',      desc: 'First-order % discount',           icon: UserCheck },
  { value: 'member_percent',       label: 'Members Only %',      desc: 'Exclusive % for members',          icon: Crown     },
];

const SECTIONS = [
  { key: 'new_arrivals_only',   label: 'New Arrivals'    },
  { key: 'bestseller_only',     label: 'Bestsellers'     },
  { key: 'books_of_month_only', label: 'Books of Month'  },
  { key: 'recommended_only',    label: 'Recommended'     },
];

const defaultForm = () => ({
  code: '', title: '', coupon_type: 'percent_order',
  valid_from: '', valid_to: '', active: 'active',
  amount: '', flat_deduction: '', minimum_buy: '',
  tier2_min_order: '', tier2_amount: '',
  new_customer_only: false, members_only: false,
  new_arrivals_only: false, bestseller_only: false,
  books_of_month_only: false, recommended_only: false,
});

const AddCoupons = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm());

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);
  const handleInput = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  }, [set]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/coupons/save`, data);
      return res.data;
    },
  });

  const handleSubmit = (e, goBack) => {
    e.preventDefault();
    if (!form.code || !form.title) return toast.error('Code and Title are required');
    if (!form.valid_from || !form.valid_to) return toast.error('Valid From and Valid To are required');
    const toastId = toast.loading('Saving coupon...');
    saveMutation.mutate(
      { ...form, couponType: form.coupon_type, validFrom: form.valid_from, validTo: form.valid_to, active: form.active === 'active' },
      {
        onSuccess: (res) => {
          if (res.status) {
            toast.success('Coupon created!', { id: toastId });
            if (goBack) navigate('/admin/coupons');
            else setForm(defaultForm());
          } else { toast.error(res.msg || 'Failed', { id: toastId }); }
        },
        onError: (err) => toast.error(err.response?.data?.msg || 'Failed', { id: toastId }),
      }
    );
  };

  const type = form.coupon_type;

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      <div className="bg-primary px-6 py-3 shadow-md">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">Add Coupon</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-4">
        <form className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">

          {/* ── COUPON TYPE SELECTOR ── */}
          <div className="p-6 border-b border-cream-100">
            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 font-montserrat">Discount Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {COUPON_TYPES.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value} type="button"
                  onClick={() => set('coupon_type', value)}
                  className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                    type === value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-cream-200 bg-white hover:border-primary/40 hover:bg-cream-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === value ? 'bg-primary text-white' : 'bg-cream-100 text-text-muted'}`}>
                    <Icon size={16} />
                  </div>
                  <p className={`text-xs font-black leading-tight ${type === value ? 'text-primary' : 'text-text-main'}`}>{label}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">

            {/* ── COMMON FIELDS ── */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={lbl}>Code *</label>
              <div className="col-span-9">
                <input name="code" value={form.code} onChange={handleInput} className={inp} placeholder="e.g. SAVE10" style={{ textTransform: 'uppercase' }} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className={lbl}>Title *</label>
              <div className="col-span-9">
                <input name="title" value={form.title} onChange={handleInput} className={inp} placeholder="Coupon description" />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
              <label className={lbl + ' mt-2'}>Validity</label>
              <div className="col-span-9 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">From</label>
                  <input type="date" name="valid_from" value={form.valid_from} onChange={handleInput} className={inp} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">To</label>
                  <input type="date" name="valid_to" value={form.valid_to} onChange={handleInput} className={inp} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className={lbl}>Active</label>
              <div className="col-span-9 flex gap-4">
                {['active','inactive'].map(v => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="active" value={v} checked={form.active === v} onChange={handleInput} className="accent-primary w-4 h-4" />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            {/* ── TYPE-SPECIFIC FIELDS ── */}

            {/* Percentage field (for % types) */}
            {['percent_order','percent_section','new_customer_percent','member_percent'].includes(type) && (
              <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className={lbl}>Discount %</label>
                <div className="col-span-9 flex items-center gap-2">
                  <input type="number" name="amount" value={form.amount} onChange={handleInput} className={inp + ' w-32'} placeholder="e.g. 10" min="0" max="100" />
                  <span className="text-text-muted font-bold text-sm">%</span>
                </div>
              </div>
            )}

            {/* Section selector (percent_section) */}
            {type === 'percent_section' && (
              <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
                <label className={lbl + ' mt-1'}>Sections</label>
                <div className="col-span-9 grid grid-cols-2 gap-3">
                  {SECTIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer p-2.5 rounded-lg border border-cream-200 hover:border-primary/50">
                      <input type="checkbox" name={key} checked={form[key]} onChange={handleInput} className="accent-primary w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="col-span-12 col-start-4 text-[10px] text-gray-400 italic ml-0 pl-3">
                  Discount applies to the entire order when it contains items from the selected sections.
                </div>
              </div>
            )}

            {/* Flat amount (flat_amount) */}
            {type === 'flat_amount' && (
              <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className={lbl}>Flat Amount</label>
                <div className="col-span-9 flex items-center gap-2">
                  <span className="text-text-muted font-bold text-sm">$</span>
                  <input type="number" name="flat_deduction" value={form.flat_deduction} onChange={handleInput} className={inp + ' w-32'} placeholder="e.g. 10" min="0" />
                  <span className="text-[10px] text-gray-400">Fixed amount directly deducted</span>
                </div>
              </div>
            )}

            {/* Tiered */}
            {type === 'tiered' && (
              <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
                <label className={lbl + ' mt-1'}>Tiers</label>
                <div className="col-span-9 space-y-3">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tier 1 — Lower orders</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-text-muted">Discount</span>
                      <span className="font-bold">$</span>
                      <input type="number" name="amount" value={form.amount} onChange={handleInput} className={inp + ' w-24'} placeholder="5" min="0" />
                      <span className="text-sm text-text-muted">for orders up to</span>
                      <span className="font-bold">$</span>
                      <input type="number" name="tier2_min_order" value={form.tier2_min_order} onChange={handleInput} className={inp + ' w-28'} placeholder="100" min="0" />
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100 space-y-3">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Tier 2 — Larger orders</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-text-muted">Discount</span>
                      <span className="font-bold">$</span>
                      <input type="number" name="tier2_amount" value={form.tier2_amount} onChange={handleInput} className={inp + ' w-24'} placeholder="10" min="0" />
                      <span className="text-sm text-text-muted">for orders above</span>
                      <span className="font-bold">$</span>
                      <span className="font-bold text-green-700">{form.tier2_min_order || '...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buy 3 Get 1 Free */}
            {type === 'buy3get1' && (
              <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className={lbl}>Rule</label>
                <div className="col-span-9">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Gift size={20} className="text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                      When the customer buys <strong>3 or more items</strong>, the <strong>least expensive item</strong> is automatically made free.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── COMMON RESTRICTIONS ── */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className={lbl}>Min. Order</label>
              <div className="col-span-9 flex items-center gap-2">
                <span className="font-bold text-sm">$</span>
                <input type="number" name="minimum_buy" value={form.minimum_buy} onChange={handleInput} className={inp + ' w-32'} placeholder="0" min="0" />
                <span className="text-[10px] text-gray-400">Minimum cart value required</span>
              </div>
            </div>

            {/* Restrictions — new customer / members only */}
            {(type !== 'new_customer_percent' && type !== 'member_percent') && (
              <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className={lbl}>Restrictions</label>
                <div className="col-span-9 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="new_customer_only" checked={form.new_customer_only} onChange={handleInput} className="accent-primary w-4 h-4" />
                    New Customers Only
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="members_only" checked={form.members_only} onChange={handleInput} className="accent-primary w-4 h-4" />
                    Members Only
                  </label>
                </div>
              </div>
            )}

            {/* Auto-set restriction hint for new_customer / member types */}
            {type === 'new_customer_percent' && (
              <div className="col-span-12 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-600 font-medium flex items-center gap-2">
                <UserCheck size={14} /> This coupon will automatically be restricted to new customers only.
              </div>
            )}
            {type === 'member_percent' && (
              <div className="col-span-12 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-600 font-medium flex items-center gap-2">
                <Crown size={14} /> This coupon will automatically be restricted to members only.
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="flex justify-center items-center gap-4 pt-6 border-t mt-2 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={saveMutation.isPending}
                className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-70">
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={saveMutation.isPending}
                className="bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-70">
                <RotateCcw size={14} /> Save & Back to List
              </button>
              <button type="button" onClick={() => navigate('/admin/coupons')} disabled={saveMutation.isPending}
                className="bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 transition-all flex items-center gap-2 disabled:opacity-70">
                <X size={14} className="text-red-500" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .theme-inp { border:1px solid #e6decd; border-radius:4px; padding:8px 14px; font-size:13px; outline:none; background:#fffdf5; transition:all .2s; }
        .theme-inp:focus { border-color:#008DDA; box-shadow:0 0 0 3px rgba(0,141,218,.15); background:white; }
      `}</style>
    </div>
  );
};

const lbl = 'col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat';
const inp = 'theme-inp';

export default AddCoupons;
