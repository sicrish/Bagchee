import React, { useEffect, useRef, useState } from 'react';
import axios from '../../utils/axiosConfig';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Server-side searchable customer picker for the admin order pages.
 *
 * The customer base is ~30k users, so a plain <select> only ever showed the first
 * page (~10). This queries /user/fetch?search= (matches name / first / last / email)
 * with debouncing, so the admin can find ANY customer.
 *
 * Props:
 *   value        - selected customer id ('' when none)
 *   initialLabel - name/email to show for an already-selected customer (edit page)
 *   guestLabel   - shown for guest-checkout orders that have no user record (e.g. "Guest Customer — …")
 *   onChange      - (customerId, customerObj|null) => void
 *   className     - styling for the text input (pass the page's inputClass)
 */
const CustomerSelect = ({ value, initialLabel = '', guestLabel = '', onChange, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(initialLabel);
  const [assigning, setAssigning] = useState(false); // guest order: admin opted to attach a real customer
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  // Edit page loads the order async — adopt the label once it arrives.
  useEffect(() => { if (initialLabel) setLabel(initialLabel); }, [initialLabel]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const nameOf = (c) =>
    c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '(no name)';

  const runSearch = (q) => {
    clearTimeout(debounceRef.current);
    const term = (q || '').trim();
    if (term.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/user/fetch?search=${encodeURIComponent(term)}&limit=50`);
        setResults(res.data?.status ? (res.data.data || []) : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (c) => {
    setLabel(nameOf(c));
    setQuery('');
    setResults([]);
    setOpen(false);
    onChange?.(c.id || c._id, c);
  };

  const handleClear = () => {
    setLabel('');
    setQuery('');
    setResults([]);
    onChange?.('', null);
  };

  // Selected state: show the chosen customer with a clear (X) button.
  if (value && label) {
    return (
      <div className={`${className} flex items-center justify-between gap-2`}>
        <span className="truncate text-text-main">{label}</span>
        <button type="button" onClick={handleClear} className="text-gray-400 hover:text-red-500 shrink-0" title="Change customer">
          <X size={15} />
        </button>
      </div>
    );
  }

  // Guest-checkout order (no user record): show a "Guest Customer" badge so the order is still
  // saveable, with an option to attach a real customer if the admin wants to.
  if (guestLabel && !value && !assigning) {
    return (
      <div className={`${className} flex items-center justify-between gap-2`}>
        <span className="truncate italic text-gray-500">{guestLabel}</span>
        <button type="button" onClick={() => setAssigning(true)} className="text-[11px] text-blue-600 hover:underline shrink-0" title="Attach a registered customer">
          Assign customer
        </button>
      </div>
    );
  }

  // Search state.
  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder="Search customer by name or email…"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); runSearch(e.target.value); }}
          onFocus={() => setOpen(true)}
          className={`${className} pr-7`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </span>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg">
          {results.length > 0 ? results.map((c) => (
            <button
              type="button"
              key={c.id || c._id}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <div className="text-[13px] font-medium text-text-main truncate">{nameOf(c)}</div>
              {c.email && <div className="text-[11px] text-gray-500 truncate">{c.email}</div>}
            </button>
          )) : (
            <div className="px-3 py-2 text-[12px] text-gray-400">{loading ? 'Searching…' : 'No customers found'}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelect;
