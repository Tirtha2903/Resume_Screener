import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Copy, Check, Zap, RefreshCw,
  AlertTriangle, CheckCircle2, Info, Trophy
} from 'lucide-react';

const TARGET = 95;

function priorityBadge(p) {
  if (p === 'High')   return <span className="badge badge-red">{p}</span>;
  if (p === 'Medium') return <span className="badge badge-amber">{p}</span>;
  return <span className="badge badge-gray">{p}</span>;
}

function ScoreArc({ score, target = TARGET }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const targetFill = (target / 100) * circ;
  const scoreFill  = (Math.min(score, 100) / 100) * circ;

  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
      <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="10" />
        {/* Target ghost */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="10"
          strokeDasharray={`${targetFill} ${circ}`} strokeLinecap="round" opacity=".4" />
        {/* Score fill */}
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${scoreFill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

export default function ImprovementPanel({ candidate, jobDescription, onBack }) {
  const [loading, setLoading]     = useState(true);
  const [rescreening, setRescreening] = useState(false);
  const [plan, setPlan]           = useState(null);
  const [history, setHistory]     = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState('');
  const pasteRef = useRef(null);

  // Load initial improvement plan
  useEffect(() => {
    fetchImprovement(candidate.raw_text || '', candidate.category, candidate.satisfaction_score);
  }, [candidate]);

  async function fetchImprovement(resumeText, category, initialScore) {
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('resume_text', resumeText);
      fd.append('job_description', jobDescription || '');
      fd.append('category', category || 'Unknown');

      const res = await fetch('http://localhost:8000/api/improve', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Failed to load improvement plan.');
      const data = await res.json();

      const score = data.satisfaction_score ?? initialScore;
      setPlan(data);
      setHistory([{ round: 1, score, label: 'Initial' }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRescreen() {
    if (!pasteText.trim()) {
      setError('Please paste your updated resume content first.');
      return;
    }
    setRescreening(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('updated_resume_text', pasteText);
      fd.append('job_description', jobDescription || '');
      fd.append('original_category', candidate.category || 'Unknown');

      const res = await fetch('http://localhost:8000/api/rescreen', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Re-evaluation failed. Please try again.');
      const data = await res.json();

      const newScore = data.satisfaction_score;
      const roundNum = history.length + 1;

      setHistory(prev => [...prev, { round: roundNum, score: newScore, label: `Round ${roundNum - 1}` }]);
      setPlan(prev => ({ ...prev, satisfaction_score: newScore, improvement_plan: data.improvement_plan, missing_skills: data.analysis.missing_skills }));
      setPasteText('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRescreening(false);
    }
  }

  const handleCopy = () => {
    if (!plan?.improvement_plan?.prompt) return;
    navigator.clipboard.writeText(plan.improvement_plan.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const currentScore = plan?.satisfaction_score ?? history[history.length - 1]?.score ?? 0;
  const isComplete   = currentScore >= TARGET;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
        <div className="spinner spinner-md" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Analysing resume and building improvement plan…</p>
      </div>
    );
  }

  return (
    <div className="improve-page" style={{ padding: '0 0 48px' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ gap: 6 }}>
          <ArrowLeft size={14} /> Back to results
        </button>
        <div style={{ height: 16, borderLeft: '1px solid var(--border)' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Improving: <strong style={{ color: 'var(--text-primary)' }}>{candidate.name}</strong>
        </p>
      </div>

      {/* Success Banner */}
      {isComplete && (
        <div className="success-banner" style={{ marginBottom: 24 }}>
          <div className="success-icon"><Trophy size={22} /></div>
          <div>
            <p className="success-title">Resume Approved — {Math.round(currentScore)}% Fit!</p>
            <p className="success-sub">Your resume has reached the target threshold. It's ready to submit for this role.</p>
          </div>
        </div>
      )}

      {/* Score Arc + History */}
      <div className="score-arc-wrap" style={{ marginBottom: 24 }}>
        <ScoreArc score={currentScore} />
        <div className="score-arc-info">
          <p className="score-arc-title">
            {isComplete ? 'Target Reached! 🎉' : `${Math.round(Math.max(0, TARGET - currentScore))}% to go`}
          </p>
          <p className="score-arc-sub" style={{ marginBottom: 12 }}>
            Target: {TARGET}% · Current: {Math.round(currentScore)}%
          </p>

          {/* Score timeline */}
          <div className="score-history">
            {history.map((h, i) => (
              <div key={i} className="history-item">
                <div className={`history-round ${i === history.length - 1 ? 'current' : ''}`}>{h.round}</div>
                <span className="history-score">{Math.round(h.score)}%</span>
                <div className="history-bar">
                  <div className="history-bar-fill" style={{ width: `${h.score}%` }} />
                </div>
                <span className="history-label">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Left col: suggestions + prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Improvement Suggestions */}
          <div className="card">
            <div className="card-padded">
            <p className="card-title" style={{ marginBottom: 14 }}>
              <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
              What Needs Improvement
            </p>

            {!plan?.improvement_plan?.suggestions?.length ? (
              <div className="alert alert-success">
                <CheckCircle2 size={14} />
                <span>No major issues found. Keep polishing!</span>
              </div>
            ) : (
              <div className="suggestion-list">
                {plan.improvement_plan.suggestions.map((s, i) => (
                  <div key={i} className="suggestion-card">
                    <div className="suggestion-priority">{priorityBadge(s.priority)}</div>
                    <div>
                      <p className="suggestion-section">{s.section}</p>
                      <p className="suggestion-action">{s.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Missing Skills */}
          {plan?.missing_skills?.length > 0 && (
            <div className="card">
              <div className="card-padded">
              <p className="card-title" style={{ marginBottom: 12 }}>
                <AlertTriangle size={15} style={{ color: 'var(--red)' }} />
                Missing JD Skills
              </p>
              <div className="skills-wrap">
                {plan.missing_skills.map((s, i) => (
                  <span key={i} className="skill-tag missing">{s}</span>
                ))}
              </div>
              </div>
            </div>
          )}

        </div>

        {/* Right col: prompt + paste + re-evaluate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AI Prompt */}
          <div className="card">
              <div className="card-padded">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="card-title">
                <Zap size={15} style={{ color: 'var(--brand)' }} />
                Ready-to-Use AI Prompt
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                style={{ gap: 6 }}
              >
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <div className="alert alert-info" style={{ marginBottom: 10 }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Copy it, paste into ChatGPT / Claude / Gemini, then paste the improved resume text below.</span>
            </div>
            <textarea
              readOnly
              className="prompt-textarea"
              value={plan?.improvement_plan?.prompt || ''}
            />
            </div>
          </div>

          {/* Paste back */}
          <div className="card">
              <div className="card-padded">
            <p className="card-title" style={{ marginBottom: 6 }}>
              <CheckCircle2 size={15} style={{ color: 'var(--green)' }} />
              Paste Your Improved Resume
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              After getting AI feedback, paste the improved resume text here to re-evaluate.
            </p>
            <div className="paste-area">
              <textarea
                ref={pasteRef}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste the full updated resume text here…"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={handleRescreen}
              disabled={rescreening || !pasteText.trim()}
            >
              {rescreening ? (
                <><div className="spinner spinner-sm" style={{ borderWidth: 2 }} /> Re-evaluating…</>
              ) : (
                <><RefreshCw size={14} /> Re-Evaluate Resume</>
              )}
            </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
