import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminConcerns() {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [remarks, setRemarks] = useState('');

  const fetchConcerns = async () => {
    try {
      const res = await fetch('/api/concerns/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConcerns(data);
      }
    } catch (e) {
      toast.error('Failed to fetch concerns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
  }, []);

  const handleAction = async (status) => {
    if (!remarks.trim() && status === 'rejected') {
      toast.error('Please provide remarks for rejection.');
      return;
    }
    
    const toastId = toast.loading(`Marking concern as ${status}...`);
    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('remarks', remarks);

      const res = await fetch(`/api/concerns/${selectedConcern.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        toast.success(`Concern ${status} successfully.`, { id: toastId });
        setSelectedConcern(null);
        setRemarks('');
        fetchConcerns();
      } else {
        toast.error('Failed to update concern status', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error', { id: toastId });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-textMuted">Loading concerns...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Concern Management
          </h1>
          <p className="text-sm text-textMuted mt-1">Review and manage user profile change requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {concerns.length === 0 ? (
            <div className="glass-panel p-6 text-center text-textMuted text-sm">
              No concerns found.
            </div>
          ) : concerns.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedConcern(c)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedConcern?.id === c.id ? 'bg-primary/10 border-primary/30' : 'glass-panel hover:border-white/20 border-white/5'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full bg-white/10 uppercase">{c.concern_type}</span>
                {c.status === 'pending' && <Clock className="w-4 h-4 text-amber-400" />}
                {c.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {c.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
              <h3 className="font-semibold text-sm text-white truncate">{c.topic}</h3>
              <p className="text-xs text-textMuted mt-1">By: {c.username}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedConcern ? (
              <motion.div 
                key={selectedConcern.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-6 md:p-8"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedConcern.topic}</h2>
                    <p className="text-xs text-textMuted mt-1">Submitted by <span className="text-primaryAccent">{selectedConcern.username}</span> on {new Date(selectedConcern.timestamp).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${selectedConcern.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 
                      selectedConcern.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {selectedConcern.status}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">Description</h4>
                    <p className="text-sm text-white leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                      {selectedConcern.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">Attached Letter</h4>
                    <a href={selectedConcern.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-semibold transition-colors">
                      <FileText className="w-4 h-4" /> View Official Letter
                    </a>
                  </div>

                  {selectedConcern.status !== 'pending' && (
                    <div className={`p-4 rounded-xl border ${selectedConcern.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${selectedConcern.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>Admin Remarks</h4>
                      <p className="text-sm text-white">{selectedConcern.admin_remarks || 'No remarks provided.'}</p>
                    </div>
                  )}

                  {selectedConcern.status === 'pending' && (
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <h4 className="text-sm font-semibold text-white">Review Decision</h4>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add remarks for the user (required for rejection)..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primaryAccent focus:outline-none resize-none"
                        rows="3"
                      />
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleAction('approved')}
                          className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Change
                        </button>
                        <button 
                          onClick={() => handleAction('rejected')}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel p-12 text-center text-textMuted flex flex-col items-center justify-center h-full min-h-[400px]">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a concern from the list to review details.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
