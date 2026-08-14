import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -200])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })
      
      if (!response.ok) throw new Error('Invalid credentials')
      
      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('needs_password_change', data.needs_password_change ? 'true' : 'false')
      
      // Dispatch custom storage event locally so App.jsx state updates immediately
      window.dispatchEvent(new Event('storage'))
      
      if (data.role === 'admin') navigate('/admin-dashboard')
      else if (data.role === 'faculty') navigate('/teacher-dashboard')
      else navigate('/student-dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-text overflow-hidden flex items-center justify-center">
      {/* Parallax Background Elements */}
      <motion.div style={{ y: y1 }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none" />
      <motion.div style={{ y: y2 }} className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/20 blur-[100px] mix-blend-screen pointer-events-none" />
      <motion.div 
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-purple-600/10 blur-[150px] mix-blend-screen pointer-events-none" 
      />

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="relative z-10 glass-panel p-10 max-w-md w-full border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
          >
            TVT Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-textMuted mt-2 tracking-wide uppercase"
          >
            Authentication Required
          </motion.p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Login ID</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Enter your ID"
              required
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              required
            />
          </motion.div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primaryAccent hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(109,40,217,0.3)]"
          >
            Access Portal
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
