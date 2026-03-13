import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api';

const EMPTY_FORM = { subject_code: '', name: '', units: 3, description: '' };

export default function Subjects() {
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
    getSubjects()
      .then(res => setSubjects(res.data))
      .catch(() => setError('Failed to load subjects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ subject_code: s.subject_code, name: s.name, units: s.units, description: s.description || '' });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.subject_code || !form.name) { setError('Subject code and name are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await updateSubject(editing.id, form);
        setSuccess('Subject updated.');
      } else {
        await createSubject(form);
        setSuccess('Subject added.');
      }
      setShowModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'An error occurred.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject? All its sections will also be deleted.')) return;
    try {
      await deleteSubject(id);
      setSuccess('Subject deleted.'); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete subject.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">Manage academic subjects</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Subject</button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && !showModal && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading subjects...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Subjects</span>
            <span className="badge badge-purple">{subjects.length} total</span>
          </div>
          <div className="table-wrap">
            {subjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◉</div>
                <div className="empty-text">No subjects yet. Add one to get started.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Units</th>
                    <th>Sections</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-purple">{s.subject_code}</span></td>
                      <td>{s.name}</td>
                      <td><span className="badge badge-blue">{s.units} units</span></td>
                      <td><span className="badge badge-green">{s.total_sections} sections</span></td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.description || <span style={{ color: 'var(--text3)' }}>—</span>}
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
              <span className="modal-title">{editing ? 'Edit Subject' : 'Add Subject'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject Code</label>
                  <input className="form-input" placeholder="e.g. CS101"
                    value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Units (1–6)</label>
                  <input className="form-input" type="number" min="1" max="6"
                    value={form.units} onChange={e => setForm({ ...form, units: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input className="form-input" placeholder="e.g. Introduction to Computing"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-textarea" rows={3} placeholder="Brief description..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
