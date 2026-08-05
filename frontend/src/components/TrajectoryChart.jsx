import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const ALL_DIMS = [
  { key: 'semantic_depth',      label: 'Semantic Depth',   color: '#a78bfa' },
  { key: 'abstraction_level',   label: 'Abstraction',       color: '#38bdf8' },
  { key: 'reasoning_structure', label: 'Reasoning',         color: '#34d399' },
  { key: 'cross_domain_links',  label: 'Cross-Domain',      color: '#fb923c' },
  { key: 'confidence_pattern',  label: 'Confidence',        color: '#f472b6' },
  { key: 'vocabulary_expansion',label: 'Vocabulary',        color: '#fbbf24' },
];

/**
 * TrajectoryChart — plots all 6 cognitive dimension trajectories over time.
 * Props:
 *  - snapshots {object[]} — array of profile snapshots
 *  - height {string}      — optional CSS height, default '280px'
 */
export default function TrajectoryChart({ snapshots, height = '280px' }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [visibleDims, setVisibleDims] = useState(() =>
    Object.fromEntries(ALL_DIMS.map(d => [d.key, true]))
  );

  const buildChart = (visible) => {
    if (!snapshots || snapshots.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = snapshots.map((_, idx) => `S${idx + 1}`);

    const datasets = ALL_DIMS
      .filter(d => visible[d.key])
      .map(dim => ({
        label: dim.label,
        data: snapshots.map(s => s[dim.key] ?? 0),
        borderColor: dim.color,
        backgroundColor: dim.color + '18',
        borderWidth: 2,
        pointBackgroundColor: dim.color,
        pointBorderColor: 'transparent',
        pointRadius: snapshots.length <= 6 ? 4 : 2,
        tension: 0.4,
        fill: false,
      }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        animation: { duration: 500 },
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: '#fff',
            bodyColor: 'rgba(255,255,255,0.7)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 1,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: 'rgba(255,255,255,0.4)',
              callback: v => `${(v * 100).toFixed(0)}%`,
              font: { size: 10 }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          }
        }
      }
    });
  };

  useEffect(() => {
    buildChart(visibleDims);
    return () => chartRef.current?.destroy();
  }, [snapshots, visibleDims]);

  const toggleDim = (key) => {
    setVisibleDims(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center text-textMuted text-sm h-full">
        No trajectory data yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggleable dimension legend */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_DIMS.map(d => (
          <button
            key={d.key}
            onClick={() => toggleDim(d.key)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              visibleDims[d.key]
                ? 'border-white/10 bg-black/30 text-white'
                : 'border-white/5 bg-black/10 text-textMuted opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            {d.label}
          </button>
        ))}
      </div>

      {/* Chart canvas */}
      <div style={{ position: 'relative', height, width: '100%' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
