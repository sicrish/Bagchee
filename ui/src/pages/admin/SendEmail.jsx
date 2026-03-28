import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Users, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const SendEmail = () => {
  const navigate = useNavigate();
  const editor = useRef(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('subscribers');
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const editorConfig = useMemo(() => ({
    height: 350,
    placeholder: 'Compose your email content here...',
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'link', '|',
      'align', '|',
      'hr', 'table', '|',
      'undo', 'redo', '|',
      'source'
    ],
    removeButtons: ['file', 'video'],
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
  }), []);

  // Fetch recipient count when audience changes
  useEffect(() => {
    const fetchCount = async () => {
      setCountLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/email-campaign/recipients-count?audience=${audience}`);
        if (res.data.status) {
          setRecipientCount(res.data.count);
        }
      } catch {
        setRecipientCount(0);
      } finally {
        setCountLoading(false);
      }
    };
    fetchCount();
  }, [audience, API_BASE_URL]);

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Please enter a subject line.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Please compose an email body.');

    if (recipientCount === 0) return toast.error('No recipients found for selected audience.');

    const confirmed = window.confirm(
      `Send this email to ${recipientCount} recipient(s) (${audience})?\n\nSubject: ${subject}`
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading(`Sending to ${recipientCount} recipients...`);

    try {
      const res = await axios.post(`${API_BASE_URL}/email-campaign/send`, {
        subject: subject.trim(),
        body,
        audience
      });

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        setSubject('');
        setBody('');
      } else {
        toast.error(res.data.msg || 'Failed to send', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send campaign', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const audienceOptions = [
    { value: 'subscribers', label: 'Newsletter Subscribers', desc: 'People who subscribed to newsletter' },
    { value: 'customers', label: 'Registered Customers', desc: 'All registered users on the platform' },
    { value: 'all', label: 'Everyone', desc: 'Both subscribers and customers (deduplicated)' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 font-body text-text-main">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/newsletter-subs')}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Send Email Campaign
          </h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">Compose and send emails to your audience</p>
        </div>
      </div>

      <div className="max-w-4xl">

        {/* Audience Selector */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3 block">
            Select Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {audienceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${audience === opt.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className={audience === opt.value ? 'text-primary' : 'text-gray-400'} />
                  <span className={`text-sm font-bold font-montserrat ${audience === opt.value ? 'text-primary' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Recipient Count Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-montserrat">Recipients:</span>
            {countLoading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-montserrat">
                {recipientCount}
              </span>
            )}
          </div>
        </div>

        {/* Subject Line */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New Arrivals This Week at Bagchee!"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-montserrat"
          />
        </div>

        {/* Email Body Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Email Body
          </label>
          <div className="border rounded-lg overflow-hidden">
            <JoditEditor
              ref={editor}
              value={body}
              config={editorConfig}
              onBlur={(newContent) => setBody(newContent)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg shadow-md font-montserrat font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={16} /> Send Campaign</>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/newsletter-subs')}
            className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-montserrat font-bold text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmail;
