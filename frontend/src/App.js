import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Sections from './components/Sections';
import Enrollments from './components/Enrollments';
import Summary from './components/Summary';
import { getDashboardStats } from './api';
import './App.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students',  label: 'Students'  },
  { key: 'subjects',  label: 'Subjects'  },
  { key: 'sections',  label: 'Sections'  },
  { key: 'enrollments', label: 'Enrollments' },
  { key: 'summary',   label: 'Summary'   },
];

const PAGE_MAP = {
  dashboard: Dashboard, students: Students, subjects: Subjects,
  sections: Sections, enrollments: Enrollments, summary: Summary,
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [heroStats, setHeroStats] = useState(null);
  const ActivePage = PAGE_MAP[active] || Dashboard;

  useEffect(() => {
    getDashboardStats().then(r => setHeroStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="app-shell">

      {/* ── Top Navbar ── */}
      <nav className="top-navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <img src="/ustp-logo.jpg" alt="USTP" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">USTP — Cagayan de Oro</span>
            <span className="navbar-brand-sub">Enrollment &amp; Sectioning System</span>
          </div>
        </div>

        <div className="navbar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`navbar-item ${active === item.key ? 'active' : ''}`}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="navbar-right">
          <span className="navbar-badge">AY 2025–2026</span>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div className="hero-banner">
        <img src="/campus.jpg" alt="USTP Campus" />
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-tagline">University of Science &amp; Technology of Southern Philippines</div>
            <h1 className="hero-title">Student Enrollment &amp;<br />Sectioning System</h1>
            <p className="hero-desc">
              Streamline student enrollment, manage class sections, and track academic progress in one unified platform.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="hero-stats">
          {[
            { label: 'Total Students',      value: heroStats?.total_students      ?? '—' },
            { label: 'Subjects',            value: heroStats?.total_subjects      ?? '—' },
            { label: 'Sections',            value: heroStats?.total_sections      ?? '—' },
            { label: 'Active Enrollments',  value: heroStats?.active_enrollments  ?? '—' },
            { label: 'Available Sections',  value: heroStats?.available_sections !== undefined
                ? heroStats.available_sections
                : heroStats
                  ? (heroStats.total_sections - heroStats.full_sections)
                  : '—' },
          ].map(s => (
            <div className="hero-stat-item" key={s.label}>
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Page Content (full width, no sidebar) ── */}
      <main className="main-content">
        <div className="page-container">
          <ActivePage />
        </div>
      </main>

    </div>
  );
}
