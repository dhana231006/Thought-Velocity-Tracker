import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Send, Upload, CheckCircle2, History, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConcernForm() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  
  const [concernType, setConcernType] = useState('bio');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [concernsHistory, setConcernsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/concerns/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConcernsHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload an approval letter.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting concern...');

    try {
      const formData = new FormData();
      formData.append('concern_type', concernType);
      formData.append('topic', topic);
      formData.append('description', description);
      formData.append('file', file);

      const res = await fetch('/api/concerns/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        toast.success('Concern submitted successfully. An administrator will review it.', { id: toastId });
        setSubmitted(true);
        fetchHistory(); // Refresh history
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to submit concern', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Approved': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto p-4 md:p-8 mt-6">
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'new' 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-black/40 text-textMuted border border-white/5 hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Raise a Concern
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history' 
            ? 'bg-primaryAccent/20 text-primaryAccent border border-primaryAccent/30' 
            : 'bg-black/40 text-textMuted border border-white/5 hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" /> My Request History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'new' ? (
          <motion.div 
            key="new"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-6 md:p-8"
          >
            {submitted ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <h2 className="text-2xl font-display font-bold text-white">Concern Submitted</h2>
                <p className="text-textMuted text-sm">Your concern request has been forwarded to administrators.</p>
                <button onClick={() => {
                  setSubmitted(false);
                  setTopic('');
                  setDescription('');
                  setFile(null);
                }} className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors text-white">
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">Submit New Request</h2>
                    <p className="text-xs text-textMuted mt-1">Request an official change to your profile.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Concern Type</label>
                    <select
                      value={concernType}
                      onChange={(e) => setConcernType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                    >
                      <option value="bio">Change Biography</option>
                      <option value="photo">Update Profile Photo</option>
                      <option value="department">Change Department</option>
                      <option value="name">Change Display Name</option>
                      <option value="general">Other / General</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Topic / Subject</label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                      placeholder="E.g., Department Transfer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Detailed Description</label>
                  <textarea
                    required
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-red-500 focus:outline-none transition-colors resize-none"
                    placeholder="Explain why you need this change..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Official Approval Letter</label>
                  <div className="relative">
                    <input
                      type="file"
                      required
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full bg-black/40 border border-white/10 border-dashed rounded-xl p-6 hover:bg-white/5 cursor-pointer transition-colors text-textMuted">
                      <Upload className="w-5 h-5 text-red-400" />
                      <span className="text-sm">{file ? file.name : "Click to upload your official letter (PDF/PNG/JPG)"}</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <span className="animate-spin text-lg">⏳</span> : <Send className="w-4 h-4" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {loadingHistory ? (
              <div className="text-center py-12 text-textMuted">Loading history...</div>
            ) : concernsHistory.length === 0 ? (
              <div className="glass-panel text-center py-12">
                <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-textMuted font-medium">You haven't submitted any concern requests yet.</p>
              </div>
            ) : (
              concernsHistory.map(concern => (
                <div key={concern.id} className="glass-panel p-6 border border-white/5 rounded-2xl relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    concern.status === 'Approved' ? 'bg-emerald-500' : 
                    concern.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(concern.status)}
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          concern.status === 'Approved' ? 'text-emerald-400' : 
                          concern.status === 'Rejected' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {concern.status}
                        </span>
                        <span className="text-xs text-textMuted">&bull; {new Date(concern.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{concern.topic}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-textMuted uppercase tracking-wider">
                        {concern.concern_type}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                    {concern.description}
                  </p>

                  {concern.admin_remarks && (
                    <div className="mt-4 p-4 bg-primaryAccent/10 border border-primaryAccent/20 rounded-xl flex gap-3">
                      <MessageSquare className="w-5 h-5 text-primaryAccent shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-primaryAccent uppercase tracking-wider mb-1">Administrator Remarks</h4>
                        <p className="text-sm text-gray-200">{concern.admin_remarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
