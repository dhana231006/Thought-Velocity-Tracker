import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trash2, UserPlus, Users, Key, LogOut, Edit2, Lock, X, BarChart2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast, Toaster } from 'sonner'

const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Literature", "Chemistry", "Biology", "Economics"
]

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-black/90 border border-white/10 p-6 rounded-2xl glass-panel"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-textMuted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-textMuted hover:text-white hover:bg-white/10 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${danger ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' : 'bg-primary/20 border border-primary/30 text-primaryAccent hover:bg-primary/30'}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(user.display_name || '')
  const [department, setDepartment] = useState(user.department || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update display name + department
      const editRes = await fetch(`http://localhost:8000/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          display_name: displayName || undefined,
          department: department || undefined
        })
      })
      if (!editRes.ok) {
        const err = await editRes.json()
        toast.error(err.detail || 'Failed to update user')
        setSaving(false)
        return
      }

      // Optionally reset password
      if (newPassword.trim().length > 0) {
        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters')
          setSaving(false)
          return
        }
        const pwRes = await fetch(`http://localhost:8000/api/auth/users/${user.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ new_password: newPassword })
        })
        if (!pwRes.ok) {
          toast.error('Failed to reset password')
          setSaving(false)
          return
        }
        toast.success('Password reset — user will be prompted on next login')
      }

      toast.success(`User "${displayName}" updated successfully!`)
      onSave()
    } catch (e) {
      toast.error('Network error updating user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-black/90 border border-white/10 p-6 rounded-2xl glass-panel relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-textMuted hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primaryAccent" /> Edit User
          </h3>
          <p className="text-xs text-textMuted mt-0.5">@{user.username} • <span className="capitalize">{user.role}</span></p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm"
              placeholder="Full name"
            />
          </div>
          {user.role !== 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm"
              >
                <option value="">-- No Department --</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Reset Password (optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm"
              placeholder="Leave empty to keep current password"
            />
            {newPassword.length > 0 && (
              <p className="text-[10px] text-amber-400/80 mt-1">⚠ User will be required to change this on next login</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-primary hover:bg-primaryAccent text-white px-6 py-2.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main AdminPortal ──────────────────────────────────────────────────────────
export default function AdminPortal() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [department, setDepartment] = useState('')
  const [users, setUsers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [systemStats, setSystemStats] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // user to delete
  const navigate = useNavigate()

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) setUsers(await response.json())
    } catch (err) { console.error(err) }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/assignments/requests/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) setPendingRequests(await response.json())
    } catch (err) { console.error(err) }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/stats/system', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) setSystemStats(await response.json())
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchUsers()
    fetchPendingRequests()
    fetchSystemStats()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, department: department || null })
      })
      if (response.ok) {
        toast.success(`Successfully created ${role} account!`)
        setUsername(''); setPassword(''); setDepartment('')
        fetchUsers(); fetchSystemStats()
      } else {
        const err = await response.json()
        toast.error(err.detail || 'Error creating user')
      }
    } catch (err) { toast.error('Network error') }
  }

  const handleApproveRequest = async (reqId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignments/requests/${reqId}/approve`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        toast.success('Assignment request approved successfully!')
        fetchPendingRequests()
      } else toast.error('Failed to approve request')
    } catch (err) { toast.error('Network error') }
  }

  const handleRejectRequest = async (reqId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignments/requests/${reqId}/reject`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        toast.success('Request rejected')
        fetchPendingRequests()
      } else toast.error('Failed to reject request')
    } catch (err) { toast.error('Network error') }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const response = await fetch(`http://localhost:8000/api/auth/users/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        toast.success('User account deleted successfully')
        fetchUsers(); fetchSystemStats()
      } else {
        const err = await response.json()
        toast.error(err.detail || 'Failed to delete user')
      }
    } catch (err) { toast.error('Network error deleting user') }
    finally { setConfirmDelete(null) }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('needs_password_change')
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesDept = deptFilter === 'all' ||
      (deptFilter === 'unassigned' && !u.department) ||
      u.department === deptFilter
    return matchesRole && matchesDept
  })

  return (
    <div className="min-h-screen bg-[#050505] text-text p-8 relative overflow-hidden">
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Modals */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={() => { setEditingUser(null); fetchUsers(); fetchSystemStats(); }}
        />
      )}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for "${confirmDelete?.display_name}"? This action cannot be undone and will remove all associated data.`}
        confirmLabel="Delete Account"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        danger={true}
      />

      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <motion.div
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"
      />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wide flex items-center gap-2">
              <Key className="w-8 h-8 text-primaryAccent" />
              Admin Management Console
            </h1>
            <p className="text-xs text-textMuted mt-1">Configure credentials, view users, and manage access layers.</p>
          </div>
          <button onClick={handleLogout} className="glass-button px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* ── System Stats Row ──────────────────────────────────────────────── */}
        {systemStats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Total Users', value: systemStats.total_users, icon: <Users className="w-3.5 h-3.5 text-primaryAccent" /> },
              { label: 'Students', value: systemStats.total_students, icon: <Users className="w-3.5 h-3.5 text-sky-400" /> },
              { label: 'Faculty', value: systemStats.total_faculty, icon: <Users className="w-3.5 h-3.5 text-secondaryAccent" /> },
              { label: 'Responses', value: systemStats.total_responses, icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> },
              { label: 'Assignments', value: systemStats.total_assignments, icon: <Key className="w-3.5 h-3.5 text-amber-400" /> },
              { label: 'Profiles', value: systemStats.total_thinking_profiles, icon: <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-panel p-4 border border-white/5 text-center">
                <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center justify-center gap-1 mb-1">{s.icon} {s.label}</p>
                <p className="text-xl font-bold font-mono text-white">{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create credentials panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 glass-panel p-6 border border-white/5 bg-black/20 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-display font-semibold text-white mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-secondaryAccent" /> Provision Credentials
              </h2>
              <p className="text-xs text-textMuted mb-6">Create credentials directly into SQLite/PostgreSQL storage.</p>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Login ID / Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Access Role</label>
                  <select value={role} onChange={e => { setRole(e.target.value); if (e.target.value === "admin") setDepartment(""); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm">
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {role !== "admin" && (
                  <div>
                    <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primaryAccent text-sm">
                      <option value="">-- Choose Department --</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit"
                  className="w-full bg-primary hover:bg-primaryAccent text-white px-6 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-md mt-4">
                  Create Account
                </button>
              </form>
            </div>
          </motion.div>

          {/* User management list panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-7 glass-panel p-6 border border-white/5 bg-black/20"
          >
            <h2 className="text-lg font-display font-semibold text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-primaryAccent" /> Active System Users
            </h2>
            <p className="text-xs text-textMuted mb-4">Manage login privileges for enrolled students and faculty members.</p>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-textMuted mb-1">Role Filter</label>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primaryAccent">
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-textMuted mb-1">Department Filter</label>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primaryAccent">
                  <option value="all">All Departments</option>
                  <option value="unassigned">Unassigned</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-xs text-textMuted py-10 bg-black/20 rounded-xl border border-white/5">
                  No users found matching filters.
                </div>
              ) : filteredUsers.map(u => (
                <div key={u.id} className="p-3.5 rounded-xl border border-white/5 bg-black/30 flex items-center justify-between hover:border-white/10 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm flex items-center gap-2 flex-wrap">
                      {u.display_name}
                      {u.department && (
                        <span className="px-2 py-0.5 text-[9px] bg-primaryAccent/20 text-primaryAccent font-medium rounded-full border border-primaryAccent/25">
                          {u.department}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-textMuted font-mono mt-0.5">
                      @{u.username} • <span className="capitalize font-semibold text-secondaryAccent">{u.role}</span>
                      {u.needs_password_change && (
                        <span className="ml-1.5 text-amber-400/70">(temp password)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-2 rounded-xl hover:bg-primary/10 text-textMuted hover:text-primaryAccent transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-textMuted hover:text-red-400 transition-colors"
                      title="Revoke Credentials"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cross-Department Requests Queue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 border border-white/5 bg-black/20">
          <h2 className="text-lg font-display font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondaryAccent" />
            Cross-Department Assignment Requests Queue ({pendingRequests.length})
          </h2>
          <p className="text-xs text-textMuted mb-6">Authorize faculty members to assign prompts to students of other departments.</p>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-xs text-textMuted py-8 bg-black/20 rounded-xl border border-white/5">
                No pending authorization requests.
              </div>
            ) : pendingRequests.map(req => (
              <div key={req.id}
                className="p-4 rounded-xl border border-white/5 bg-black/30 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-sm">
                    <span className="font-semibold text-white">Faculty: {req.teacher_display_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-secondary/20 text-secondaryAccent font-mono">{req.teacher_dept}</span>
                    <span className="text-xs text-textMuted">wants to assign</span>
                    <span className="font-semibold text-white">{req.student_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primaryAccent font-mono">{req.student_dept}</span>
                  </div>
                  <p className="text-xs text-textMuted italic bg-black/20 p-2.5 rounded border border-white/5 max-w-xl">
                    "{req.topic}"
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveRequest(req.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-semibold transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleRejectRequest(req.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
