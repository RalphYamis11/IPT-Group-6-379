import React, { useEffect, useState } from 'react';
import { getSummaries } from '../api';

export default function Summary() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [viewMode, setViewMode] = useState('cards'); // cards | table
  const [sortBy, setSortBy] = useState('name'); // name | id | units
  const [loadFilter, setLoadFilter] = useState('all'); // all | full | partial | none

  useEffect(() => {
    getSummaries()
      .then(res => setSummaries(res.data))
      .catch(() => setError('Failed to load summaries.'))
      .finally(() => setLoading(false));
  }, []);

  // ─── Filtering ─────────────────────────────────────────
  const filtered = summaries.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase());

    const matchesLoad =
      loadFilter === 'all' ||
      (loadFilter === 'full' && s.total_enrolled_units >= 18) ||
      (loadFilter === 'partial' && s.total_enrolled_units > 0 && s.total_enrolled_units < 18) ||
      (loadFilter === 'none' && s.total_enrolled_units === 0);

    return matchesSearch && matchesLoad;
  });

  // ─── Sorting ───────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'id') return a.student_id.localeCompare(b.student_id);
    if (sortBy === 'units') return b.total_enrolled_units - a.total_enrolled_units;
    return 0;
  });

  // ─── Helpers ───────────────────────────────────────────
  const loadBadge = units => {
    if (units >= 18) return { text: 'Full Load', cls: 'badge-green' };
    if (units > 0) return { text: 'Partial', cls: 'badge-yellow' };
    return { text: 'Not Enrolled', cls: 'badge-red' };
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollment Summary</h1>
          <p className="page-subtitle">Per-student subject and unit breakdown</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          className="form-input"
          placeholder="Search by name or student ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />

        <select className="form-input" onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="id">Sort by ID</option>
          <option value="units">Sort by Units</option>
        </select>

        <select className="form-input" onChange={e => setLoadFilter(e.target.value)}>
          <option value="all">All Loads</option>
          <option value="full">Full Load</option>
          <option value="partial">Partial</option>
          <option value="none">Not Enrolled</option>
        </select>

        <div>
          <button
            className={`btn ${viewMode === 'cards' ? 'btn-primary' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
          <button
            className={`btn ${viewMode === 'table' ? 'btn-primary' : ''}`}
            onClick={() => setViewMode('table')}
            style={{ marginLeft: '6px' }}
          >
            Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading summaries...</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">No matching students found.</div>
      ) : viewMode === 'cards' ? (
        <div className="summary-grid">
          {sorted.map(student => {
            const badge = loadBadge(student.total_enrolled_units);

            return (
              <div className="summary-card" key={student.id}>
                <div className="summary-card-header">
                  <div>
                    <div className="summary-student-name">{student.full_name}</div>
                    <div className="summary-student-id">{student.student_id} · {student.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="summary-units">{student.total_enrolled_units}</div>
                    <div className="summary-units-label">Units</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{student.total_subjects} subjects</span>
                  <span className={`badge ${badge.cls}`}>{badge.text}</span>
                </div>

                {student.enrolled_subjects.length === 0 ? (
                  <div className="empty-mini">No active enrollments</div>
                ) : (
                  <div className="subject-list">
                    {student.enrolled_subjects.map(sub => (
                      <div className="subject-item" key={sub.enrollment_id}>
                        <div style={{ flex: 1 }}>
                          <div className="subject-code">{sub.subject_code}</div>
                          <div className="subject-name">{sub.subject_name}</div>

                          {sub.subject_type && (
                            <span className="badge badge-purple">{sub.subject_type}</span>
                          )}

                          {sub.room && <div className="subject-meta">Room: {sub.room}</div>}
                          {sub.instructor && (
                            <div className="subject-meta">Instructor: {sub.instructor}</div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div className="subject-section">Sec {sub.section}</div>
                          <span className="badge badge-blue">{sub.units} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Units</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const badge = loadBadge(s.total_enrolled_units);
              return (
                <tr key={s.id}>
                  <td>{s.student_id}</td>
                  <td>{s.full_name}</td>
                  <td>{s.total_enrolled_units}</td>
                  <td><span className={`badge ${badge.cls}`}>{badge.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}