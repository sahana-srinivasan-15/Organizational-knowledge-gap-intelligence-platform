import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export const SkillGapRadarChart = ({ skillGaps = [] }) => {
  const safeGaps = Array.isArray(skillGaps)
    ? skillGaps
    : Array.isArray(skillGaps?.skillGaps)
    ? skillGaps.skillGaps
    : [];

  if (safeGaps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No skill requirements available for radar visualization.
      </div>
    );
  }

  // Format data for radar chart
  const data = safeGaps.map((g) => ({
    skill: g.skillName || g.skillCode || 'Skill',
    required: g.requiredProficiency || g.requiredProficiencyLevel || 0,
    verified: g.verifiedProficiency || g.verifiedProficiencyLevel || 0,
    selfReported: g.selfReportedProficiency || g.currentProficiencyLevel || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid var(--border-medium)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.825rem',
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#fff' }}>{item.skill}</p>
          <p style={{ color: '#818cf8', margin: '0.15rem 0' }}>Required: Level {item.required} / 5</p>
          <p style={{ color: '#34d399', margin: '0.15rem 0' }}>Verified: Level {item.verified} / 5</p>
          {item.selfReported > 0 && (
            <p style={{ color: '#fbbf24', margin: '0.15rem 0' }}>Self-Reported: Level {item.selfReported} / 5</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>}
          />
          <Radar
            name="Required Proficiency"
            dataKey="required"
            stroke="#818cf8"
            fill="#818cf8"
            fillOpacity={0.25}
          />
          <Radar
            name="Verified Proficiency"
            dataKey="verified"
            stroke="#34d399"
            fill="#34d399"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillGapRadarChart;
