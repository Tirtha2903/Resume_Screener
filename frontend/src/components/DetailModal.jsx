import React from 'react';
import { X, Mail, Phone, CheckCircle2, AlertTriangle, Plus, FileText, Zap } from 'lucide-react';

function scoreClass(s) {
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  return 'low';
}

function ScoreRing({ score }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const cls = scoreClass(score);
  const color = cls === 'high' ? 'var(--green)' : cls === 'medium' ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="score-ring-wrap" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .7s ease' }}
        />
      </svg>
      <div className="score-ring-label">
        <span className={`score-inline ${cls}`} style={{ fontSize: '1rem' }}>{Math.round(score)}</span>
        <small>/ 100</small>
      </div>
    </div>
  );
}

export default function DetailModal({ candidate, onClose, onImprove }) {
  if (!candidate) return null;

  const { matched_skills, missing_skills, additional_skills } = candidate.analysis;
  const score = candidate.satisfaction_score ?? candidate.match_score ?? 0;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {candidate.name}
            </h2>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-brand">{candidate.category}</span>
              <span className="badge badge-gray">{candidate.confidence}% confidence</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">

          {/* Score summary */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '16px 20px', background: 'var(--bg-raised)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
            <ScoreRing score={score} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Overall Fit Score
              </p>
              <div className="progress-track">
                <div className={`progress-fill ${scoreClass(score)}`} style={{ width: `${score}%` }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Target: 95% &nbsp;·&nbsp; Gap: {Math.max(0, 95 - score).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="section-label"><Mail size={13} /> Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="contact-row">
                <Mail size={13} className="contact-icon" />
                <span>{candidate.email}</span>
              </div>
              <div className="contact-row">
                <Phone size={13} className="contact-icon" />
                <span>{candidate.phone}</span>
              </div>
              <div className="contact-row">
                <FileText size={13} className="contact-icon" />
                <span style={{ color: 'var(--text-faint)' }}>{candidate.filename}</span>
              </div>
            </div>
          </div>

          {/* Skills gap */}
          <div>
            <p className="section-label"><CheckCircle2 size={13} /> Skills Analysis</p>

            {matched_skills.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> Matched ({matched_skills.length})
                </p>
                <div className="skills-wrap">
                  {matched_skills.map((s, i) => <span key={i} className="skill-tag matched">{s}</span>)}
                </div>
              </div>
            )}

            {missing_skills.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> Missing ({missing_skills.length})
                </p>
                <div className="skills-wrap">
                  {missing_skills.map((s, i) => <span key={i} className="skill-tag missing">{s}</span>)}
                </div>
              </div>
            )}

            {additional_skills.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={12} /> Additional Skills ({additional_skills.length})
                </p>
                <div className="skills-wrap">
                  {additional_skills.map((s, i) => <span key={i} className="skill-tag extra">{s}</span>)}
                </div>
              </div>
            )}

            {matched_skills.length === 0 && missing_skills.length === 0 && additional_skills.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provide a job description to see skills analysis.</p>
            )}
          </div>

          {/* Text preview */}
          <div>
            <p className="drawer-section-title"><FileText size={13} /> Resume Preview</p>
            <div className="prompt-textarea" style={{ height: 160, cursor: 'default' }}>
              {candidate.text_preview}
            </div>
          </div>

          {/* CTA */}
          <button
            className="btn btn-primary"
            style={{ gap: 8 }}
            onClick={() => { onClose(); onImprove(candidate); }}
          >
            <Zap size={15} fill="currentColor" />
            Open Improvement Mode
          </button>

        </div>
      </div>
    </div>
  );
}
