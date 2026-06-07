import React from 'react';
import { BarChart3, PieChart, Users, Award, ShieldAlert, CheckSquare } from 'lucide-react';

export default function Dashboard({ results }) {
  if (!results || results.length === 0) return null;

  // Calculate metrics
  const totalResumes = results.length;
  
  const averageScore = results.reduce((acc, curr) => acc + curr.match_score, 0) / totalResumes;
  
  const highFitCount = results.filter(r => r.match_score >= 70).length;
  const mediumFitCount = results.filter(r => r.match_score >= 40 && r.match_score < 70).length;
  const lowFitCount = results.filter(r => r.match_score < 40).length;

  // Category counts
  const categoryCounts = {};
  results.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Score distribution ranges
  const scoreRanges = [
    { label: '0-20%', count: results.filter(r => r.match_score <= 20).length },
    { label: '21-40%', count: results.filter(r => r.match_score > 20 && r.match_score <= 40).length },
    { label: '41-60%', count: results.filter(r => r.match_score > 40 && r.match_score <= 60).length },
    { label: '61-80%', count: results.filter(r => r.match_score > 60 && r.match_score <= 80).length },
    { label: '81-100%', count: results.filter(r => r.match_score > 80).length }
  ];

  const maxRangeCount = Math.max(...scoreRanges.map(r => r.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 2' }}>
      
      {/* Metrics Row */}
      <div className="analytics-grid">
        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Total Resumes Screened</span>
            <Users size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="stats-value">{totalResumes}</span>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Average Job Description Match</span>
            <Award size={16} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="stats-value" style={{ color: averageScore >= 70 ? 'var(--color-success)' : averageScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
            {Math.round(averageScore)}%
          </span>
        </div>
      </div>

      {/* Visual Analytics Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {/* Score Distribution Chart */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
            <BarChart3 size={16} style={{ color: 'var(--color-accent)' }} />
            Match Score Distribution
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            {scoreRanges.map((range, idx) => {
              const heightPercentage = (range.count / maxRangeCount) * 100;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16%', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: range.count > 0 ? '#fff' : 'var(--text-dark)' }}>
                    {range.count}
                  </span>
                  <div style={{ 
                    width: '100%', 
                    height: '110px', 
                    background: 'rgba(255,255,255,0.01)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${heightPercentage}%`, 
                      background: 'var(--grad-primary)', 
                      borderRadius: '4px',
                      transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {range.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown list */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
            <PieChart size={16} style={{ color: 'var(--color-primary)' }} />
            Candidate Skill Fields
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {categoryData.map((data, idx) => {
              const share = Math.round((data.value / totalResumes) * 100);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                    <span style={{ color: '#fff' }}>{data.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{data.value} ({share}%)</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px', margin: 0 }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${share}%`, 
                        background: 'var(--grad-accent)',
                        boxShadow: '0 0 6px rgba(6, 182, 212, 0.2)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
