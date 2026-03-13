import React, { useEffect, useState } from 'react';
import { getSummaries } from '../api';

export default function Summary() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSummaries()
      .then(res => setSummaries(res.data))
      .catch(() => setError('Failed to load summaries.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = summaries.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollment Summary</h1>
          <p className="page-subtitle">Per-student subject and unit breakdown</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div style={{ marginBottom: '24px' }}>
        <input
          className="form-input"
          placeholder="Search by name or student ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading summaries...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◑</div>
          <div className="empty-text">
            {search ? 'No students match your search.' : 'No enrollment data found.'}
          </div>
        </div>
      ) : (
        <div className="summary-grid">
          {filtered.map(student => (
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
                <span className={`badge ${student.total_enrolled_units >= 18 ? 'badge-green' : student.total_enrolled_units > 0 ? 'badge-yellow' : 'badge-red'}`}>
                  {student.total_enrolled_units >= 18 ? 'Full Load' : student.total_enrolled_units > 0 ? 'Partial' : 'Not Enrolled'}
                </span>
              </div>

              {student.enrolled_subjects.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                  No active enrollments
                </div>
              ) : (
                <div className="subject-list">
                  {student.enrolled_subjects.map(sub => (
                    <div className="subject-item" key={sub.enrollment_id}>
                      <div style={{ flex: 1 }}>
                        <div className="subject-code">{sub.subject_code}</div>
                        <div className="subject-name">{sub.subject_name}</div>
                        {sub.schedule && (
                          <div className="subject-section" style={{ marginTop: '2px' }}>
                            {sub.schedule}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="subject-section">Sec {sub.section}</div>
                        <span className="badge badge-blue" style={{ marginTop: '4px' }}>
                          {sub.units} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
