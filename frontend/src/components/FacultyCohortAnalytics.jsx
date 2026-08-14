import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, AlertTriangle, Zap, TrendingUp, TrendingDown, Minus, Users, Sparkles, Award } from 'lucide-react';
import RadarChart from './RadarChart';
import TrajectoryChart from './TrajectoryChart';
import { toast } from 'sonner';

const DIM_CONFIG = [
  { key: 'semantic_depth',       label: 'Semantic Depth',    color: '#a78bfa' },
  { key: 'abstraction_level',    label: 'Abstraction',       color: '#38bdf8' },
  { key: 'reasoning_structure',  label: 'Reasoning',         color: '#34d399' },
  { key: 'cross_domain_links',   label: 'Cross-Domain',      color: '#fb923c' },
  { key: 'confidence_pattern',   label: 'Confidence',        color: '#f472b6' },
  { key: 'vocabulary_expansion', label: 'Vocabulary',        color: '#fbbf24' },
];

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-textMuted" />;
}

const VELOCITY_LABEL = (v) =>
  v === 0 ? 'No Data' :
  v < 0.05 ? 'Low' :
  v < 0.15 ? 'Moderate' :
  v < 0.3 ? 'High' : 'Rapid';

const VELOCITY_COLOR = (v) =>
  v === 0 ? '#6b7280' :
  v < 0.05 ? '#f59e0b' :
  v < 0.15 ? '#38bdf8' :
  '#34d399';

export default function FacultyCohortAnalytics() {
  const [cohortData, setCohortData] = useState([]);
  const [fullCohort, setFullCohort] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [compareStudents, setCompareStudents] = useState([]);

  const fetchCohort = async () => {
    try {
      const [summaryRes, fullRes] = await Promise.all([
        fetch('/api/trajectories/cohort/summary', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/trajectories/cohort/full', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      if (summaryRes.ok) setCohortData(await summaryRes.json());
      if (fullRes.ok) setFullCohort(await fullRes.json());
    } catch (e) {
      toast.error('Failed to load cohort analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCohort(); }, []);

  const toggleCompare = (studentId) => {
    setCompareStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : prev.length < 3 ? [...prev, studentId] : prev
    );
  };

  // Build radar overlay snapshots from selected comparison students
  const comparisonRadarData = compareStudents.map(sid => {
    const s = cohortData.find(d => d.student_id === sid);
    return s?.latest_snapshot ? { ...s.latest_snapshot, _label: s.student_name } : null;
  }).filter(Boolean);

  const studentsWithData = cohortData.filter(s => s.submission_count > 0);
  const deceleratingCount = cohortData.filter(s => s.decelerating).length;
  const avgVelocity = studentsWithData.length > 0
    ? (studentsWithData.reduce((sum, s) => sum + s.velocity_magnitude, 0) / studentsWithData.length)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-textMuted">
        <Sparkles className="w-6 h-6 animate-spin mr-2 text-primaryAccent" />
        Loading Cohort Analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-text p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 via-transparent to-primary/8 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-secondaryAccent" />
            Cohort Analytics
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Longitudinal cognitive momentum tracking across your entire student cohort.
          </p>
        </div>

        {/* ── Overview stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: cohortData.length, icon: <Users className="w-4 h-4 text-primaryAccent" />, color: 'text-white' },
            { label: 'Active Profiles', value: studentsWithData.length, icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, color: 'text-emerald-400' },
            { label: 'Avg. Velocity', value: (avgVelocity * 100).toFixed(1), suffix: '', icon: <Zap className="w-4 h-4 text-sky-400" />, color: 'text-sky-400' },
            { label: 'Deceleration Alerts', value: deceleratingCount, icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, color: deceleratingCount > 0 ? 'text-amber-400' : 'text-white' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-4 border border-white/5">
              <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center gap-1 mb-2">
                {stat.icon} {stat.label}
              </p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}{stat.suffix || ''}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Leaderboard (Cognitive Momentum Ranking) ──────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 glass-panel p-6 border border-white/5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primaryAccent" /> Cognitive Momentum
              </h2>
              <p className="text-xs text-textMuted mt-0.5">Students ranked by thought velocity magnitude</p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {cohortData.length === 0 ? (
                <p className="text-xs text-textMuted text-center py-8">No student data available</p>
              ) : cohortData.map((student, idx) => (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedStudent(
                    selectedStudent?.student_id === student.student_id ? null : student
                  )}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStudent?.student_id === student.student_id
                      ? 'border-primaryAccent/40 bg-primary/10'
                      : 'border-white/5 bg-black/20 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-white/5 text-textMuted'
                    }`}>#{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">{student.student_name}</p>
                        {student.decelerating && (
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" title="Cognitive deceleration detected" />
                        )}
                      </div>
                      <p className="text-[10px] text-textMuted">{student.department || 'No dept'} • {student.submission_count} sessions</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-mono" style={{ color: VELOCITY_COLOR(student.velocity_magnitude) }}>
                        {(student.velocity_magnitude * 100).toFixed(1)}
                      </p>
                      <p className="text-[9px]" style={{ color: VELOCITY_COLOR(student.velocity_magnitude) }}>
                        {VELOCITY_LABEL(student.velocity_magnitude)}
                      </p>
                    </div>
                  </div>

                  {/* Mini velocity bar */}
                  {student.submission_count > 0 && (
                    <div className="mt-2 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, student.velocity_magnitude * 333)}%`,
                          backgroundColor: VELOCITY_COLOR(student.velocity_magnitude)
                        }}
                      />
                    </div>
                  )}

                  {/* Dimension trend pills */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {DIM_CONFIG.map(d => (
                      <span key={d.key} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/5 border border-white/5">
                        <TrendIcon trend={student.dimension_trends?.[d.key]} />
                        <span className="text-textMuted">{d.label.split(' ')[0][0]}{d.label.split(' ')[d.label.split(' ').length - 1][0]}</span>
                      </span>
                    ))}
                  </div>

                  {/* Compare toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleCompare(student.student_id); }}
                    className={`mt-2 w-full text-[10px] py-1 rounded-lg border font-semibold transition-colors ${
                      compareStudents.includes(student.student_id)
                        ? 'border-primaryAccent/40 bg-primary/20 text-primaryAccent'
                        : 'border-white/5 bg-white/3 text-textMuted hover:text-white hover:border-white/10'
                    }`}
                    disabled={!compareStudents.includes(student.student_id) && compareStudents.length >= 3}
                  >
                    {compareStudents.includes(student.student_id) ? '✓ In Comparison' : '+ Compare'}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Right panel: Student detail or Radar Comparison ─────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Radar comparison */}
            {compareStudents.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-6 border border-white/5">
                <h3 className="text-base font-semibold text-white mb-1">
                  Radar Comparison ({compareStudents.length} students)
                </h3>
                <p className="text-xs text-textMuted mb-4">Latest cognitive profiles overlaid for comparison</p>
                {/* Render as individual radars side by side */}
                <div className={`grid gap-4 ${compareStudents.length === 1 ? 'grid-cols-1' : compareStudents.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {compareStudents.map(sid => {
                    const s = cohortData.find(d => d.student_id === sid);
                    if (!s?.latest_snapshot) return null;
                    return (
                      <div key={sid} className="bg-black/20 rounded-xl border border-white/5 p-3">
                        <p className="text-xs font-semibold text-white mb-2 text-center truncate">{s.student_name}</p>
                        <RadarChart snapshot={s.latest_snapshot} showPrevious={false} height="180px" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Selected student detail */}
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.student_id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 border border-white/5 space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {selectedStudent.student_name}
                      {selectedStudent.decelerating && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Decelerating
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-textMuted mt-0.5">
                      {selectedStudent.department || 'No department'} • {selectedStudent.submission_count} submissions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono" style={{ color: VELOCITY_COLOR(selectedStudent.velocity_magnitude) }}>
                      {(selectedStudent.velocity_magnitude * 100).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-textMuted">Velocity Score</p>
                  </div>
                </div>

                {/* Dimension breakdown */}
                <div>
                  <p className="text-xs font-semibold text-textMuted uppercase mb-3">Dimension Trends</p>
                  <div className="space-y-2">
                    {DIM_CONFIG.map(d => {
                      const val = selectedStudent.latest_snapshot?.[d.key] ?? 0;
                      const trend = selectedStudent.dimension_trends?.[d.key] ?? 'stable';
                      return (
                        <div key={d.key} className="flex items-center gap-3">
                          <span className="text-[10px] text-textMuted w-24 shrink-0">{d.label}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, val * 100)}%`, backgroundColor: d.color }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: d.color }}>
                            {(val * 100).toFixed(0)}%
                          </span>
                          <TrendIcon trend={trend} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trajectory chart for selected student */}
                {(() => {
                  const fc = fullCohort.find(s => s.student_id === selectedStudent.student_id);
                  return fc && fc.snapshots.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-textMuted uppercase mb-3">Velocity Trajectory</p>
                      <TrajectoryChart snapshots={fc.snapshots} height="200px" />
                    </div>
                  ) : (
                    <p className="text-xs text-textMuted text-center py-4">No trajectory data yet — student needs more submissions.</p>
                  );
                })()}
              </motion.div>
            ) : (
              <div className="glass-panel p-12 border border-white/5 flex flex-col items-center justify-center text-center text-textMuted space-y-3">
                <BarChart2 className="w-10 h-10 text-primaryAccent/40" />
                <p className="text-sm">Click a student on the left to view their detailed cognitive profile and trajectory.</p>
                <p className="text-xs">Use "+ Compare" on up to 3 students for side-by-side radar comparison.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
