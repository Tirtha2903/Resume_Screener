import React, { useState } from 'react';
import { Mail, Search, Zap } from 'lucide-react';

function scoreClass(s) {
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  return 'low';
}

export default function ResultList({ results, onSelectCandidate, onImprove }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [sort, setSort] = useState('score-desc');

  const cats = ['All', ...new Set(results.map(r => r.category))];

  const filtered = results
    .filter(r => {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.skills.some(s => s.toLowerCase().includes(q))
      ) && (catFilter === 'All' || r.category === catFilter);
    })
    .sort((a, b) => {
      if (sort === 'score-desc') return b.satisfaction_score - a.satisfaction_score;
      if (sort === 'score-asc')  return a.satisfaction_score - b.satisfaction_score;
      if (sort === 'name-asc')   return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="card animate-in" style={{ gridColumn: 'span 2' }}>
      <div className="card-header-bar">
        <div className="results-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p className="card-title">Candidates</p>
            <span className="badge badge-gray">{filtered.length} of {results.length}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-wrap">
              <Search size={13} className="search-icon" />
              <input
                type="text"
                placeholder="Name or skill…"
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <select
              className="field-select"
              style={{ width: 'auto', padding: '6px 10px' }}
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Sort */}
            <select
              className="field-select"
              style={{ width: 'auto', padding: '6px 10px' }}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="score-desc">Score ↓</option>
              <option value="score-asc">Score ↑</option>
              <option value="name-asc">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.875rem' }}>
            No candidates match your filters.
          </p>
        ) : (
          <div className="candidate-table">
            {/* Header */}
            <div className="candidate-header">
              <span>Candidate</span>
              <span>Role</span>
              <span>Confidence</span>
              <span>Fit Score</span>
              <span>Skills Match</span>
              <span></span>
            </div>

            {/* Rows */}
            {filtered.map((r, i) => {
              const cls = scoreClass(r.satisfaction_score);
              const matchedCount = r.analysis.matched_skills.length;
              const totalJDSkills = matchedCount + r.analysis.missing_skills.length;

              return (
                <div
                  key={i}
                  className="candidate-row animate-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => onSelectCandidate(r)}
                >
                  {/* Name + email */}
                  <div>
                    <div className="cand-name">{r.name}</div>
                    <div className="cand-email">
                      <Mail size={11} />
                      {r.email}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="badge badge-brand">{r.category}</span>
                  </div>

                  {/* Confidence */}
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {r.confidence}%
                  </div>

                  {/* Fit score */}
                  <div>
                    <span className={`score-num ${cls}`}>{Math.round(r.satisfaction_score)}%</span>
                    <div className="progress-track" style={{ marginTop: 5, width: 70 }}>
                      <div className={`progress-fill ${cls}`} style={{ width: `${r.satisfaction_score}%` }} />
                    </div>
                  </div>

                  {/* Matched skills */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {totalJDSkills > 0 ? (
                      <>{matchedCount} / {totalJDSkills} skills</>
                    ) : (
                      <span style={{ color: 'var(--text-faint)' }}>No JD provided</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); onSelectCandidate(r); }}
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-light2)' }}
                      onClick={e => { e.stopPropagation(); onImprove(r); }}
                      title="Open improvement mode"
                    >
                      <Zap size={12} />
                      Improve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
