import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Loader2, RotateCw, Send, ChevronDown, ChevronUp, X,
  CheckCircle, Clock, AlertCircle, Ban, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  sent:      { label: 'Sent',       icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-100' },
  pending:   { label: 'Scheduled',  icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-100' },
  sending:   { label: 'In Progress',icon: Loader2,      color: 'text-blue-600',   bg: 'bg-blue-100' },
  failed:    { label: 'Failed',     icon: AlertCircle,  color: 'text-red-600',    bg: 'bg-red-100' },
  cancelled: { label: 'Cancelled',  icon: Ban,          color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const AUDIENCE_LABELS = {
  subscribers: 'All subscribers',
  members:     'Active members',
  purchasers:  'With purchases',
  categories:  'Category subscribers',
  specific:    'Specific emails',
};

const ResendModal = ({ campaign, onClose, onResent, apiBaseUrl }) => {
  const [resendType, setResendType] = useState('same');
  const [newSubject, setNewSubject] = useState(campaign.subject);
  const [specificEmails, setSpecificEmails] = useState('');
  const [loading, setLoading] = useState(false);

  // Category tree for resend
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [expandedMainCats, setExpandedMainCats] = useState({});
  const [catLoading, setCatLoading] = useState(false);

  const subsByMainCat = useMemo(() => {
    const map = {};
    subCategories.forEach(s => { if (!map[s.categoryId]) map[s.categoryId] = []; map[s.categoryId].push(s); });
    return map;
  }, [subCategories]);

  useEffect(() => {
    if (resendType !== 'categories') return;
    setCatLoading(true);
    Promise.all([
      axios.get(`${apiBaseUrl}/main-categories/list`),
      axios.get(`${apiBaseUrl}/subcategory/fetch`)
    ]).then(([mRes, sRes]) => {
      if (mRes.data.status) setMainCategories(mRes.data.data || []);
      if (sRes.data.status) setSubCategories(sRes.data.data || []);
    }).catch(() => {}).finally(() => setCatLoading(false));
  }, [resendType, apiBaseUrl]);

  const toggleCat = (name) => setSelectedCats(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  const handleResend = async () => {
    if (!newSubject.trim()) return toast.error('Subject is required');

    let audience = campaign.audience;
    let selCats = campaign.categories || [];
    let specEmails = [];

    if (resendType === 'specific') {
      const emails = specificEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
      if (emails.length === 0) return toast.error('Enter at least one email address');
      audience = ['specific'];
      specEmails = emails;
    } else if (resendType === 'categories') {
      if (selectedCats.length === 0) return toast.error('Select at least one category');
      audience = ['categories'];
      selCats = selectedCats;
    }

    setLoading(true);
    const toastId = toast.loading('Resending campaign...');
    try {
      const res = await axios.post(`${apiBaseUrl}/email-campaign/resend/${campaign.id}`, {
        subject: newSubject.trim(),
        audience,
        selectedCategories: selCats,
        specificEmails: specEmails,
      });
      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        onResent();
        onClose();
      } else {
        toast.error(res.data.msg || 'Resend failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Resend failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 font-montserrat flex items-center gap-2">
            <RotateCw size={15} className="text-primary" /> Resend Campaign
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Original subject info */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 font-montserrat uppercase tracking-wide mb-1">Original Subject</p>
            <p className="text-sm font-bold text-gray-700 font-montserrat">{campaign.subject}</p>
          </div>

          {/* Change subject */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat mb-1.5 block">Subject Line (edit if needed)</label>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary font-montserrat"
            />
          </div>

          {/* Audience choice */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat mb-2 block">Send To</label>
            <div className="space-y-2">
              {[
                { key: 'same', label: `Same audience as original (${(campaign.audience || []).map(a => AUDIENCE_LABELS[a] || a).join(', ')})` },
                { key: 'specific', label: 'Specific email addresses' },
                { key: 'categories', label: 'Specific category subscribers' },
              ].map(opt => (
                <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${resendType === opt.key ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" checked={resendType === opt.key} onChange={() => setResendType(opt.key)} className="accent-primary" />
                  <span className={`text-sm font-montserrat ${resendType === opt.key ? 'font-bold text-primary' : 'text-gray-700'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specific emails input */}
          {resendType === 'specific' && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat mb-1.5 block">Email Addresses (one per line or comma-separated)</label>
              <textarea
                value={specificEmails}
                onChange={(e) => setSpecificEmails(e.target.value)}
                placeholder="email1@example.com&#10;email2@example.com"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary font-mono resize-none"
              />
            </div>
          )}

          {/* Category tree for resend */}
          {resendType === 'categories' && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat mb-2 block">Select Categories</label>
              {catLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2"><Loader2 size={13} className="animate-spin" /> Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {mainCategories.map(cat => {
                      const catName = cat.title || cat.categorytitle || '';
                      const subs = subsByMainCat[cat.id] || [];
                      const isExpanded = expandedMainCats[cat.id];
                      return (
                        <div key={cat.id} className="border border-gray-100 rounded overflow-hidden">
                          <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                              <input type="checkbox" checked={selectedCats.includes(catName)} onChange={() => toggleCat(catName)} className="accent-primary h-3 w-3 shrink-0" />
                              <span className="text-[11px] font-bold text-gray-700 truncate font-montserrat">{catName}</span>
                            </label>
                            {subs.length > 0 && (
                              <button onClick={() => setExpandedMainCats(p => ({ ...p, [cat.id]: !p[cat.id] }))} className="text-gray-400 hover:text-primary ml-1 shrink-0">
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </button>
                            )}
                          </div>
                          {isExpanded && subs.map(sub => {
                            const subName = sub.name || '';
                            return (
                              <label key={sub.id} className="flex items-center gap-1.5 px-3 py-1 cursor-pointer border-t border-gray-100">
                                <input type="checkbox" checked={selectedCats.includes(subName)} onChange={() => toggleCat(subName)} className="accent-primary h-3 w-3 shrink-0" />
                                <span className="text-[10px] text-gray-600 truncate font-montserrat">{subName}</span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  {selectedCats.length > 0 && (
                    <p className="text-[10px] text-primary font-bold font-montserrat mt-1.5">{selectedCats.length} selected: {selectedCats.join(', ')}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleResend}
            disabled={loading}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg font-montserrat font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Resend Campaign</>}
          </button>
          <button onClick={onClose} className="flex-1 bg-white border border-gray-300 text-gray-600 py-2.5 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-50 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const NewsletterReport = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendTarget, setResendTarget] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/email-campaign/history`);
      if (res.data.status) setCampaigns(res.data.data);
    } catch {
      toast.error('Failed to load campaign history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [API_BASE_URL]);

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled campaign?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/email-campaign/scheduled/${id}`);
      if (res.data.status) {
        toast.success('Campaign cancelled.');
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled' } : c));
      } else toast.error(res.data.msg);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to cancel'); }
  };

  const stats = useMemo(() => {
    const sent = campaigns.filter(c => c.status === 'sent');
    const totalSent = sent.reduce((s, c) => s + (c.sent || 0), 0);
    const totalFailed = sent.reduce((s, c) => s + (c.failed || 0), 0);
    const pending = campaigns.filter(c => c.status === 'pending').length;
    return { totalCampaigns: campaigns.length, totalSent, totalFailed, pending };
  }, [campaigns]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/newsletter-subs')} className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Newsletter Campaign Reports
          </h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">All sent and scheduled email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/send-email')} className="bg-primary text-white px-4 py-2 rounded-lg font-montserrat font-bold text-xs uppercase flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95">
            <Send size={13} /> New Campaign
          </button>
          <button onClick={fetchCampaigns} disabled={loading} className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors">
            <RotateCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Campaigns', value: stats.totalCampaigns, color: 'text-primary' },
          { label: 'Emails Delivered', value: stats.totalSent.toLocaleString(), color: 'text-green-600' },
          { label: 'Failed Deliveries', value: stats.totalFailed.toLocaleString(), color: 'text-red-500' },
          { label: 'Scheduled', value: stats.pending, color: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-montserrat mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 font-montserrat">All Campaigns</h2>
          <span className="text-xs text-gray-400 font-montserrat">{campaigns.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="font-montserrat text-sm">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-montserrat">
            <Mail size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No campaigns yet.</p>
            <button onClick={() => navigate('/admin/send-email')} className="mt-4 text-primary font-bold text-sm hover:underline">Send your first campaign →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Subject</th>
                  <th className="p-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Audience</th>
                  <th className="p-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Date</th>
                  <th className="p-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Status</th>
                  <th className="p-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Result</th>
                  <th className="p-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide font-montserrat">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign) => {
                  const sc = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.sent;
                  const StatusIcon = sc.icon;
                  const totalRecip = (campaign.sent || 0) + (campaign.failed || 0);
                  const audienceLabels = (campaign.audience || []).map(a => AUDIENCE_LABELS[a] || a).join(', ');
                  const catLabels = campaign.categories && campaign.categories.length > 0 ? ` → ${campaign.categories.slice(0, 2).join(', ')}${campaign.categories.length > 2 ? ` +${campaign.categories.length - 2}` : ''}` : '';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 max-w-[200px]">
                        <p className="font-bold text-gray-700 font-montserrat truncate text-[13px]">{campaign.subject}</p>
                        <p className="text-[10px] text-gray-400 font-montserrat mt-0.5">#{campaign.id}</p>
                      </td>
                      <td className="p-3 max-w-[180px]">
                        <p className="text-[11px] text-gray-600 font-montserrat truncate">{audienceLabels}</p>
                        {catLabels && <p className="text-[10px] text-primary font-montserrat truncate">{catLabels}</p>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <p className="text-xs text-gray-600 font-montserrat">{new Date(campaign.sendAt).toLocaleDateString('en-GB')}</p>
                        <p className="text-[10px] text-gray-400 font-montserrat">{new Date(campaign.sendAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full font-montserrat ${sc.bg} ${sc.color}`}>
                          <StatusIcon size={11} className={campaign.status === 'sending' ? 'animate-spin' : ''} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="p-3">
                        {campaign.status === 'sent' && totalRecip > 0 && (
                          <div>
                            <p className="text-xs font-bold text-green-600 font-montserrat">{(campaign.sent || 0).toLocaleString()} sent</p>
                            {(campaign.failed || 0) > 0 && <p className="text-[10px] text-red-500 font-montserrat">{campaign.failed.toLocaleString()} failed</p>}
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${totalRecip > 0 ? Math.round((campaign.sent / totalRecip) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {campaign.status === 'pending' && (
                          <p className="text-[11px] text-yellow-600 font-montserrat">
                            Sends {new Date(campaign.sendAt).toLocaleString()}
                          </p>
                        )}
                        {campaign.status === 'sending' && (
                          <p className="text-[11px] text-blue-600 font-montserrat flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> In progress...
                          </p>
                        )}
                        {campaign.status === 'failed' && <p className="text-[11px] text-red-500 font-montserrat">Send failed</p>}
                        {campaign.status === 'cancelled' && <p className="text-[11px] text-gray-400 font-montserrat">Cancelled</p>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {(campaign.status === 'sent' || campaign.status === 'failed') && (
                            <button
                              onClick={() => setResendTarget(campaign)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-all font-montserrat"
                              title="Resend"
                            >
                              <RotateCw size={11} /> Resend
                            </button>
                          )}
                          {campaign.status === 'pending' && (
                            <button
                              onClick={() => handleCancelScheduled(campaign.id)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all font-montserrat"
                            >
                              <Ban size={11} /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resend Modal */}
      {resendTarget && (
        <ResendModal
          campaign={resendTarget}
          onClose={() => setResendTarget(null)}
          onResent={fetchCampaigns}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
};

export default NewsletterReport;
