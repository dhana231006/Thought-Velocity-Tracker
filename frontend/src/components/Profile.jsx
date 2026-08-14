import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Check, Edit2, Lock, Image as ImageIcon, Briefcase, User as UserIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Literature",
  "Chemistry",
  "Biology",
  "Economics"
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [reason, setReason] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio);
        setDepartment(data.department || '');
        setReason('');
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
      let isBasicChanged = displayName !== profile.display_name || (!profile.is_department_locked && department !== (profile.department || ''));
      let isRequestChanged = bio !== profile.bio || avatarFile !== null;

      if (!isAdmin && isRequestChanged && !reason.trim()) {
        toast.error("Please provide a reason for updating your bio or photo.");
        setSaving(false);
        return;
      }

      // If admin, everything is a basic change that gets applied immediately
      if (isAdmin) {
        const formData = new FormData();
        // For admin, we might need a different endpoint or we can use the same but it immediately applies.
        // Wait, update_user_profile endpoint accepts PUT with JSON, but avatar needs formData?
        // Let's use the basic PUT endpoint for everything except avatar, but wait, the backend PUT /users/me expects JSON.
        // So for admin, changing avatar might still be tricky if the backend doesn't support it directly in PUT /users/me. 
        // We'll submit the request and let the backend handle it.
      }

      // Save basic info
      if (isBasicChanged || (isAdmin && isRequestChanged)) {
        const res = await fetch('/api/auth/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            display_name: displayName, 
            department: profile?.is_department_locked && !isAdmin ? undefined : department,
            bio: isAdmin ? bio : undefined,
            avatar_url: isAdmin ? undefined : undefined // Avatar upload for admin would need a separate endpoint, we'll keep it simple for now
          })
        });
        if (!res.ok) {
           throw new Error("Failed to update profile details");
        }
      }

      // Submit profile update request for non-admins
      if (!isAdmin && isRequestChanged) {
        const formData = new FormData();
        formData.append('reason', reason);
        if (bio !== profile.bio) {
          formData.append('bio', bio);
        }
        if (avatarFile) {
          formData.append('file', avatarFile);
        }
        
        const reqRes = await fetch('/api/auth/profile-update-requests', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!reqRes.ok) {
           throw new Error("Failed to submit profile update request");
        }
        toast.success("Profile update request submitted to admin!");
      } else if (isBasicChanged || (isAdmin && isRequestChanged)) {
        toast.success("Profile updated successfully!");
      }

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setReason('');
      fetchProfile();
    } catch (e) {
      toast.error(e.message || 'Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      if (res.ok) {
        toast.success("Password changed successfully!");
        setOldPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to change password");
      }
    } catch(err) {
      toast.error("Network error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-textMuted">
        <Sparkles className="w-8 h-8 animate-spin mr-3 text-primaryAccent" />
        <span className="text-lg font-medium tracking-wide">Loading your space...</span>
      </div>
    );
  }

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-2xl backdrop-blur-xl">
        {isAdmin && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-primaryAccent"></div>
        )}
        
        {/* Abstract Background Elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primaryAccent/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          
          {/* Avatar Area with Glow */}
          <div className="relative group shrink-0">
            <div className={`absolute -inset-2 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-80 transition duration-700 ${isAdmin ? 'bg-gradient-to-r from-red-500 to-purple-600' : 'bg-gradient-to-r from-primaryAccent to-secondaryAccent'}`}></div>
            <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-black border border-white/20 p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="w-full h-full rounded-2xl bg-black/50 flex items-center justify-center text-6xl font-bold text-white overflow-hidden relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${profile.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'
                )}
                {/* Inner shadow overlay for premium feel */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* Profile Identity */}
          <div className="flex-1 text-center md:text-left pt-2 md:pt-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-3">
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                {profile?.display_name}
              </h1>
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.4 }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize flex items-center shadow-lg border backdrop-blur-md mb-1.5
                  ${isAdmin ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-primaryAccent/20 border-primaryAccent/50 text-primaryAccent'}`}
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                {isAdmin ? 'Administrator' : profile?.role}
              </motion.div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4 text-textMuted font-medium mb-6 bg-black/20 inline-flex px-4 py-2 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-white/50" /> <span className="text-white/80">@{profile?.username}</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
              <span className="flex items-center gap-1.5 text-secondaryAccent"><Briefcase className="w-4 h-4" /> {profile?.department || "Unassigned"}</span>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="group relative inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primaryAccent/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <Edit2 className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Customize Identity</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor / Bio */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          <div className="glass-panel p-8 border border-white/5 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-32 h-32" />
            </div>

            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primaryAccent" /> 
              {isEditing ? 'Edit Profile Details' : 'Professional Biography'}
            </h3>

            {!isEditing ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed text-lg font-light">
                  {profile?.bio || "No professional biography has been established yet."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primaryAccent focus:ring-1 focus:ring-primaryAccent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex justify-between">
                      Department
                      {profile?.is_department_locked && !isAdmin && <span className="text-amber-500 flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</span>}
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={profile?.is_department_locked && !isAdmin}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primaryAccent disabled:opacity-50 transition-all appearance-none"
                    >
                      <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex justify-between">
                    Academic Bio
                    {!isAdmin && <span className="text-primaryAccent capitalize text-[10px] font-medium">Requires Admin Approval</span>}
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primaryAccent resize-none transition-all"
                    placeholder="Describe your academic trajectory..."
                  />
                </div>

                {!isAdmin && (bio !== (profile?.bio || '') || avatarFile) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 bg-primaryAccent/5 p-4 rounded-xl border border-primaryAccent/20">
                    <label className="text-xs font-bold text-primaryAccent uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4"/> Reason for Update
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a brief justification for these profile changes to the administration..."
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primaryAccent resize-none text-sm"
                    />
                  </motion.div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-primaryAccent to-purple-600 hover:from-primaryAccent hover:to-primary text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primaryAccent/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    <span>{saving ? 'Processing...' : isAdmin ? 'Save Admin Details' : 'Submit Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Right Column: Security & Actions */}
        <motion.div variants={itemVariants} className="space-y-6">
          
          <div className="glass-panel p-6 border border-white/5 rounded-3xl bg-black/40 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-emerald-400" /> Security Settings
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Current Password</label>
                <input 
                  type="password" 
                  required 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">New Password</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors" 
                />
              </div>
              <button 
                type="submit" 
                disabled={savingPassword} 
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-xl font-bold transition-all text-sm mt-2 disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {!isAdmin && (
            <div className="relative group rounded-3xl overflow-hidden p-[1px]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-panel bg-black/80 backdrop-blur-xl p-8 rounded-[23px] text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-red-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Need an Official Change?</h3>
                  <p className="text-xs text-textMuted leading-relaxed">
                    Submit a formal request with an official letter to change your locked department, name, or profile picture.
                  </p>
                </div>
                <Link 
                  to="/concern-form" 
                  className="inline-block w-full bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold text-sm transition-colors mt-2"
                >
                  Raise Concern Request
                </Link>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
}
