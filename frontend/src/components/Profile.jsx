import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Check, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Literature",
  "Chemistry",
  "Biology",
  "Economics"
]

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio);
        setDepartment(data.department || '');
      } else {
        toast.error('Failed to load user profile');
      }
    } catch (e) {
      toast.error('Network error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ display_name: displayName, bio, department })
      });
      if (res.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        fetchProfile();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update profile');
      }
    } catch (e) {
      toast.error('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-textMuted">
        <Sparkles className="w-6 h-6 animate-spin mr-2 text-primaryAccent" />
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar Icon / Initial */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-primaryAccent via-purple-600 to-secondaryAccent p-[2px] shadow-lg">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center text-4xl font-bold text-white">
                {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-surface border border-border rounded-full text-xs font-semibold text-primaryAccent capitalize flex items-center shadow">
              <Shield className="w-3 h-3 mr-1" />
              {profile?.role}
            </span>
          </div>

          {/* Profile details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-white tracking-wide">
                  {profile?.display_name}
                </h1>
                <p className="text-textMuted text-sm font-medium">@{profile?.username}</p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-button px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 self-center md:self-auto hover:border-primaryAccent/50 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-primaryAccent" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-textMuted transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-gray-300 text-sm leading-relaxed flex-1">
                  <span className="block text-[10px] text-textMuted uppercase font-bold mb-1">Academic Bio / Trajectory Goals</span>
                  {profile?.bio || "No bio added yet."}
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-gray-300 text-sm leading-relaxed md:w-1/3 shrink-0">
                  <span className="block text-[10px] text-textMuted uppercase font-bold mb-1">Enrolled Department</span>
                  <span className="text-secondaryAccent font-semibold">{profile?.department || "Unassigned"}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={profile?.is_department_locked}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent disabled:opacity-60"
                  >
                    <option value="">-- Choose Department --</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {profile?.is_department_locked && (
                    <span className="text-[10px] text-textMuted mt-1 block">Department is locked. Contact administrator to change.</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Academic Bio / Trajectory Goals</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primaryAccent text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2 text-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>

      {/* Account Statistics / Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border border-white/5">
          <p className="text-xs text-textMuted uppercase font-semibold">User ID</p>
          <p className="text-xl font-mono font-bold text-white mt-1">#{profile?.id}</p>
        </div>
        <div className="glass-panel p-6 border border-white/5">
          <p className="text-xs text-textMuted uppercase font-semibold">Role Tier</p>
          <p className="text-xl font-display font-bold text-secondaryAccent mt-1 capitalize">{profile?.role}</p>
        </div>
        <div className="glass-panel p-6 border border-white/5">
          <p className="text-xs text-textMuted uppercase font-semibold">Student Record ID</p>
          <p className="text-xl font-mono font-bold text-primaryAccent mt-1">{profile?.student_id ? `#${profile.student_id}` : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
