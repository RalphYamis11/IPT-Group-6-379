import React, { useEffect, useState } from 'react';
import { getSections, getSubjects, createSection, updateSection, deleteSection } from '../api';

const EMPTY_FORM = { section_name: '', subject: '', max_students: 30, schedule: '', instructor: '' };

function CapacityBar({ enrolled, max }) {
  const pct = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;
  const cls = pct >= 100 ? 'high' : pct >= 70 ? 'mid' : 'low';
  return (
    <div className="capacity-bar">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`bar-fill ${cls}`} style={{ display: 'none' }} />
      <span className="bar-label">{enrolled}/{max}</span>
    </div>
  );
}

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSections(), getSubjects()])
      .then(([sec, sub]) => { setSections(sec.data); setSubjects(sub.data); })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, subject: subjects[0]?.id || '' });
    setError(''); setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      section_name: s.section_name, subject: s.subject,
      max_students: s.max_students, schedule: s.schedule || '', instructor: s.instructor || ''
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.section_name || !form.subject) { setError('Section name and subject are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) { await updateSection(editing.id, form); setSuccess('Section updated.'); }
      else { await createSection(form); setSuccess('Section created.'); }
      setShowModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'An error occurred.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await deleteSection(id);
      setSuccess('Section deleted.'); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete section.'); }
  };

  const getCapacityColor = (section) => {
    const pct = section.enrolled_count / section.max_students;
    if (pct >= 1) return 'badge-red';
    if (pct >= 0.7) return 'badge-yellow';
    return 'badge-green';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sections</h1>
          <p className="page-subtitle">Manage class sections per subject</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Section</button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && !showModal && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading sections...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Sections</span>
            <span className="badge badge-green">{sections.length} total</span>
          </div>
          <div className="table-wrap">
            {sections.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◫</div>
                <div className="empty-text">No sections yet. Create sections for your subjects.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Instructor</th>
                    <th>Schedule</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-green">{s.section_name}</span></td>
                      <td>
                        <div>
                          <span className="badge badge-purple" style={{ marginBottom: '3px' }}>
                            {s.subject_details?.subject_code}
                          </span>
                          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                            {s.subject_details?.name}
                          </div>
                        </div>
                      </td>
                      <td>{s.instructor || <span style={{ color: 'var(--text3)' }}>TBA</span>}</td>
                      <td>{s.schedule || <span style={{ color: 'var(--text3)' }}>TBA</span>}</td>
                      <td>
                        <div className="capacity-bar">
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${s.enrolled_count / s.max_students >= 1 ? 'high' : s.enrolled_count / s.max_students >= 0.7 ? 'mid' : 'low'}`}
                              style={{ width: `${Math.min((s.enrolled_count / s.max_students) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="bar-label">{s.enrolled_count}/{s.max_students}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getCapacityColor(s)}`}>
                          {s.is_full ? 'Full' : `${s.available_slots} slots`}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                        </div>
                      </td>
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
              <span className="modal-title">{editing ? 'Edit Section' : 'Create Section'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section Name</label>
                  <input className="form-input" placeholder="e.g. A, B, Section-1"
                    value={form.section_name} onChange={e => setForm({ ...form, section_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Students</label>
                  <input className="form-input" type="number" min="1"
                    value={form.max_students} onChange={e => setForm({ ...form, max_students: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={form.subject}
                  onChange={e => setForm({ ...form, subject: parseInt(e.target.value) })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_code} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Instructor (optional)</label>
                <input className="form-input" placeholder="e.g. Prof. Santos"
                  value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Schedule (optional)</label>
                <input className="form-input" placeholder="e.g. MWF 8:00-9:30 AM"
                  value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
