import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api';

const EMPTY_FORM = { subject_code: '', name: '', units: 3, subject_type: 'lecture', description: '', prerequisite: '' };

const TYPE_COLORS = {
  lecture: 'badge-blue',
  lab: 'badge-purple',
  pe: 'badge-green',
  nstp: 'badge-yellow',
};

const TYPE_LABELS = {
  lecture: 'Lecture',
  lab: 'Laboratory',
  pe: 'PE',
  nstp: 'NSTP',
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');

  const load = (typeFilter = filterType) => {
    setLoading(true);
    const params = typeFilter ? { type: typeFilter } : {};
    getSubjects(params)
      .then(res => setSubjects(res.data))
      .catch(() => setError('Failed to load subjects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleTypeFilter = (val) => {
    setFilterType(val);
    load(val);
  };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      subject_code: s.subject_code, name: s.name, units: s.units,
      subject_type: s.subject_type || 'lecture',
      description: s.description || '',
      prerequisite: s.prerequisite || '',
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.subject_code || !form.name) { setError('Subject code and name are required.'); return; }
    setSaving(true); setError('');
    const payload = { ...form };
    if (!payload.prerequisite) delete payload.prerequisite;
    try {
      if (editing) {
        await updateSubject(editing.id, payload);
        setSuccess('Subject updated.');
      } else {
        await createSubject(payload);
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

  const typeButtons = ['', 'lecture', 'lab', 'pe', 'nstp'];

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

      {/* Type Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {typeButtons.map(t => (
          <button
            key={t}
            className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTypeFilter(t)}
          >
            {t === '' ? 'All Types' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

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
                <div className="empty-text">No subjects found.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Sections</th>
                    <th>Prerequisite</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-purple">{s.subject_code}</span></td>
                      <td>
                        <div>{s.name}</div>
                        {s.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                            {s.description.length > 50 ? s.description.slice(0, 50) + '…' : s.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${TYPE_COLORS[s.subject_type] || 'badge-blue'}`}>
                          {TYPE_LABELS[s.subject_type] || s.subject_type}
                        </span>
                      </td>
                      <td><span className="badge badge-blue">{s.units} units</span></td>
                      <td><span className="badge badge-green">{s.total_sections} sections</span></td>
                      <td>
                        {s.prerequisite_details
                          ? <span className="badge badge-yellow">{s.prerequisite_details?.subject_code}</span>
                          : <span style={{ color: 'var(--text3)' }}>None</span>}
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.subject_type}
                    onChange={e => setForm({ ...form, subject_type: e.target.value })}>
                    <option value="lecture">Lecture</option>
                    <option value="lab">Laboratory</option>
                    <option value="pe">Physical Education</option>
                    <option value="nstp">NSTP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Prerequisite (optional)</label>
                  <select className="form-select" value={form.prerequisite}
                    onChange={e => setForm({ ...form, prerequisite: e.target.value })}>
                    <option value="">None</option>
                    {subjects.filter(s => !editing || s.id !== editing.id).map(s => (
                      <option key={s.id} value={s.id}>{s.subject_code} — {s.name}</option>
                    ))}
                  </select>
                </div>
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
