import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Sections from './components/Sections';
import Enrollments from './components/Enrollments';
import Summary from './components/Summary';
import './App.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { key: 'students', label: 'Students', icon: '◈' },
  { key: 'subjects', label: 'Subjects', icon: '◉' },
  { key: 'sections', label: 'Sections', icon: '◫' },
  { key: 'enrollments', label: 'Enrollments', icon: '◎' },
  { key: 'summary', label: 'Summary', icon: '◑' },
];

export default function App() {
  const [active, setActive] = useState('dashboard');

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <Students />;
      case 'subjects': return <Subjects />;
      case 'sections': return <Sections />;
      case 'enrollments': return <Enrollments />;
      case 'summary': return <Summary />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          <div className="brand-text">
            <span className="brand-title">ENROLL</span>
            <span className="brand-sub">SECTIONING SYSTEM</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? 'active' : ''}`}
              onClick={() => setActive(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {active === item.key && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>Student Enrollment &amp; Sectioning v1.0</span>
        </div>
      </aside>
      <main className="main-content">
        <div className="page-container">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
