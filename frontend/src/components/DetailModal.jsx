import React from 'react';
import { X, Mail, Phone, Tag, CheckCircle2, AlertTriangle, BadgePlus, FileText } from 'lucide-react';

export default function DetailModal({ candidate, onClose }) {
  if (!candidate) return null;

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--color-success)';
    if (score >= 40) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const { matched_skills, missing_skills, additional_skills } = candidate.analysis;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {candidate.name}
            </h2>
            <span className="category-tag" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              {candidate.category} ({candidate.confidence}% confidence)
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Contact Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div className="detail-section">
            <span className="detail-label">Email</span>
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{candidate.email}</span>
            </div>
          </div>
          <div className="detail-section">
            <span className="detail-label">Phone</span>
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={14} style={{ color: 'var(--color-accent)' }} />
              <span>{candidate.phone}</span>
            </div>
          </div>
        </div>

        {/* Fit Score */}
        <div className="detail-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="detail-label">Job Description Fit Score</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(candidate.match_score) }}>
              {Math.round(candidate.match_score)}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div 
              className={`progress-bar-fill ${getScoreClass(candidate.match_score)}`}
              style={{ width: `${candidate.match_score}%` }}
            />
          </div>
        </div>

        {/* Skill Analytics */}
        <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span className="detail-label">Technical Skills Gap Analysis</span>
          
          {/* Matched Skills */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={14} />
              Matched Required Skills ({matched_skills.length})
            </h4>
            {matched_skills.length > 0 ? (
              <div className="skills-grid">
                {matched_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag matched">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No skills matched with JD criteria.</p>
            )}
          </div>

          {/* Missing Skills */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={14} />
              Missing Required Skills ({missing_skills.length})
            </h4>
            {missing_skills.length > 0 ? (
              <div className="skills-grid">
                {missing_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag missing">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Perfect match! No required skills missing.</p>
            )}
          </div>

          {/* Additional Skills */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <BadgePlus size={14} />
              Additional Candidate Skills ({additional_skills.length})
            </h4>
            {additional_skills.length > 0 ? (
              <div className="skills-grid">
                {additional_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag additional">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No additional tech skills identified.</p>
            )}
          </div>
        </div>

        {/* Text Preview */}
        <div className="detail-section">
          <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={14} />
            Parsed Resume Text Preview
          </span>
          <div className="text-preview-box">
            {candidate.text_preview}
          </div>
        </div>

      </div>
    </div>
  );
}
