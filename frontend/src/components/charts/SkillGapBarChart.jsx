import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Custom tick renderer to prevent text label overlap, collisions, and legend clipping
const renderCustomBarAxisTick = (props) => {
  const { x, y, payload } = props;
  const rawText = payload?.value || '';

  // Smart truncation if exceeding 18 characters to keep columns clean and non-overlapping
  const displayText = rawText.length > 18 ? `${rawText.slice(0, 16)}…` : rawText;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="end"
        fill="#334155"
        fontSize={11}
        fontWeight={600}
        transform="rotate(-35)"
        style={{ userSelect: 'none' }}
      >
        <title>{rawText}</title>
        {displayText}
      </text>
    </g>
  );
};

export const SkillGapBarChart = ({ skillGaps = [] }) => {
  const safeGaps = Array.isArray(skillGaps)
    ? skillGaps
    : Array.isArray(skillGaps?.skillGaps)
    ? skillGaps.skillGaps
    : [];

  if (safeGaps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No skill gaps to display.
      </div>
    );
  }

  const data = safeGaps.map((g) => ({
    name: g.skillName || g.skillCode,
    rawGap: g.rawGap ?? Math.max(0, (g.requiredProficiency || 0) - (g.verifiedProficiency || 0)),
    weightedGap: g.weightedGap !== undefined ? Number(Number(g.weightedGap).toFixed(1)) : 0,
    weight: g.importanceWeight || 1.0,
    criticality: g.criticality || 'ELECTIVE',
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #334155',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.825rem',
            backdropFilter: 'blur(6px)',
          }}
        >
          <p style={{ fontWeight: 800, marginBottom: '0.4rem', color: '#f8fafc', fontSize: '0.875rem' }}>
            {item.name || label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
              <span style={{ color: '#cbd5e1' }}>Raw Skill Gap:</span>
              <strong style={{ color: '#fda4af', marginLeft: 'auto' }}>{item.rawGap} level(s)</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: '#cbd5e1' }}>Weighted Gap:</span>
              <strong style={{ color: '#fde68a', marginLeft: 'auto' }}>{item.weightedGap}</strong>
            </div>
            <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Role Weight: {item.weight}x</span>
              <span style={{ fontWeight: 700, color: item.criticality === 'MANDATORY' ? '#f87171' : item.criticality === 'CORE' ? '#38bdf8' : '#94a3b8' }}>
                {item.criticality}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 380 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 15, right: 25, left: -10, bottom: 65 }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={renderCustomBarAxisTick}
            interval={0}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 'auto']}
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '16px', fontSize: '0.8rem' }}
            formatter={(value) => (
              <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                {value}
              </span>
            )}
          />
          <Bar
            name="Raw Skill Gap"
            dataKey="rawGap"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            name="Weighted Gap (Impact)"
            dataKey="weightedGap"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillGapBarChart;
