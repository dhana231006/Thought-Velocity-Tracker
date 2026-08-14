import React, { useState, useEffect } from 'react';
import { Sparkles, Bell, Menu } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/users/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, []);

  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between z-20 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden glass-button p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-primaryAccent/40 transition-colors text-textMuted hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg md:text-xl font-display font-semibold text-white">
            Welcome back, {profile?.display_name || 'Student'}
          </h2>
          <p className="text-[10px] md:text-xs text-textMuted mt-0.5 hidden sm:block">Track your cognitive evolution and longitudinal velocity over time.</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primaryAccent text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NLP Pipeline Active</span>
        </div>
        <button className="glass-button p-2.5 rounded-xl hover:border-primaryAccent/40 transition-colors text-textMuted hover:text-white">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
