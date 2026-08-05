import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Clock, CheckCircle2 } from 'lucide-react';
import RadarChart from './RadarChart';
import TrajectoryChart from './TrajectoryChart';
import { toast } from 'sonner';

const DIM_CONFIG = [
  { key: 'semantic_depth',       label: 'Semantic Depth',    color: '#a78bfa' },
  { key: 'abstraction_level',    label: 'Abstraction Level', color: '#38bdf8' },
  { key: 'reasoning_structure',  label: 'Reasoning',         color: '#34d399' },
  { key: 'cross_domain_links',   label: 'Cross-Domain',      color: '#fb923c' },
  { key: 'confidence_pattern',   label: 'Confidence',        color: '#f472b6' },
  { key: 'vocabulary_expansion', label: 'Vocabulary',        color: '#fbbf24' },
];

function TrendBadge({ trend }) {
  if (trend === 'up')
    return <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold"><TrendingUp className="w-3 h-3" />↑ Growing</span>;
  if (trend === 'down')
    return <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold"><TrendingDown className="w-3 h-3" />↓ Declining</span>;
  return <span className="flex items-center gap-0.5 text-textMuted text-[10px] font-bold"><Minus className="w-3 h-3" />→ Stable</span>;
}

export default function StudentAnalytics() {
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrajectory = async () => {
      try {
        const profileRes = await fetch('http://localhost:8000/api/auth/users/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!profileRes.ok) throw new Error('Failed to get user profile');
        const userProfile = await profileRes.json();

        if (!userProfile.student_id) { setLoading(false); return; }

        const trajRes = await fetch(`http://localhost:8000/api/trajectories/${userProfile.student_id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (trajRes.ok) {
          const data = await trajRes.json();
          setTrajectoryData(data);
        } else {
          toast.error('Failed to load trajectory analytics');
        }
      } catch (e) {
        toast.error('Network error loading analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchTrajectory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-textMuted">
        <Sparkles className="w-6 h-6 animate-spin mr-2 text-primaryAccent" />
        Computing Longitudinal Trajectory...
      </div>
    );
  }

  const snapshots = trajectoryData?.snapshots || [];
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const dimTrends = trajectoryData?.dimension_trends || {};
  const velocityMagnitude = trajectoryData?.velocity_magnitude ?? 0;
  const isDecelerating = trajectoryData?.analysis?.decelerating === true;

  // Velocity label based on magnitude
  const velLabel = velocityMagnitude === 0 ? 'No Data'
    : velocityMagnitude < 0.05 ? 'Low Momentum'
    : velocityMagnitude < 0.15 ? 'Moderate Momentum'
    : velocityMagnitude < 0.3 ? 'High Momentum'
    : 'Rapid Evolution';
  const velColor = velocityMagnitude === 0 ? 'text-textMuted'
    : velocityMagnitude < 0.05 ? 'text-amber-400'
    : velocityMagnitude < 0.15 ? 'text-sky-400'
    : 'text-emerald-400';

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header Banner ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-6 border border-white/5 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primaryAccent" />
            Cognitive Trajectory & Self-Reflection
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Non-evaluative analytics tracking the direction and magnitude of your intellectual evolution.
          </p>
        </div>
        {isDecelerating && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cognitive deceleration detected across recent sessions — consider diversifying your responses.</span>
          </div>
        )}
      </div>

      {/* ── Velocity Score Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-panel p-4 border border-white/5">
          <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center gap-1 mb-2">
            <Zap className="w-3 h-3 text-primaryAccent" /> Thought Velocity
          </p>
          <p className={`text-2xl font-bold font-mono ${velColor}`}>{(velocityMagnitude * 100).toFixed(1)}</p>
          <p className={`text-[10px] font-semibold mt-1 ${velColor}`}>{velLabel}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-4 border border-white/5">
          <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center gap-1 mb-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Submissions
          </p>
          <p className="text-2xl font-bold font-mono text-white">{snapshots.length}</p>
          <p className="text-[10px] text-textMuted mt-1">Cognitive snapshots recorded</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-panel p-4 border border-white/5">
          <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center gap-1 mb-2">
            <TrendingUp className="w-3 h-3 text-sky-400" /> Trajectory Status
          </p>
          <p className={`text-lg font-bold ${isDecelerating ? 'text-amber-400' : 'text-emerald-400'}`}>
            {snapshots.length < 2 ? 'Initializing' : isDecelerating ? 'Decelerating' : 'Progressing'}
          </p>
          <p className="text-[10px] text-textMuted mt-1">Longitudinal trend</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel p-4 border border-white/5">
          <p className="text-[10px] text-textMuted uppercase font-semibold flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3 text-secondaryAccent" /> Latest Depth
          </p>
          <p className="text-2xl font-bold font-mono text-secondaryAccent">
            {latestSnapshot ? `${(latestSnapshot.semantic_depth * 100).toFixed(0)}%` : '—'}
          </p>
          <p className="text-[10px] text-textMuted mt-1">Semantic depth score</p>
        </motion.div>
      </div>

      {snapshots.length === 0 ? (
        <div className="glass-panel p-12 text-center text-textMuted border border-white/5 space-y-3">
          <TrendingUp className="w-12 h-12 mx-auto text-primaryAccent/50" />
          <h3 className="text-lg font-semibold text-white">No Thought Profiles Yet</h3>
          <p className="text-sm max-w-md mx-auto">
            Submit responses to pending assignments in your Overview dashboard to begin plotting your 6-dimensional Thinking Profile over time.
          </p>
        </div>
      ) : (
        <>
          {/* ── Charts Row ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Radar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-5 glass-panel p-6 border border-white/5"
            >
              <h2 className="text-lg font-display font-semibold text-white mb-1">Latest Thinking Profile</h2>
              <p className="text-xs text-textMuted mb-4">6-Dimensional Cognitive Snapshot • Dashed = Previous Session</p>
              <RadarChart snapshots={snapshots} showPrevious={true} height="260px" />
            </motion.div>

            {/* Trajectory */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="lg:col-span-7 glass-panel p-6 border border-white/5"
            >
              <h2 className="text-lg font-display font-semibold text-white mb-1">Longitudinal Velocity Trajectory</h2>
              <p className="text-xs text-textMuted mb-4">Toggle dimensions to compare evolution paths</p>
              <TrajectoryChart snapshots={snapshots} height="260px" />
            </motion.div>
          </div>

          {/* ── Dimension Trend Cards ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-panel p-6 border border-white/5">
            <h2 className="text-lg font-display font-semibold text-white mb-1">Dimension Trend Analysis</h2>
            <p className="text-xs text-textMuted mb-5">Change direction across all cognitive dimensions from first to latest submission</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DIM_CONFIG.map(dim => {
                const val = latestSnapshot ? latestSnapshot[dim.key] : 0;
                const trend = dimTrends[dim.key] || 'stable';
                return (
                  <div key={dim.key} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-textMuted font-semibold uppercase">{dim.label}</p>
                    <p className="text-xl font-bold font-mono" style={{ color: dim.color }}>
                      {(val * 100).toFixed(0)}%
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, val * 100)}%`, backgroundColor: dim.color }} />
                    </div>
                    <TrendBadge trend={trend} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Session History Table ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel p-6 border border-white/5">
            <h2 className="text-lg font-display font-semibold text-white mb-1">Session History</h2>
            <p className="text-xs text-textMuted mb-5">All cognitive profile snapshots recorded chronologically</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-textMuted uppercase tracking-wider">
                    <th className="pb-3 pr-4">Session</th>
                    <th className="pb-3 pr-4">Timestamp</th>
                    {DIM_CONFIG.map(d => (
                      <th key={d.key} className="pb-3 pr-3" style={{ color: d.color }}>{d.label.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4 font-mono text-white">S{idx + 1}</td>
                      <td className="py-3 pr-4 text-textMuted">
                        {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {DIM_CONFIG.map(d => (
                        <td key={d.key} className="py-3 pr-3 font-mono font-semibold" style={{ color: d.color }}>
                          {(s[d.key] * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-textMuted border-t border-white/5 pt-4">
              <span>Total Snapshots: <strong className="text-white">{snapshots.length}</strong></span>
              <span className="text-emerald-400 font-medium">Velocity Vectors & Cosine Similarity Tracked</span>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
