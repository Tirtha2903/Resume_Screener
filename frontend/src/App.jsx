import React, { useState, useEffect } from 'react';
import { FileSearch, Play, RotateCw, AlertTriangle, RefreshCw, Sun, Moon } from 'lucide-react';
import ResumeDropzone   from './components/ResumeDropzone';
import ResultList       from './components/ResultList';
import DetailModal      from './components/DetailModal';
import Dashboard        from './components/Dashboard';
import ImprovementPanel from './components/ImprovementPanel';

/* ── Theme helper ─────────────────────────────────────────── */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem('resume-ai-theme');
    if (saved) return saved;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('resume-ai-theme', theme); } catch {}
}

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  const [theme, setTheme]             = useState(getInitialTheme);
  const [jobDescription, setJobDesc]  = useState('');
  const [files, setFiles]             = useState([]);
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [apiOnline, setApiOnline]     = useState(false);
  const [selected, setSelected]       = useState(null);
  const [improving, setImproving]     = useState(null);
  const [error, setError]             = useState('');
  const [retraining, setRetraining]   = useState(false);
  const [trainMsg, setTrainMsg]       = useState('');

  // Apply theme on mount + change
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => { checkHealth(); }, []);

  async function checkHealth() {
    try {
      const r = await fetch('http://localhost:8000/api/health');
      setApiOnline(r.ok);
    } catch { setApiOnline(false); }
  }

  async function handleScreen(e) {
    e.preventDefault();
    if (!files.length) { setError('Please upload at least one resume file.'); return; }
    setError('');
    setLoading(true);
    setSelected(null);
    setImproving(null);
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    fd.append('job_description', jobDescription);
    try {
      const res = await fetch('http://localhost:8000/api/screen', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Screening failed.'); }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Could not reach the backend. Make sure the server is running.');
    } finally { setLoading(false); }
  }

  async function handleRetrain() {
    setRetraining(true);
    try {
      const r = await fetch('http://localhost:8000/api/train', { method: 'POST' });
      if (r.ok) { setTrainMsg('Model retrained.'); setTimeout(() => setTrainMsg(''), 3000); }
    } catch { setError('Could not retrain model.'); }
    finally { setRetraining(false); }
  }

  /* ── Improvement mode ────────────────────────────────────── */
  if (improving) {
    return (
      <div className="app-wrap">
        <header className="app-header">
          <button
            className="logo"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            onClick={() => setImproving(null)}
          >
            <div className="logo-mark"><FileSearch size={16} /></div>
            <span className="logo-name">ResumeAI</span>
          </button>
          <div className="header-right">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setImproving(null)}
              style={{ gap: 5 }}
            >
              ← Back to results
            </button>
          </div>
        </header>
        <ImprovementPanel
          candidate={improving}
          jobDescription={jobDescription}
          onBack={() => setImproving(null)}
        />
      </div>
    );
  }

  /* ── Main screen ─────────────────────────────────────────── */
  return (
    <div className="app-wrap">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark"><FileSearch size={16} /></div>
          <span className="logo-name">ResumeAI</span>
          <span className="logo-tagline">· ML-powered screening</span>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {apiOnline ? (
            <div className="status-pill online">
              <div className="status-dot online" />
              API online
            </div>
          ) : (
            <div className="status-pill offline">
              <div className="status-dot offline" />
              API offline
            </div>
          )}
        </div>
      </header>

      <div className="main-layout">
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside>
          <div className="card">
            <div className="card-header-bar">
              <p className="card-title">New Screening</p>
              <p className="card-subtitle">Upload resumes and a job description to rank and classify candidates.</p>
            </div>
            <div className="card-padded">
              <form onSubmit={handleScreen}>
                <div className="field-group">
                  <label className="field-label">Job Description</label>
                  <textarea
                    className="field-input"
                    placeholder="Paste the role description, required skills, and experience here…"
                    value={jobDescription}
                    onChange={e => setJobDesc(e.target.value)}
                  />
                </div>

                <ResumeDropzone files={files} setFiles={setFiles} />

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: 12, marginTop: 4 }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                )}

                {trainMsg && (
                  <div className="alert alert-success" style={{ marginBottom: 12, marginTop: 4 }}>
                    <span>{trainMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !files.length}
                  style={{ marginBottom: 8, marginTop: 4 }}
                >
                  {loading
                    ? <><div className="spinner spinner-sm" /> Analysing…</>
                    : <><Play size={13} fill="currentColor" /> Analyse Candidates</>
                  }
                </button>

                {results.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={() => { setResults([]); setFiles([]); setError(''); }}
                    style={{ gap: 5 }}
                  >
                    <RefreshCw size={12} /> Clear &amp; start over
                  </button>
                )}
              </form>

              <hr className="divider" />

              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={handleRetrain}
                disabled={retraining}
                style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}
              >
                {retraining
                  ? <><div className="spinner spinner-sm" /> Training…</>
                  : <><RotateCw size={12} /> Retrain ML model</>
                }
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content area ──────────────────────────────────── */}
        <main>
          {loading && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14 }}>
              <div className="spinner spinner-md" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.875rem' }}>Processing resumes…</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Running ML classification and skills extraction</p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
              <div className="empty-state">
                <div className="empty-icon"><FileSearch size={22} /></div>
                <p className="empty-heading">No results yet</p>
                <p className="empty-sub">
                  Upload one or more resumes and paste a job description, then click <strong>Analyse Candidates</strong>.
                  You'll get a ranked list with ML-predicted roles and a skills gap breakdown.
                </p>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Dashboard results={results} />
              <ResultList
                results={results}
                onSelectCandidate={setSelected}
                onImprove={setImproving}
              />
            </div>
          )}
        </main>
      </div>

      {selected && (
        <DetailModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onImprove={(c) => { setSelected(null); setImproving(c); }}
        />
      )}
    </div>
  );
}
