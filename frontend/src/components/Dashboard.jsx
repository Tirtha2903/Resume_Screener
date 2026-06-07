import React from 'react';
import { Users, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

function scoreClass(s) {
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  return 'low';
}

export default function Dashboard({ results }) {
  if (!results || results.length === 0) return null;

  const total = results.length;
  const avg   = results.reduce((a, r) => a + r.satisfaction_score, 0) / total;
  const high  = results.filter(r => r.satisfaction_score >= 70).length;
  const low   = results.filter(r => r.satisfaction_score < 40).length;

  // Category breakdown
  const cats = {};
  results.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCat  = catList[0]?.[1] || 1;

  // Score distribution buckets
  const buckets = [
    { label: '0-20',   count: results.filter(r => r.satisfaction_score <= 20).length },
    { label: '21-40',  count: results.filter(r => r.satisfaction_score > 20 && r.satisfaction_score <= 40).length },
    { label: '41-60',  count: results.filter(r => r.satisfaction_score > 40 && r.satisfaction_score <= 60).length },
    { label: '61-80',  count: results.filter(r => r.satisfaction_score > 60 && r.satisfaction_score <= 80).length },
    { label: '81-100', count: results.filter(r => r.satisfaction_score > 80).length },
  ];
  const maxBucket = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, gridColumn: 'span 2' }}>
      {/* Stat cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={12} /> Total Screened
          </div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <TrendingUp size={12} /> Avg. Fit Score
          </div>
          <div className={`stat-value score-num ${scoreClass(avg)}`}>{Math.round(avg)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={12} /> Strong Fits (70%+)
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{high}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={12} /> Needs Work (below 40%)
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{low}</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Score distribution */}
        <div className="card">
          <div className="card-padded">
            <p className="card-title" style={{ marginBottom: 16 }}>Score Distribution</p>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              height: 120, gap: 8, borderBottom: '1px solid var(--border)',
              paddingBottom: 10, marginBottom: 8
            }}>
              {buckets.map((b, i) => {
                const pct = (b.count / maxBucket) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: b.count > 0 ? 'var(--text-primary)' : 'var(--text-faint)' }}>{b.count}</span>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', alignItems: 'flex-end', background: 'var(--bg-raised)', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: 'var(--brand)', opacity: .75, borderRadius: '4px 4px 0 0', transition: 'height .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {buckets.map((b, i) => (
                <span key={i} style={{ fontSize: '0.65rem', color: 'var(--text-faint)', flex: 1, textAlign: 'center' }}>{b.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="card-padded">
            <p className="card-title" style={{ marginBottom: 16 }}>Candidate Profiles</p>
            <div className="mini-chart">
              {catList.map(([name, count], i) => (
                <div key={i} className="mini-chart-row">
                  <span className="mini-chart-label" title={name}>{name}</span>
                  <div className="mini-chart-track">
                    <div className="mini-chart-fill" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                  <span className="mini-chart-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
