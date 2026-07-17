import React, { useState, useEffect, useCallback } from 'react';
import { Ban, Unlock, Plus, Loader2, ShieldAlert } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

// Blocked Customers (16-July): manage the emails / IPs / countries that saveOrder
// rejects at checkout. Entries are also created by the "Block Customer" button on an
// order. IP values ending in '.' act as prefixes (103.42.53. blocks the whole range).

const API_URL = process.env.REACT_APP_API_URL;

const KIND_STYLES = {
  email:   'bg-blue-50 text-blue-700 border-blue-200',
  ip:      'bg-amber-50 text-amber-700 border-amber-200',
  country: 'bg-red-50 text-red-700 border-red-200',
};

const Blocklist = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kind: 'email', value: '', note: '' });

  const fetchEntries = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/blocklist/list`);
      if (res.data?.status) setEntries(res.data.data || []);
    } catch {
      toast.error('Failed to load blocklist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.value.trim()) { toast.error('Enter a value to block'); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/blocklist/create`, form);
      if (res.data?.status) {
        toast.success('Blocked');
        setForm({ kind: 'email', value: '', note: '' });
        fetchEntries();
      } else {
        toast.error(res.data?.msg || 'Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Unblock ${entry.kind} "${entry.value}"? They will be able to order again.`)) return;
    try {
      const res = await axios.delete(`${API_URL}/blocklist/${entry.id}`);
      if (res.data?.status) {
        toast.success('Unblocked');
        setEntries((prev) => prev.filter((x) => x.id !== entry.id));
      } else {
        toast.error(res.data?.msg || 'Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove entry');
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">
      <div className="bg-primary sticky top-0 z-40 px-6 py-3 shadow-md flex items-center gap-2">
        <Ban size={18} className="text-white" />
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">Blocked Customers</h1>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex gap-3 text-xs text-amber-800">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <p>
            Anyone matching an entry below can browse the site but <b>cannot place orders</b> — checkout returns a generic
            "contact customer support" error. Emails match exactly; an IP ending in a dot (e.g. <span className="font-mono">103.42.53.</span>)
            blocks the whole range; a country is a 2-letter code (e.g. <span className="font-mono">BD</span>) and blocks
            <b> every</b> customer ordering from there.
          </p>
        </div>

        <form onSubmit={handleAdd} className="bg-white rounded border border-cream-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
            <select value={form.kind} onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value }))}
              className="border border-gray-200 rounded px-3 py-2 text-sm bg-white">
              <option value="email">Email</option>
              <option value="ip">IP address</option>
              <option value="country">Country code</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Value</label>
            <input type="text" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              placeholder={form.kind === 'email' ? 'customer@example.com' : form.kind === 'ip' ? '103.42.53.228 or 103.42.53.' : 'BD'}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Note (optional)</label>
            <input type="text" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Why this block exists" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Block
          </button>
        </form>

        <div className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No blocked customers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-100 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Value</th>
                    <th className="text-left px-4 py-2.5">Note</th>
                    <th className="text-left px-4 py-2.5">Added</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-50 hover:bg-cream-50/50">
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${KIND_STYLES[entry.kind] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {entry.kind}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{entry.value}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{entry.note || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button type="button" onClick={() => handleDelete(entry)}
                          className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition-colors text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                          title="Remove this block — they can order again">
                          <Unlock size={13} /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blocklist;
