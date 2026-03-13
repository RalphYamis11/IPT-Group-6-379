import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => setError('Failed to load dashboard stats. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading"><div className="spinner" /> Loading dashboard...</div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of the enrollment system</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">◈</div>
            <div className="stat-value">{stats.total_students}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">◉</div>
            <div className="stat-value">{stats.total_subjects}</div>
            <div className="stat-label">Total Subjects</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">◫</div>
            <div className="stat-value">{stats.total_sections}</div>
            <div className="stat-label">Total Sections</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-icon">◎</div>
            <div className="stat-value">{stats.active_enrollments}</div>
            <div className="stat-label">Active Enrollments</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">◑</div>
            <div className="stat-value">{stats.full_sections}</div>
            <div className="stat-label">Full Sections</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">System Info</span>
        </div>
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            ['Backend', 'Django 4.2 + Django REST Framework', 'blue'],
            ['Frontend', 'React 18 + Axios', 'purple'],
            ['Database', 'SQLite (development)', 'green'],
            ['CORS', 'Enabled by use of django-cors-headers', 'yellow'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className={`badge badge-${color}`}>{label}</span>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
