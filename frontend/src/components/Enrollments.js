import React, { useEffect, useState } from 'react';
import { getEnrollments, getStudents, getSections, createEnrollment, dropEnrollment } from '../api';

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student: '', section: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('enrolled');

  const load = () => {
    setLoading(true);
    Promise.all([
      getEnrollments({ status: filterStatus }),
      getStudents(),
      getSections()
    ])
      .then(([enr, stu, sec]) => {
        setEnrollments(enr.data);
        setStudents(stu.data);
        setSections(sec.data);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]); // eslint-disable-line

  const openEnroll = () => {
    setForm({ student: '', section: '' });
    setError(''); setShowModal(true);
  };

  const handleEnroll = async () => {
    if (!form.student || !form.section) { setError('Please select both student and section.'); return; }
    setSaving(true); setError('');
    try {
      await createEnrollment({ student: parseInt(form.student), section: parseInt(form.section) });
      setSuccess('Student enrolled successfully!');
      setShowModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const msgs = Object.values(data.errors).flat().join(' ');
        setError(msgs);
      } else if (data?.non_field_errors) {
        setError(data.non_field_errors.join(' '));
      } else if (typeof data === 'object') {
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Enrollment failed.');
      }
    } finally { setSaving(false); }
  };

  const handleDrop = async (id, studentName) => {
    if (!window.confirm(`Drop enrollment for ${studentName}?`)) return;
    try {
      await dropEnrollment(id);
      setSuccess(`Enrollment dropped for ${studentName}.`);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to drop enrollment.'); }
  };

  const availableSections = sections.filter(s => !s.is_full);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollments</h1>
          <p className="page-subtitle">Enroll students into sections</p>
        </div>
        <button className="btn btn-primary" onClick={openEnroll}>+ Enroll Student</button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && !showModal && <div className="alert alert-error">⚠ {error}</div>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['enrolled', 'dropped'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(s)}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading enrollments...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{filterStatus === 'enrolled' ? 'Active' : 'Dropped'} Enrollments</span>
            <span className={`badge ${filterStatus === 'enrolled' ? 'badge-green' : 'badge-red'}`}>
              {enrollments.length} records
            </span>
          </div>
          <div className="table-wrap">
            {enrollments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <div className="empty-text">No {filterStatus} enrollments found.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Subject</th>
                    <th>Section</th>
                    <th>Units</th>
                    <th>Status</th>
                    <th>Enrolled At</th>
                    {filterStatus === 'enrolled' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e.id}>
                      <td>{e.student_details?.full_name}</td>
                      <td><span className="badge badge-blue">{e.student_details?.student_id}</span></td>
                      <td>
                        <span className="badge badge-purple">
                          {e.section_details?.subject_details?.subject_code}
                        </span>
                      </td>
                      <td><span className="badge badge-green">{e.section_details?.section_name}</span></td>
                      <td>{e.section_details?.subject_details?.units} units</td>
                      <td>
                        <span className={`badge ${e.status === 'enrolled' ? 'badge-green' : 'badge-red'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(e.enrolled_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      {filterStatus === 'enrolled' && (
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDrop(e.id, e.student_details?.full_name)}
                          >
                            Drop
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Enroll Student</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select className="form-select" value={form.student}
                  onChange={e => setForm({ ...form, student: e.target.value })}>
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.student_id} — {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Select Section</label>
                <select className="form-select" value={form.section}
                  onChange={e => setForm({ ...form, section: e.target.value })}>
                  <option value="">-- Choose Section --</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject_details?.subject_code} — {s.section_name}
                      {' '}({s.enrolled_count}/{s.max_students} enrolled)
                      {s.schedule ? ` • ${s.schedule}` : ''}
                    </option>
                  ))}
                </select>
                {availableSections.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--accent3)', marginTop: '6px' }}>
                    ⚠ All sections are currently full.
                  </p>
                )}
              </div>

              <div style={{
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                padding: '12px 14px', fontSize: '12px', color: 'var(--text2)'
              }}>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                  Enrollment Rules:
                </strong>
                <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Duplicate enrollment in the same section is not allowed</li>
                  <li>A student can only enroll in one section per subject</li>
                  <li>Full sections cannot accept new enrollments</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleEnroll} disabled={saving}>
                {saving ? 'Enrolling...' : '✓ Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
