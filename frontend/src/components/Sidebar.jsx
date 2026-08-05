import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, User, LogOut, Brain, Shield, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

const Sidebar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/users/me', {
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

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isStudent = profile?.role === 'student' || localStorage.getItem('role') === 'student';
  const isFaculty = profile?.role === 'faculty' || localStorage.getItem('role') === 'faculty';
  const isAdmin = profile?.role === 'admin' || localStorage.getItem('role') === 'admin';

  const homePath = isAdmin ? '/admin-dashboard' : isFaculty ? '/teacher-dashboard' : '/student-dashboard';

  return (
    <aside className="w-64 glass-panel m-4 flex flex-col h-[calc(100vh-2rem)] rounded-2xl z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/50 flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-primary/20 border border-primary/30 text-primaryAccent">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-wide bg-gradient-to-r from-primaryAccent to-secondaryAccent bg-clip-text text-transparent">
            Thought Velocity
          </h1>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">Cognitive Tracker</p>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <NavLink 
          to={homePath}
          className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              isActive 
                ? 'bg-primary/20 text-primaryAccent border border-primary/30 shadow-sm' 
                : 'text-textMuted hover:bg-surface hover:text-text'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>

        {isStudent && (
          <NavLink 
            to="/student-analytics"
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive 
                  ? 'bg-primary/20 text-primaryAccent border border-primary/30 shadow-sm' 
                  : 'text-textMuted hover:bg-surface hover:text-text'
              }`
            }
          >
            <Activity className="w-4 h-4" />
            <span>My Analytics</span>
          </NavLink>
        )}

        {isFaculty && (
          <NavLink 
            to="/faculty-cohort-analytics"
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive 
                  ? 'bg-secondary/20 text-secondaryAccent border border-secondary/30 shadow-sm' 
                  : 'text-textMuted hover:bg-surface hover:text-text'
              }`
            }
          >
            <BarChart2 className="w-4 h-4" />
            <span>Cohort Analytics</span>
          </NavLink>
        )}

        <NavLink 
          to="/profile"
          className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              isActive 
                ? 'bg-primary/20 text-primaryAccent border border-primary/30 shadow-sm' 
                : 'text-textMuted hover:bg-surface hover:text-text'
            }`
          }
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </NavLink>
      </nav>
      
      {/* User Footer Context */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <div className="flex items-center space-x-3 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primaryAccent to-purple-600 flex items-center justify-center font-bold text-white shadow">
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-sm truncate">
            <p className="font-semibold text-white truncate">{profile?.display_name || 'Loading...'}</p>
            <p className="text-textMuted text-xs capitalize flex items-center gap-1">
              <Shield className="w-3 h-3 text-primaryAccent inline" />
              {profile?.role || 'User'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
