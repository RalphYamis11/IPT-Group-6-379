import React, { useEffect, useState } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api';

const EMPTY_FORM = {
  student_id: '', first_name: '', middle_name: '', last_name: '',
  email: '', contact_number: '', gender: '',
  year_level: 1, course: ''
};

const YEAR_LEVELS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const GENDERS = [
  { value: '',  label: 'Prefer not to say' },
  { value: 'M', label: 'Male'   },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other'  },
];

export default function Students() {
  const [allStudents, setAllStudents] = useState([]);   // full unfiltered list
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [filterYear, setFilterYear]   = useState('');

  // Always load ALL students, filter client-side
  const load = () => {
    setLoading(true);
    getStudents()
      .then(res => setAllStudents(res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Client-side filter — always correct, no backend dependency
  const students = allStudents.filter(s => {
    const matchYear   = !filterYear || s.year_level === parseInt(filterYear);
    const matchSearch = !search || (
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
    return matchYear && matchSearch;
  });

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      student_id:     s.student_id,
      first_name:     s.first_name,
      middle_name:    s.middle_name    || '',
      last_name:      s.last_name,
      email:          s.email,
      contact_number: s.contact_number || '',
      gender:         s.gender         || '',
      year_level:     s.year_level,
      course:         s.course         || '',
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.first_name || !form.last_name || !form.email) {
      setError('Student ID, name, and email are required.'); return;
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
      setError(data ? Object.values(data).flat().join(' ') : 'An error occurred.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? Their enrollments will also be removed.')) return;
    try {
      await deleteStudent(id);
      setSuccess('Student deleted.');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete student.'); }
  };

  const yearBadgeColor = (year) => {
    const colors = { 1: 'badge-green', 2: 'badge-blue', 3: 'badge-purple', 4: 'badge-yellow' };
    return colors[year] || 'badge-blue';
  };

  const genderLabel = (g) => ({ M: 'Male', F: 'Female', O: 'Other' }[g] || '—');

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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select className="form-select" value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          style={{ maxWidth: '160px' }}>
          <option value="">All Year Levels</option>
          {YEAR_LEVELS.map(y => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>
      </div>

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
                <div className="empty-icon">👥</div>
                <div className="empty-text">
                  {filterYear || search ? 'No students match your filter.' : 'No students yet. Add one to get started.'}
                </div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Gender</th>
                    <th>Course</th>
                    <th>Year Level</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Units</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-blue">{s.student_id}</span></td>
                      <td>{s.full_name}</td>
                      <td>{genderLabel(s.gender)}</td>
                      <td>{s.course || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                      <td>
                        <span className={`badge ${yearBadgeColor(s.year_level)}`}>
                          {s.year_level_display}
                        </span>
                      </td>
                      <td>{s.contact_number || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
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
                  <label className="form-label">Year Level</label>
                  <select className="form-select" value={form.year_level}
                    onChange={e => setForm({ ...form, year_level: parseInt(e.target.value) })}>
                    {YEAR_LEVELS.map(y => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" placeholder="Juan"
                    value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Dela Cruz"
                    value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Middle Name (optional)</label>
                  <input className="form-input" placeholder="Santos"
                    value={form.middle_name} onChange={e => setForm({ ...form, middle_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}>
                    {GENDERS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="juan@school.edu"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number (optional)</label>
                  <input className="form-input" placeholder="09XX-XXX-XXXX"
                    value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Course (optional)</label>
                <input className="form-input" placeholder="e.g. BS Information Technology"
                  value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
