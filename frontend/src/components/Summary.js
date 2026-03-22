import React, { useEffect, useState } from 'react';
import { getSummaries } from '../api';

const LOAD_STATUS = {
  'Full Load': { min: 18, color: 'badge-green' },
  'Partial': { min: 1, color: 'badge-yellow' },
  'Not Enrolled': { min: 0, color: 'badge-red' },
};

const getLoadStatus = (units) => {
  if (units >= 18) return 'Full Load';
  if (units > 0) return 'Partial';
  return 'Not Enrolled';
};

const TYPE_COLORS = { lecture: 'badge-blue', lab: 'badge-purple', pe: 'badge-green', nstp: 'badge-yellow' };
const TYPE_LABELS = { lecture: 'LEC', lab: 'LAB', pe: 'PE', nstp: 'NSTP' };

export default function Summary() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('student_id');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    getSummaries()
      .then(res => setSummaries(res.data))
      .catch(() => setError('Failed to load summaries.'))
      .finally(() => setLoading(false));
  }, []);

  let filtered = summaries.filter(s => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || getLoadStatus(s.total_enrolled_units) === filterStatus;
    return matchSearch && matchStatus;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'units') return b.total_enrolled_units - a.total_enrolled_units;
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
    return a.student_id.localeCompare(b.student_id);
  });

  const totalUnits = filtered.reduce((sum, s) => sum + s.total_enrolled_units, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollment Summary</h1>
          <p className="page-subtitle">Per-student subject and unit breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('cards')}
          >Cards</button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >Table</button>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Filters & Sort */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="Search by name, ID, or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: '160px' }}>
          <option value="">All Status</option>
          <option value="Full Load">Full Load</option>
          <option value="Partial">Partial</option>
          <option value="Not Enrolled">Not Enrolled</option>
        </select>
        <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ maxWidth: '160px' }}>
          <option value="student_id">Sort: Student ID</option>
          <option value="name">Sort: Name</option>
          <option value="units">Sort: Units (High)</option>
        </select>
        {filtered.length > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: 'auto' }}>
            {filtered.length} students · {totalUnits} total units
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading summaries...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◑</div>
          <div className="empty-text">
            {search || filterStatus ? 'No students match your filters.' : 'No enrollment data found.'}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="summary-grid">
          {filtered.map(student => {
            const loadStatus = getLoadStatus(student.total_enrolled_units);
            return (
              <div className="summary-card" key={student.id}>
                <div className="summary-card-header">
                  <div>
                    <div className="summary-student-name">{student.full_name}</div>
                    <div className="summary-student-id">
                      {student.student_id}
                      {student.course && ` · ${student.course}`}
                      {student.year_level_display && ` · ${student.year_level_display}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="summary-units">{student.total_enrolled_units}</div>
                    <div className="summary-units-label">Units</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{student.total_subjects} subjects</span>
                  <span className={`badge ${LOAD_STATUS[loadStatus]?.color}`}>{loadStatus}</span>
                  
                </div>

                {student.enrolled_subjects.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                    No active enrollments
                  </div>
                ) : (
                  <div className="subject-list">
                    {student.enrolled_subjects.map(sub => (
                      <div className="subject-item" key={sub.enrollment_id}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="subject-code">{sub.subject_code}</span>
                            <span className={`badge ${TYPE_COLORS[sub.subject_type]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                              {TYPE_LABELS[sub.subject_type]}
                            </span>
                          </div>
                          <div className="subject-name">{sub.subject_name}</div>
                          <div className="subject-section">
                            Sec {sub.section}
                            {sub.room && ` · ${sub.room}`}
                            {sub.schedule && ` · ${sub.schedule}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="badge badge-blue">{sub.units} u</span>
                          {sub.instructor && (
                            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                              {sub.instructor}
                            </div>
                          )}
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
        // Table view
        <div className="card">
          <div className="card-header">
            <span className="card-title">Enrollment Summary Table</span>
            <span className="badge badge-blue">{filtered.length} students</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Course / Year</th>
                  <th>Subjects</th>
                  <th>Total Units</th>
                  <th>Load Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const loadStatus = getLoadStatus(s.total_enrolled_units);
                  return (
                    <tr key={s.id}>
                      <td><span className="badge badge-blue">{s.student_id}</span></td>
                      <td>{s.full_name}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{s.course || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.year_level_display}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.enrolled_subjects.map(sub => (
                            <span key={sub.enrollment_id} className="badge badge-purple" style={{ fontSize: '10px' }}>
                              {sub.subject_code}
                            </span>
                          ))}
                          {s.enrolled_subjects.length === 0 && <span style={{ color: 'var(--text3)' }}>None</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">{s.total_enrolled_units} units</span>
                      </td>
                      <td>
                        <span className={`badge ${LOAD_STATUS[loadStatus]?.color}`}>{loadStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
