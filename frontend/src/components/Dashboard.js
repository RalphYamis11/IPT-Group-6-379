import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../api';

const Icons = {
  students: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  subjects: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  sections: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  enrollments: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  dropped: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  available: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

const STAT_CARDS = [
  { key: 'total_students',      label: 'Total Students',      color: 'blue',   icon: 'students'    },
  { key: 'total_subjects',      label: 'Total Subjects',      color: 'purple', icon: 'subjects'    },
  { key: 'total_sections',      label: 'Total Sections',      color: 'yellow', icon: 'sections'    },
  { key: 'active_enrollments',  label: 'Active Enrollments',  color: 'green',  icon: 'enrollments' },
  { key: 'dropped_enrollments', label: 'Dropped Enrollments', color: 'red',    icon: 'dropped'     },
  { key: 'available_sections',  label: 'Available Sections',  color: 'blue',   icon: 'available'   },
];

const ICON_COLORS = {
  blue:   'var(--navy)',
  purple: 'var(--purple)',
  yellow: 'var(--gold-dark)',
  green:  'var(--green)',
  red:    'var(--red)',
};

const MiniBar = ({ value, total, color, label }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '80px', fontSize: '13px', color: 'var(--text2)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '7px', background: 'var(--light)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ width: '60px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
        {value} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text3)' }}>({pct}%)</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => setError('Failed to load dashboard. Make sure the backend is running on port 8000.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">System overview at a glance</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            {STAT_CARDS.map(card => (
              <div key={card.key} className={`stat-card ${card.color}`}>
                <div className="stat-icon" style={{ color: ICON_COLORS[card.color] }}>
                  {Icons[card.icon]}
                </div>
                <div className="stat-value">{stats[card.key] ?? 0}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>

            {/* Year Level Breakdown */}
            {stats.year_breakdown && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Students by Year Level</span>
                  <span className="badge badge-blue">{stats.total_students} total</span>
                </div>
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { key: 'year_1', label: '1st Year', color: 'var(--green)'  },
                    { key: 'year_2', label: '2nd Year', color: 'var(--navy)'   },
                    { key: 'year_3', label: '3rd Year', color: 'var(--purple)' },
                    { key: 'year_4', label: '4th Year', color: 'var(--gold)'   },
                  ].map(({ key, label, color }) => (
                    <MiniBar key={key} label={label} value={stats.year_breakdown[key] || 0} total={stats.total_students} color={color} />
                  ))}
                </div>
              </div>
            )}

            {/* Subject Type Breakdown */}
            {stats.subject_type_breakdown && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Subjects by Type</span>
                  <span className="badge badge-purple">{stats.total_subjects} total</span>
                </div>
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { key: 'lecture', label: 'Lecture',    color: 'var(--navy)'   },
                    { key: 'lab',     label: 'Laboratory', color: 'var(--purple)' },
                    { key: 'pe',      label: 'PE',         color: 'var(--green)'  },
                    { key: 'nstp',    label: 'NSTP',       color: 'var(--gold)'   },
                  ].map(({ key, label, color }) => (
                    <MiniBar key={key} label={label} value={stats.subject_type_breakdown[key] || 0} total={stats.total_subjects} color={color} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Overview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Enrollment Overview</span>
            </div>
            <div style={{ padding: '24px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Active Enrollments',  value: stats.active_enrollments,  bg: 'rgba(30,158,104,0.1)',  color: 'var(--green)' },
                { label: 'Dropped Enrollments', value: stats.dropped_enrollments, bg: 'rgba(214,57,57,0.1)',   color: 'var(--red)'   },
                { label: 'Available Sections',  value: stats.available_sections,  bg: 'rgba(13,35,83,0.07)',   color: 'var(--navy)'  },
              ].map(({ label, value, bg, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    minWidth: '56px', height: '56px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, fontFamily: 'var(--font-head)',
                    fontSize: '24px', fontWeight: 700, color,
                  }}>
                    {value}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
