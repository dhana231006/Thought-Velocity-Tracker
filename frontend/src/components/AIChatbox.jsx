import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am your TVT AI Assistant. Ask me anything about your progress, cognitive dimensions, trajectory decelerations, or thought velocities." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No reply received.' }]);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to fetch AI reply');
      }
    } catch (e) {
      toast.error('Network error contacting chatbot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-96 h-[500px] glass-panel border border-white/10 flex flex-col shadow-2xl mb-4 overflow-hidden rounded-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-primary/20 via-purple-900/20 to-secondary/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primaryAccent" />
                <div>
                  <h3 className="text-sm font-semibold text-white">TVT AI Assistant</h3>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Groq Llama-3 Active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-textMuted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    m.role === 'user' ? 'bg-secondaryAccent' : 'bg-primaryAccent'
                  }`}>
                    {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`p-3 rounded-2xl max-w-[78%] text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary/20 border border-primary/20 text-white' 
                      : 'bg-white/5 border border-white/5 text-gray-200'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primaryAccent flex items-center justify-center text-white">
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-textMuted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primaryAccent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primaryAccent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primaryAccent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about your progress, trends..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primaryAccent"
              />
              <button
                type="submit"
                disabled={loading}
                className="p-2 rounded-xl bg-primary hover:bg-primaryAccent text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-primaryAccent to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-primaryAccent/20 transition-all border border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
