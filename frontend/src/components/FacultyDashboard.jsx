import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Award, BookOpen, Clock, CheckCircle, AlertTriangle, Send, UserCheck, Plus, X } from 'lucide-react'
import RadarChart from './RadarChart'
import TrajectoryChart from './TrajectoryChart'
import { toast, Toaster } from 'sonner'

export default function FacultyDashboard() {
  const [students, setStudents] = useState([])
  const [otherStudents, setOtherStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [teacherRequests, setTeacherRequests] = useState([])
  const [facultyProfile, setFacultyProfile] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedAnalysisStudent, setSelectedAnalysisStudent] = useState(null)
  const [selectedAnalysisStudentName, setSelectedAnalysisStudentName] = useState('')
  const [trajectoryData, setTrajectoryData] = useState(null)
  
  // Request modal states
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestStudentId, setRequestStudentId] = useState('')
  const [requestTopic, setRequestTopic] = useState('')
  const navigate = useNavigate()

  const fetchFacultyProfile = async () => {
    try {
      const res = await fetch('/api/auth/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFacultyProfile(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/assignments/teacher', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAssignments(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/assignments/students-by-dept', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchOtherStudents = async () => {
    try {
      const res = await fetch('/api/assignments/other-dept-students', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOtherStudents(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/assignments/requests/teacher', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTeacherRequests(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTrajectory = async (studentId, studentName) => {
    setSelectedAnalysisStudent(studentId)
    setSelectedAnalysisStudentName(studentName)
    try {
      const res = await fetch(`/api/trajectories/${studentId}`)
      if (res.ok) {
        const data = await res.json()
        setTrajectoryData(data)
        toast.success(`Loaded cognitive trajectory for ${studentName}`)
      } else {
        toast.error('Failed to load student trajectory.')
      }
    } catch (e) {
      toast.error('Network error loading trajectory.')
    }
  }

  useEffect(() => {
    fetchFacultyProfile()
    fetchStudents()
    fetchOtherStudents()
    fetchAssignments()
    fetchRequests()
  }, [])

  const handleAssign = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/assignments/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic, student_id: parseInt(selectedStudent) })
      })
      if (res.ok) {
        toast.success('Topic assigned successfully!')
        setTopic('')
        setSelectedStudent('')
        fetchAssignments()
      } else {
        toast.error('Failed to assign topic.')
      }
    } catch (e) {
      toast.error('Network error.')
    }
  }

  const handleRaiseRequest = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/assignments/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic: requestTopic, student_id: parseInt(requestStudentId) })
      })
      if (res.ok) {
        toast.success('Authorization request raised to Admin!')
        setRequestTopic('')
        setRequestStudentId('')
        fetchRequests()
        setShowRequestModal(false)
      } else {
        toast.error('Failed to raise request.')
      }
    } catch (e) {
      toast.error('Network error.')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.dispatchEvent(new Event('storage'))
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const totalAssignments = assignments.length
  const completedAssignments = assignments.filter(a => a.status === 'completed').length
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
  const uniqueStudentsAssigned = new Set(assignments.map(a => a.student_id)).size

  return (
    <div className="min-h-screen bg-[#050505] text-text p-8 relative overflow-hidden">
      <Toaster position="bottom-right" theme="dark" richColors />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <motion.div 
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10 pointer-events-none"
      />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-primaryAccent" />
              Faculty Portal
            </h1>
            {facultyProfile && (
              <p className="text-xs text-textMuted mt-1">
                Department: <span className="text-secondaryAccent font-semibold">{facultyProfile.department || 'Not Set'}</span> • Enrolled in TVT longitudinal monitoring
              </p>
            )}
          </div>
          <button onClick={handleLogout} className="glass-button px-4 py-2 rounded-lg text-sm">Logout</button>
        </div>

        {/* Cognitive Analytics Metrics Card Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
            <span className="text-xs text-textMuted uppercase font-semibold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-primaryAccent" /> Students
            </span>
            <span className="text-2xl font-bold text-white mt-2">{uniqueStudentsAssigned}</span>
            <span className="text-[10px] text-textMuted mt-1">Active cognitive profiles</span>
          </div>
          <div className="glass-panel p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
            <span className="text-xs text-textMuted uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-secondaryAccent" /> Total Topics
            </span>
            <span className="text-2xl font-bold text-white mt-2">{totalAssignments}</span>
            <span className="text-[10px] text-textMuted mt-1">Assigned prompts</span>
          </div>
          <div className="glass-panel p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
            <span className="text-xs text-textMuted uppercase font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Completed
            </span>
            <span className="text-2xl font-bold text-green-400 mt-2">{completedAssignments}</span>
            <span className="text-[10px] text-textMuted mt-1">Responses analyzed</span>
          </div>
          <div className="glass-panel p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
            <span className="text-xs text-textMuted uppercase font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-primaryAccent" /> Completion
            </span>
            <span className="text-2xl font-bold text-white mt-2">{completionRate}%</span>
            <span className="text-[10px] text-textMuted mt-1">Submission percentage</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 bg-white/5 border border-white/10 lg:col-span-1 h-fit space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Assign New Topic</h2>
              <p className="text-xs text-textMuted">Send cognitive exploration prompts to students in your department.</p>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Select Student</label>
                <select 
                  value={selectedStudent} 
                  onChange={e => setSelectedStudent(e.target.value)} 
                  required 
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondaryAccent"
                >
                  <option value="">-- Choose a Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Topic Prompt</label>
                <textarea 
                  value={topic} 
                  onChange={e => setTopic(e.target.value)} 
                  required 
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondaryAccent"
                  placeholder="e.g. Explain the impact of AI on modern society."
                />
              </div>
              <button type="submit" className="w-full bg-secondary hover:bg-secondaryAccent text-white px-6 py-2 rounded-lg font-medium transition-colors text-xs">
                Dispatch Assignment
              </button>
            </form>

            <div className="border-t border-white/5 pt-4">
              <p className="text-xs text-textMuted mb-2">Need to assign a student from another department?</p>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="w-full flex items-center justify-center gap-1 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium py-2 rounded-lg text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Request Cross-Dept Student
              </button>
            </div>
          </motion.div>

          {/* Status Monitor */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 bg-white/5 border border-white/10 lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Assignment Monitor</h2>
              <p className="text-xs text-textMuted">Track active prompts, completions, and access student thinking profiles.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-textMuted uppercase tracking-wider">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Topic</th>
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan="5" className="py-4 text-center text-textMuted">No assignments created yet.</td></tr>
                  ) : assignments.map(a => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 font-mono">#{a.id}</td>
                      <td className="py-3 pr-4 max-w-[200px] truncate" title={a.topic}>{a.topic}</td>
                      <td className="py-3 pr-4">{a.student_name} (ID: {a.student_id})</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${a.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {a.status === 'completed' && (
                          <button onClick={() => fetchTrajectory(a.student_id, a.student_name)} className="bg-primary/20 text-primaryAccent px-2.5 py-1 rounded hover:bg-primary/30 font-semibold transition-colors">
                            Analyze Velocity
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Other Department Authorization Requests list */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Cross-Department Request Logs</h3>
                <p className="text-[11px] text-textMuted">Review status of your authorization queries submitted to Admin.</p>
              </div>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {teacherRequests.length === 0 ? (
                  <p className="text-xs text-textMuted py-2 italic">No requests logged yet.</p>
                ) : teacherRequests.map(req => (
                  <div key={req.id} className="p-3 bg-black/20 border border-white/5 rounded-lg flex items-center justify-between text-xs gap-4">
                    <div className="truncate">
                      <span className="font-semibold text-white">Student: {req.student_name}</span>
                      <p className="text-[11px] text-textMuted truncate" title={req.topic}>"{req.topic}"</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                       req.status === 'approved' ? 'bg-green-500/25 text-green-400' : 
                       req.status === 'rejected' ? 'bg-red-500/25 text-red-400' : 
                       'bg-white/10 text-white/60'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Analytics View */}
            {trajectoryData && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Live NLP Analysis: {selectedAnalysisStudentName}</h3>
                  {trajectoryData.analysis?.decelerating && (
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> Deceleration Warning
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <h4 className="text-sm font-semibold text-textMuted mb-4 text-center">Cognitive Dimensions</h4>
                    <RadarChart snapshots={trajectoryData.snapshots} />
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <h4 className="text-sm font-semibold text-textMuted mb-4 text-center">Velocity Trajectory</h4>
                    <TrajectoryChart snapshots={trajectoryData.snapshots} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Cross Department Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-black/80 border border-white/10 p-6 rounded-2xl glass-panel relative"
          >
            <button 
              onClick={() => { setShowRequestModal(false); }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-textMuted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Request Cross-Dept Assignment</h3>
              <p className="text-xs text-textMuted mt-1">Submit authorization request to admin to assign a topic to students of other departments.</p>
            </div>
            
            <form onSubmit={handleRaiseRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Select Student</label>
                <select
                  value={requestStudentId}
                  onChange={e => setRequestStudentId(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondaryAccent"
                >
                  <option value="">-- Select Student --</option>
                  {otherStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (ID: {s.id} - Dept: {s.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1.5">Topic Prompt</label>
                <textarea
                  value={requestTopic}
                  onChange={e => setRequestTopic(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondaryAccent"
                  placeholder="e.g. Describe the role of mathematics in cryptographic algorithms."
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primaryAccent text-white py-2 rounded-lg font-medium transition-colors text-xs flex items-center justify-center gap-1">
                <Send className="w-3.5 h-3.5" /> Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
