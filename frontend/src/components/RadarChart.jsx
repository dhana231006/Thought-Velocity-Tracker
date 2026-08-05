import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const DIM_LABELS = [
  'Semantic Depth',
  'Abstraction',
  'Reasoning',
  'Cross-Domain',
  'Confidence',
  'Vocabulary'
];

const getDimValues = (snap) => snap ? [
  snap.semantic_depth ?? 0,
  snap.abstraction_level ?? 0,
  snap.reasoning_structure ?? 0,
  snap.cross_domain_links ?? 0,
  snap.confidence_pattern ?? 0,
  snap.vocabulary_expansion ?? 0,
] : [0, 0, 0, 0, 0, 0];

/**
 * RadarChart
 * Props:
 *  - snapshot  {object}   single snapshot object (used by StudentAnalytics)
 *  - snapshots {object[]} array of snapshots (used by FacultyDashboard, Cohort)
 *  - showPrevious {bool}  if true and snapshots has 2+, overlays previous snapshot
 *  - height {string}      optional CSS height, default '280px'
 */
export default function RadarChart({ snapshot, snapshots, showPrevious = true, height = '280px' }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  // Normalize: prefer snapshots array, else wrap single snapshot
  const snapsArr = snapshots && snapshots.length > 0
    ? snapshots
    : snapshot
      ? [snapshot]
      : [];

  useEffect(() => {
    if (snapsArr.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const latest = snapsArr[snapsArr.length - 1];
    const previous = snapsArr.length >= 2 ? snapsArr[snapsArr.length - 2] : null;

    const datasets = [
      {
        label: 'Latest Profile',
        data: getDimValues(latest),
        backgroundColor: 'rgba(109, 40, 217, 0.35)',
        borderColor: 'rgba(167, 139, 250, 0.9)',
        borderWidth: 2,
        pointBackgroundColor: '#a78bfa',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6d28d9',
        pointRadius: 4,
      }
    ];

    if (showPrevious && previous) {
      datasets.push({
        label: 'Previous Profile',
        data: getDimValues(previous),
        backgroundColor: 'rgba(14, 165, 233, 0.12)',
        borderColor: 'rgba(14, 165, 233, 0.45)',
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: 'transparent',
        pointRadius: 3,
      });
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'radar',
      data: { labels: DIM_LABELS, datasets },
      options: {
        animation: { duration: 700, easing: 'easeInOutQuart' },
        scales: {
          r: {
            min: 0,
            max: 1,
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: {
              color: 'rgba(255,255,255,0.65)',
              font: { size: 11, family: 'Inter, sans-serif' }
            },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: {
            display: showPrevious && !!previous,
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              boxWidth: 10,
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`
            }
          }
        },
        maintainAspectRatio: false
      }
    });

    return () => chartRef.current?.destroy();
  }, [snapsArr]);

  if (snapsArr.length === 0) {
    return (
      <div className="flex items-center justify-center text-textMuted text-sm h-full">
        No profile data yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
