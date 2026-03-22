import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api';

const EMPTY_FORM = { subject_code: '', name: '', units: 3, subject_type: 'lecture', description: '', prerequisite: '' };

const TYPE_COLORS  = { lecture: 'badge-blue', lab: 'badge-purple', pe: 'badge-green', nstp: 'badge-yellow' };
const TYPE_LABELS  = { lecture: 'Lecture', lab: 'Laboratory', pe: 'PE', nstp: 'NSTP' };
const TYPE_BUTTONS = [
  { value: '',        label: 'All Types'  },
  { value: 'lecture', label: 'Lecture'    },
  { value: 'lab',     label: 'Laboratory' },
  { value: 'pe',      label: 'PE'         },
  { value: 'nstp',    label: 'NSTP'       },
];

export default function Subjects() {
  const [subjects, setSubjects]   = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // keep full list for client-side filter
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [filterType, setFilterType] = useState('');

  // Always load ALL subjects, then filter client-side to avoid empty-type mismatch
  const load = () => {
    setLoading(true);
    getSubjects()
      .then(res => {
        setAllSubjects(res.data);
        setSubjects(res.data);
      })
      .catch(() => setError('Failed to load subjects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTypeFilter = (val) => {
    setFilterType(val);
    if (!val) {
      setSubjects(allSubjects);
    } else {
      // Match subject_type OR treat empty/null as 'lecture'
      setSubjects(allSubjects.filter(s => (s.subject_type || 'lecture') === val));
    }
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
        setSuccess('Subject updated successfully.');
      } else {
        await createSubject(payload);
        setSuccess('Subject added successfully.');
      }
      setShowModal(false);
      setFilterType('');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) =>
          Array.isArray(v) ? v.join(' ') : String(v)
        ).join(' ');
        setError(msgs || 'Update failed. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
      // Keep modal open so user can see the error
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject? All its sections will also be deleted.')) return;
    try {
      await deleteSubject(id);
      setSuccess('Subject deleted.'); load(); setFilterType('');
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

      {/* Type Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TYPE_BUTTONS.map(t => (
          <button
            key={t.value}
            className={`btn btn-sm ${filterType === t.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTypeFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading subjects...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Subjects</span>
            <span className="badge badge-blue">{subjects.length} total</span>
          </div>
          <div className="table-wrap">
            {subjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <div className="empty-text">No subjects found for this type.</div>
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
                  {subjects.map(s => {
                    const sType = s.subject_type || 'lecture';
                    return (
                      <tr key={s.id}>
                        <td><span className="badge badge-blue">{s.subject_code}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                          {s.description && (
                            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                              {s.description.length > 55 ? s.description.slice(0, 55) + '…' : s.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${TYPE_COLORS[sType] || 'badge-blue'}`}>
                            {TYPE_LABELS[sType] || sType}
                          </span>
                        </td>
                        <td><span className="badge badge-navy">{s.units} units</span></td>
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
                    );
                  })}
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
                    {allSubjects.filter(s => !editing || s.id !== editing.id).map(s => (
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
