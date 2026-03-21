import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Sections from './components/Sections';
import Enrollments from './components/Enrollments';
import Summary from './components/Summary';
import './App.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡', subtitle: 'Overview' },
  { key: 'students', label: 'Students', icon: '◈', subtitle: 'Manage students' },
  { key: 'subjects', label: 'Subjects', icon: '◉', subtitle: 'Course subjects' },
  { key: 'sections', label: 'Sections', icon: '◫', subtitle: 'Class sections' },
  { key: 'enrollments', label: 'Enrollments', icon: '◎', subtitle: 'Enroll students' },
  { key: 'summary', label: 'Summary', icon: '◑', subtitle: 'Reports & summary' },
];

const PAGE_MAP = {
  dashboard: Dashboard,
  students: Students,
  subjects: Subjects,
  sections: Sections,
  enrollments: Enrollments,
  summary: Summary,
};

export default function App() {
  const [active, setActive] = useState('dashboard');

  const ActivePage = PAGE_MAP[active] || Dashboard;
  const activeNav = NAV_ITEMS.find(n => n.key === active);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          <div className="brand-text">
            <span className="brand-title">SESS</span>
            <span className="brand-sub">ENROLLMENT SYSTEM</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? 'active' : ''}`}
              onClick={() => setActive(item.key)}
              title={item.subtitle}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {active === item.key && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '4px', color: 'var(--text2)', fontWeight: 600 }}>SESS v1.0</div>
          <div>Student Enrollment &amp; Sectioning</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          <ActivePage />
        </div>
      </main>
    </div>
  );
}
