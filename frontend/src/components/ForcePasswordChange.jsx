import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, ShieldAlert, Check } from 'lucide-react'
import { toast, Toaster } from 'sonner'

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Literature",
  "Chemistry",
  "Biology",
  "Economics"
]

export default function ForcePasswordChange({ onComplete }) {
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('Please enter your full/display name')
      return
    }
    if (!department) {
      toast.error('Please select your department')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/auth/change-password-first-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          display_name: displayName,
          new_password: newPassword,
          department: department
        })
      })

      if (response.ok) {
        toast.success('Credentials updated successfully!')
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        const err = await response.json()
        toast.error(err.detail || 'Failed to update credentials')
      }
    } catch (err) {
      toast.error('Network error updating credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('needs_password_change')
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-text overflow-hidden flex items-center justify-center p-4">
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/10 blur-[100px] mix-blend-screen pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 glass-panel p-8 max-w-md w-full border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-2xl"
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
            <ShieldAlert className="w-6 h-6 text-primaryAccent animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">
            Update Your Profile
          </h1>
          <p className="text-xs text-textMuted mt-2 leading-relaxed">
            Your admin has created temporary credentials for safety. Before proceeding to your dashboard, please change your password and set your display name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Full Name / Display Name
            </label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm transition-all"
              placeholder="e.g. John Doe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm transition-all"
              required
              disabled={loading}
            >
              <option value="">-- Select Department --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> New Password
            </label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm transition-all"
              placeholder="Min 6 characters"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Confirm Password
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primaryAccent hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(109,40,217,0.2)] text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Updating Credentials...' : 'Save and Continue'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <button 
            onClick={handleLogout}
            className="text-xs text-textMuted hover:text-white transition-colors"
          >
            Cancel and Logout
          </button>
        </div>
      </motion.div>
    </div>
  )
}
