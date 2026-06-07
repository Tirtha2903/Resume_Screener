import React, { useState } from 'react';
import { Mail, Phone, ExternalLink, SlidersHorizontal, Search, ArrowUpDown } from 'lucide-react';

export default function ResultList({ results, onSelectCandidate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');

  // Extract all unique categories present in the results for the filter dropdown
  const uniqueCategories = ['All', ...new Set(results.map(r => r.category))];

  // Filtering Logic
  const filteredResults = results.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = categoryFilter === 'All' || candidate.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Sorting Logic
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'score-desc') return b.match_score - a.match_score;
    if (sortBy === 'score-asc') return a.match_score - b.match_score;
    if (sortBy === 'confidence-desc') return b.confidence - a.confidence;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 2' }}>
      <div className="results-header">
        <h2 className="card-title">
          <SlidersHorizontal size={18} style={{ color: 'var(--color-primary)' }} />
          Screening Analysis
        </h2>
        
        <div className="filter-bar">
          {/* Search box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search candidate/skill..."
              className="select-input"
              style={{ paddingLeft: '28px', width: '200px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select 
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Profiles</option>
            {uniqueCategories.filter(cat => cat !== 'All').map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sorting Option */}
          <select 
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score-desc">Score: High to Low</option>
            <option value="score-asc">Score: Low to High</option>
            <option value="confidence-desc">Confidence: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      {sortedResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No candidates match your search filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Table Header for Desktop */}
          <div className="candidate-row" style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: 'none', 
            cursor: 'default',
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.5px'
          }}>
            <div>Candidate Info</div>
            <div>ML Predicted Field</div>
            <div>Prediction Conf.</div>
            <div>JD Fit Score</div>
            <div style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Inspection</div>
          </div>

          <div className="candidate-list">
            {sortedResults.map((candidate, idx) => (
              <div 
                key={idx} 
                className="candidate-row animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => onSelectCandidate(candidate)}
              >
                {/* Candidate Column */}
                <div className="candidate-profile">
                  <div className="candidate-name">{candidate.name}</div>
                  <div className="candidate-contact">
                    <Mail size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.email}</span>
                  </div>
                </div>

                {/* Category Column */}
                <div>
                  <span className="category-tag">{candidate.category}</span>
                </div>

                {/* Prediction Confidence */}
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  {candidate.confidence}%
                </div>

                {/* Match Score */}
                <div className={`score-badge ${getScoreClass(candidate.match_score)}`}>
                  <div className={`score-circle ${getScoreClass(candidate.match_score)}`}>
                    {Math.round(candidate.match_score)}
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>Match</span>
                </div>

                {/* Action Column */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCandidate(candidate);
                    }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Details
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
