import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Cpu, AlertTriangle, FileCheck, CheckCircle2, RotateCw } from 'lucide-react';
import ResumeDropzone from './components/ResumeDropzone';
import ResultList from './components/ResultList';
import DetailModal from './components/DetailModal';
import Dashboard from './components/Dashboard';

export default function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [error, setError] = useState('');
  const [isRetraining, setIsRetraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState('');

  // Check backend server status on load
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (response.ok) {
        setApiOnline(true);
        setError('');
      } else {
        setApiOnline(false);
      }
    } catch (err) {
      setApiOnline(false);
    }
  };

  const handleScreen = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one resume file.');
      return;
    }
    
    setError('');
    setLoading(true);
    setSelectedCandidate(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://localhost:8000/api/screen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to screen resumes.');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Error communicating with the screening server. Ensure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setTrainMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/train', {
        method: 'POST',
      });
      if (response.ok) {
        setTrainMessage('Model retrained successfully!');
        // Clear message after 3 seconds
        setTimeout(() => setTrainMessage(''), 3000);
      } else {
        setError('Failed to retrain model.');
      }
    } catch (err) {
      setError('Connection error occurred while training model.');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="app-container">
      {/* Premium Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Sparkles size={22} fill="currentColor" />
          </div>
          <div className="logo-text">
            <h1>Screener.AI</h1>
            <p>Machine Learning Resume Screener & Classifier</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {apiOnline ? (
            <div className="status-badge">
              <span className="status-indicator"></span>
              ML Core Online
            </div>
          ) : (
            <div className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span className="status-indicator" style={{ backgroundColor: 'var(--color-danger)', boxShadow: '0 0 8px var(--color-danger)' }}></span>
              Offline - Reconnecting
            </div>
          )}
        </div>
      </header>

      {/* Main content grid */}
      <main className="main-grid">
        {/* Sidebar Controls */}
        <section className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="card-title">
            <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
            Screener Engine
          </h2>

          <form onSubmit={handleScreen} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Job Description input */}
            <div className="form-group">
              <label className="form-label">Target Job Description (JD)</label>
              <textarea
                placeholder="Paste role responsibilities, required skills, and experience criteria here to calculate keyword alignment..."
                className="text-area-input"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Dropzone component */}
            <ResumeDropzone files={files} setFiles={setFiles} />

            {/* Error notifications */}
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--color-danger)', 
                fontSize: '0.8rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '8px'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Retrain model notice */}
            {trainMessage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--color-success)', 
                fontSize: '0.8rem',
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '8px'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{trainMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || files.length === 0}
            >
              {loading ? (
                <>
                  <RotateCw size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Processing Resumes...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Analyze Candidates
                </>
              )}
            </button>
          </form>

          {/* Auxiliary Operations */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isRetraining}
              onClick={handleRetrain}
            >
              {isRetraining ? 'Training System...' : 'Retrain ML Classification Model'}
            </button>
          </div>
        </section>

        {/* Content Panel */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignContent: 'start' }}>
          
          {loading && (
            <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '1.25rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                border: '4px solid rgba(99, 102, 241, 0.1)', 
                borderTopColor: 'var(--color-primary)', 
                borderRadius: '50%', 
                animation: 'spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite' 
              }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>Extracting Profile Metadata</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Running natural language parsing & predictive matching algorithms...
                </p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
              <div className="dashboard-empty">
                <div className="empty-icon">
                  <FileCheck size={28} />
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Ready for Screening</h3>
                <p style={{ maxWidth: '380px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Upload candidate resumes (PDF, DOCX, TXT) and enter a target Job Description to generate scores, predict categories, and extract key metrics.
                </p>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              {/* Analytics metrics & charts */}
              <Dashboard results={results} />
              
              {/* Table/Card breakdown */}
              <ResultList results={results} onSelectCandidate={setSelectedCandidate} />
            </>
          )}

        </section>
      </main>

      {/* Candidate detail drawer popup */}
      {selectedCandidate && (
        <DetailModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}

      {/* Embedded CSS animation helpers */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
