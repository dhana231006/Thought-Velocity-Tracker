import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Send, ArrowLeft, BookOpen, Shield, AlertTriangle, Maximize, Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'

// ─── Anti-Cheat Violations Config ─────────────────────────────────────────────
const MAX_VIOLATIONS = 3

export default function Dashboard() {
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [responseContent, setResponseContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)

  // ── Fullscreen / Anti-Cheat State ──────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [violations, setViolations] = useState(0)
  const [showViolationBanner, setShowViolationBanner] = useState(false)
  const [violationMsg, setViolationMsg] = useState('')
  const [assessmentLocked, setAssessmentLocked] = useState(false)
  const assessmentRef = useRef(null)
  const violationsRef = useRef(0)

  const fetchAssignments = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/assignments/student', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAssignments(data)
      }
    } catch (e) {
      toast.error('Failed to load assignments')
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  // ── Fullscreen helpers ──────────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = assessmentRef.current || document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen()
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    setIsFullscreen(false)
  }, [])

  const triggerViolation = useCallback((reason) => {
    violationsRef.current += 1
    setViolations(v => v + 1)
    setViolationMsg(reason)
    setShowViolationBanner(true)
    setTimeout(() => setShowViolationBanner(false), 3500)

    if (violationsRef.current >= MAX_VIOLATIONS) {
      setAssessmentLocked(true)
      exitFullscreen()
      toast.error('Assessment locked: too many integrity violations detected.')
    }
  }, [exitFullscreen])

  // ── Anti-cheat: fullscreen exit detection ──────────────────────────────────
  useEffect(() => {
    if (!selectedAssignment) return

    const onFsChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFull)
      if (!isFull && selectedAssignment && !assessmentLocked) {
        triggerViolation('⚠️ You exited fullscreen mode. Please stay in fullscreen during the assessment.')
        // Re-request fullscreen
        setTimeout(() => {
          if (!document.fullscreenElement) {
            enterFullscreen()
          }
        }, 1000)
      }
    }

    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [selectedAssignment, assessmentLocked, triggerViolation, enterFullscreen])

  // ── Anti-cheat: tab visibility / window blur ────────────────────────────────
  useEffect(() => {
    if (!selectedAssignment || assessmentLocked) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation('⚠️ Tab switch detected. Looking at other tabs is not allowed during assessment.')
      }
    }

    const onBlur = () => {
      if (selectedAssignment && !assessmentLocked) {
        triggerViolation('⚠️ Window focus lost. Do not navigate away during the assessment.')
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
    }
  }, [selectedAssignment, assessmentLocked, triggerViolation])

  // ── Anti-cheat: right-click + copy-paste prevention ────────────────────────
  useEffect(() => {
    if (!isFullscreen) return

    const blockContextMenu = (e) => e.preventDefault()
    const blockCopyPaste = (e) => {
      e.preventDefault()
      toast.warning('Copy/Paste is disabled during assessment.', { duration: 2000 })
    }
    const blockKeyShortcuts = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+A, F12, Alt+Tab etc.
      if (
        (e.ctrlKey && ['c','v','a','x','u','s'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault()
        if (e.ctrlKey && ['c','v','x'].includes(e.key.toLowerCase())) {
          toast.warning('Keyboard shortcuts are disabled during assessment.', { duration: 2000 })
        }
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('copy', blockCopyPaste)
    document.addEventListener('paste', blockCopyPaste)
    document.addEventListener('keydown', blockKeyShortcuts)
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('copy', blockCopyPaste)
      document.removeEventListener('paste', blockCopyPaste)
      document.removeEventListener('keydown', blockKeyShortcuts)
    }
  }, [isFullscreen])

  // ── Start assessment in fullscreen ─────────────────────────────────────────
  const startAssessment = (assignment) => {
    setSelectedAssignment(assignment)
    setResponseContent('')
    setViolations(0)
    violationsRef.current = 0
    setAssessmentLocked(false)
    setShowViolationBanner(false)
    // Enter fullscreen after a short delay to allow DOM to update
    setTimeout(() => {
      enterFullscreen()
    }, 200)
  }

  // ── Exit assessment ─────────────────────────────────────────────────────────
  const cancelAssessment = () => {
    exitFullscreen()
    setSelectedAssignment(null)
    setResponseContent('')
    setViolations(0)
    violationsRef.current = 0
    setAssessmentLocked(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAssignment || assessmentLocked) return
    setIsSubmitting(true)
    const toastId = toast.loading('Processing response through NLP Pipeline...')

    try {
      const res = await fetch('http://localhost:8000/api/responses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignment_id: selectedAssignment.id, content: responseContent })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Thought Velocity computed & response saved!', { id: toastId })
        exitFullscreen()
        setSelectedAssignment(null)
        setResponseContent('')
        fetchAssignments()
        if (data.dimensions) {
          setAnalysisResult(data.dimensions)
          setShowResultModal(true)
        }
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Failed to submit response.', { id: toastId })
      }
    } catch (e) {
      toast.error('Network error during submission.', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending')
  const completedAssignments = assignments.filter(a => a.status === 'completed')

  // ── Violation badge color ───────────────────────────────────────────────────
  const violationColor = violations === 0
    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    : violations === 1
      ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
      : 'text-red-400 border-red-500/20 bg-red-500/10'

  return (
    <div ref={assessmentRef} className="max-w-6xl mx-auto space-y-6">
      {/* ── FULLSCREEN ASSESSMENT MODE ────────────────────────────────────── */}
      {selectedAssignment && (
        <div className={`fixed inset-0 z-[999] flex flex-col ${isFullscreen ? 'bg-[#050505]' : 'bg-[#050505]'}`}>

          {/* Top security bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/60 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/20">
                <Shield className="w-4 h-4 text-primaryAccent" />
                <span className="text-xs font-bold text-primaryAccent tracking-wide">TVT Secure Assessment Mode</span>
              </div>
              {/* Integrity status */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${violationColor}`}>
                {violations === 0
                  ? <><Eye className="w-3 h-3" /> Integrity: Clean</>
                  : <><AlertTriangle className="w-3 h-3" /> Violations: {violations}/{MAX_VIOLATIONS}</>
                }
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-textMuted font-mono">
                {isFullscreen ? '🔒 Fullscreen Active' : '⚠️ Fullscreen Inactive'}
              </span>
              <button
                onClick={cancelAssessment}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
              >
                Exit Without Submitting
              </button>
            </div>
          </div>

          {/* Violation banner */}
          <AnimatePresence>
            {showViolationBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 px-6 py-3 bg-red-500/15 border-b border-red-500/25 text-red-300 text-sm font-medium shrink-0"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{violationMsg}</span>
                <span className="ml-auto text-xs text-red-400/70">
                  {MAX_VIOLATIONS - violations} warning(s) remaining before lockout
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Locked state */}
          {assessmentLocked ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8">
              <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Lock className="w-10 h-10 text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-display font-bold text-white">Assessment Locked</h2>
                <p className="text-textMuted text-sm max-w-md">
                  This assessment has been locked due to multiple integrity violations. Please contact your faculty member to re-attempt this assignment.
                </p>
                <p className="text-red-400/70 text-xs mt-4">
                  Recorded violations: {violations} / {MAX_VIOLATIONS}
                </p>
              </div>
              <button
                onClick={cancelAssessment}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            /* Assessment content */
            <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-6"
              >
                {/* Assignment Header */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-primaryAccent/15 border border-primaryAccent/20 rounded-full text-[10px] text-primaryAccent font-bold uppercase tracking-wide">
                      Assignment #{selectedAssignment.id}
                    </span>
                    <span className="text-xs text-textMuted">
                      Assigned by <span className="text-secondaryAccent font-semibold">{selectedAssignment.teacher_name || 'Faculty'}</span>
                    </span>
                  </div>
                  <h1 className="text-2xl font-display font-bold text-white leading-relaxed">
                    {selectedAssignment.topic}
                  </h1>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[11px] text-textMuted font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Assessment Guidelines
                  </p>
                  <ul className="text-xs text-textMuted space-y-1 list-disc list-inside">
                    <li>Write your genuine thoughts and reasoning — TVT tracks cognitive patterns, not content quality</li>
                    <li>Express your thinking clearly and in depth; the system analyzes structure and linguistic complexity</li>
                    <li>Do not plagiarize or copy from external sources — this defeats the purpose of longitudinal tracking</li>
                    <li>Aim for at least 150 words for meaningful NLP analysis</li>
                    <li>Stay in this fullscreen window throughout. Switching tabs will be recorded as violations</li>
                  </ul>
                </div>

                {/* Response textarea */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Send className="w-3 h-3" /> Your Thought Response
                      <span className="ml-auto font-mono text-[10px] text-textMuted">
                        {responseContent.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </label>
                    <textarea
                      value={responseContent}
                      onChange={e => setResponseContent(e.target.value)}
                      required
                      rows={12}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-primaryAccent text-sm leading-relaxed resize-none transition-colors"
                      placeholder="Express your genuine thinking in depth. Describe your understanding, reasoning processes, connections you make between ideas, and any uncertainties or hypotheses you're exploring..."
                    />
                    {responseContent.split(/\s+/).filter(Boolean).length < 30 && responseContent.length > 0 && (
                      <p className="text-xs text-amber-400/70 mt-1">
                        ⚡ Add more depth — TVT needs sufficient text for accurate cognitive profiling
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || responseContent.trim().length < 10}
                      className="flex-1 bg-gradient-to-r from-primary to-primaryAccent hover:opacity-90 text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Computing Thought Velocity...' : 'Submit & Compute Thought Velocity'}
                    </button>
                  </div>
                </form>

                {/* Bottom integrity note */}
                <div className="flex items-center justify-center gap-2 text-xs text-textMuted/50 pt-4 border-t border-white/5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>This response is recorded for longitudinal cognitive analysis. Genuine answers contribute to the accuracy of your Thinking Profile.</span>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ── NORMAL DASHBOARD VIEW ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Active Task / Topic Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 border border-white/5 lg:col-span-7 flex flex-col justify-between min-h-[480px]"
        >
          <div className="h-full flex flex-col items-center justify-center text-center p-12 text-textMuted space-y-4 my-auto">
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-primary/20 to-primaryAccent/10 border border-primary/20 text-primaryAccent">
              <BookOpen className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-semibold text-white">Ready for Assessment</h3>
              <p className="text-sm max-w-sm leading-relaxed">
                Select a pending prompt from the list to begin. The assessment opens in secure fullscreen mode to ensure the authenticity of your Thinking Profile.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-textMuted">
              <Shield className="w-3.5 h-3.5 text-primaryAccent" />
              <span>Anti-cheat active • Genuine responses only • Tab switching monitored</span>
            </div>
          </div>
        </motion.div>

        {/* Assignments List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 border border-white/5">
            <h3 className="text-sm font-semibold mb-4 text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Pending Topics ({pendingAssignments.length})
            </h3>
            <div className="space-y-3">
              {pendingAssignments.length === 0 ? (
                <p className="text-xs text-textMuted bg-black/20 p-4 rounded-xl border border-white/5">
                  🎉 All caught up! No pending assessments.
                </p>
              ) : pendingAssignments.map(a => (
                <motion.div
                  key={a.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => startAssessment(a)}
                  className="p-4 rounded-xl border border-white/5 bg-black/30 hover:border-primaryAccent/30 hover:bg-primary/5 cursor-pointer transition-all group"
                >
                  <p className="font-medium text-white text-sm line-clamp-2">{a.topic}</p>
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[10px] text-textMuted">
                      Faculty: <span className="text-secondaryAccent font-semibold">{a.teacher_name || 'System'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-primaryAccent font-semibold group-hover:gap-1.5 transition-all">
                      <Maximize className="w-3 h-3" /> Start Assessment
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/5">
            <h3 className="text-sm font-semibold mb-4 text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Completed ({completedAssignments.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {completedAssignments.length === 0 ? (
                <p className="text-xs text-textMuted bg-black/20 p-4 rounded-xl border border-white/5">
                  No completed submissions yet.
                </p>
              ) : completedAssignments.map(a => (
                <div key={a.id} className="p-4 rounded-xl border border-white/5 bg-black/40 opacity-75">
                  <p className="font-medium text-white text-sm truncate">{a.topic}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px]">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Velocity Vector Recorded
                    </span>
                    <span className="text-textMuted">Faculty: {a.teacher_name || 'System'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Analysis Result Modal ──────────────────────────────────────────── */}
      {showResultModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-black/85 border border-white/10 p-6 rounded-2xl glass-panel relative text-left"
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Cognitive Analysis Complete
                </h3>
                <p className="text-xs text-textMuted mt-0.5">NLP extracted profile vectors for your submission</p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-text hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-textMuted leading-relaxed">
                Your response has been processed through the spaCy + Sentence-BERT analysis pipeline. Below are the relative metrics calculated across the 6 core cognitive dimensions:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Semantic Depth", val: analysisResult.semantic_depth, desc: "Ratio of subordinate clauses", color: 'from-violet-600 to-violet-400' },
                  { label: "Abstraction Level", val: analysisResult.abstraction_level, desc: "Density of abstract nouns", color: 'from-sky-600 to-sky-400' },
                  { label: "Reasoning Structure", val: analysisResult.reasoning_structure, desc: "Use of logical connectives", color: 'from-emerald-600 to-emerald-400' },
                  { label: "Cross-domain Links", val: analysisResult.cross_domain_links, desc: "Density of disparate entities", color: 'from-orange-600 to-orange-400' },
                  { label: "Confidence Pattern", val: analysisResult.confidence_pattern, desc: "Proportion of modal hedging", color: 'from-pink-600 to-pink-400' },
                  { label: "Vocabulary Expansion", val: analysisResult.vocabulary_expansion, desc: "Lemma Type-Token Ratio", color: 'from-amber-600 to-amber-400' },
                ].map((dim) => (
                  <div key={dim.label} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">{dim.label}</span>
                      <span className="text-primaryAccent">{(dim.val * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, dim.val * 100))}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`bg-gradient-to-r ${dim.color} h-full rounded-full`}
                      />
                    </div>
                    <p className="text-[10px] text-textMuted">{dim.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-center">
                <p className="text-xs text-primaryAccent font-medium">
                  Your cognitive trajectory velocity has been computed. Visit "My Analytics" to view the historical trend chart.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
