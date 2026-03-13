import React, { useEffect, useState } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api';

const EMPTY_FORM = { student_id: '', first_name: '', last_name: '', email: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getStudents()
      .then(res => setStudents(res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ student_id: s.student_id, first_name: s.first_name, last_name: s.last_name, email: s.email });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.first_name || !form.last_name || !form.email) {
      setError('All fields are required.'); return;
    }
    setSaving(true); setError('');
    try {
      if (editing) {
        await updateStudent(editing.id, form);
        setSuccess('Student updated successfully.');
      } else {
        await createStudent(form);
        setSuccess('Student added successfully.');
      }
      setShowModal(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(' ');
        setError(msgs);
      } else {
        setError('An error occurred.');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This will also remove their enrollments.')) return;
    try {
      await deleteStudent(id);
      setSuccess('Student deleted.');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete student.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage enrolled students</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Student</button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && !showModal && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading students...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Students</span>
            <span className="badge badge-blue">{students.length} total</span>
          </div>
          <div className="table-wrap">
            {students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <div className="empty-text">No students yet. Add one to get started.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Units Enrolled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-blue">{s.student_id}</span></td>
                      <td>{s.full_name}</td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`badge ${s.total_enrolled_units > 0 ? 'badge-green' : 'badge-yellow'}`}>
                          {s.total_enrolled_units} units
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
              <span className="modal-title">{editing ? 'Edit Student' : 'Add Student'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" placeholder="e.g. 2024-001"
                    value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" placeholder="Juan"
                    value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Dela Cruz"
                    value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="juan@school.edu"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
