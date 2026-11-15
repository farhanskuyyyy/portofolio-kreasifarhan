import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../utils/audio';

export default function MissionsModal({ isOpen, onClose, onSwitchSector }) {
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFilterClick = (cat) => {
    audioEngine.playUiClick(800, 'sine', 0.03);
    setFilter(cat);
  };

  const handleSectorSwitch = (sector) => {
    audioEngine.playWarpSound();
    onSwitchSector(sector);
  };

  const projects = [
    {
      id: 1,
      category: 'golang',
      badgeAccent: 'LUMOSHIVE CORE PLATFORM',
      badgeDim: 'PRODUCTION',
      title: 'Football Strategy & Fantasy Team Platform',
      summary:
        'Engineered a high-performance, low-latency backend in Golang to ingest and process real-time external sports APIs for clubs, leagues, and player profiles. Developed a dynamic gameweek-based dream team selection system and an interactive upcoming match score prediction engine.',
      metrics: [
        { val: 'Real-Time', lbl: 'Sports API Stream' },
        { val: 'Gameweek', lbl: 'Squad Selection' },
        { val: 'Low Latency', lbl: 'Score Prediction' },
      ],
      tags: ['Golang (Go)', 'Next.js', 'Redis', 'REST APIs', 'JSON Ingestion'],
      linkText: 'INSPECT PLATFORM',
    },
    {
      id: 2,
      category: 'fintech',
      badgeAccent: 'TRANSACTIONAL ROUTER',
      badgeDim: 'MULTI-MERCHANT',
      title: 'Airgift: Transactional Middleware & Multimerchant API',
      summary:
        'Architected and engineered "Airgift", a specialized transactional middleware connecting multiple top-up suppliers to various portal merchants. Utilized Laravel, Redis for asynchronous task queuing, PostgreSQL, Docker, and Grafana/Prometheus for real-time latency monitoring and observability.',
      metrics: [
        { val: 'Multi-Supplier', lbl: 'Automated Routing' },
        { val: 'Asynchronous', lbl: 'Redis Queue Dispatch' },
        { val: 'Prometheus', lbl: 'Latency Observability' },
      ],
      tags: ['PHP (Laravel)', 'Redis', 'PostgreSQL', 'Docker', 'Grafana', 'Prometheus'],
      linkText: 'INSPECT MIDDLEWARE',
    },
    {
      id: 3,
      category: 'fintech',
      badgeAccent: 'CONSUMER PAYMENTS',
      badgeDim: 'INSTANT FULFILLMENT',
      title: 'Consumer Game Top-Up Portal',
      summary:
        'Developed and launched a dedicated consumer game voucher top-up portal, integrating multi-channel e-wallet and mobile billing (pulsa) payment gateways to deliver immediate, automated voucher purchases and direct-to-account top-ups.',
      metrics: [
        { val: 'Instant', lbl: 'Automated Delivery' },
        { val: 'Multi-Channel', lbl: 'E-Wallet & Pulsa' },
        { val: 'Zero Downtime', lbl: 'Transaction Engine' },
      ],
      tags: ['PHP (Laravel)', 'MySQL', 'Payment Gateways', 'E-Wallets', 'Pulsa APIs'],
      linkText: 'EXPLORE PORTAL',
    },
    {
      id: 4,
      category: 'enterprise',
      badgeAccent: 'WORKFORCE PLATFORM',
      badgeDim: 'ENTERPRISE',
      title: 'Enterprise Human Resource Information System (HRIS)',
      summary:
        'Maintained, optimized, and upgraded core modules of an enterprise-grade HRIS website using Laravel, including attendance monitoring, automated leave approval request workflows, and scalable employee directory management.',
      metrics: [
        { val: 'Enterprise', lbl: 'Attendance Tracking' },
        { val: 'Automated', lbl: 'Leave Approvals' },
        { val: 'Scalable', lbl: 'Staff Directory' },
      ],
      tags: ['PHP (Laravel)', 'MySQL', 'JavaScript', 'Docker', 'REST APIs'],
      linkText: 'VIEW HRIS ARCHITECTURE',
    },
    {
      id: 5,
      category: 'enterprise',
      badgeAccent: 'SUPPLY CHAIN & ETL',
      badgeDim: 'DATA WAREHOUSE',
      title: 'Corporate E-Procurement & Data Warehouse ETL',
      summary:
        'Designed and executed complex SQL queries to extract and sync data warehouse repositories using Pentaho Data Integration (ETL). Developed core features and maintained secure corporate E-Procurement applications built with PHP (CodeIgniter) and JavaScript.',
      metrics: [
        { val: 'Pentaho', lbl: 'ETL Data Integration' },
        { val: 'SQL Warehouse', lbl: 'Query Optimization' },
        { val: 'Immutable', lbl: 'Audit Trails' },
      ],
      tags: ['PHP (CodeIgniter)', 'Pentaho ETL', 'SQL Warehouse', 'JavaScript', 'E-Procurement'],
      linkText: 'VIEW SPECIFICATIONS',
    },
  ];

  const filteredProjects =
    filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <dialog
      id="modal-missions"
      open
      className="cockpit-modal"
      aria-labelledby="missions-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <span className="hud-bracket bracket-tl" aria-hidden="true"></span>
        <span className="hud-bracket bracket-tr" aria-hidden="true"></span>
        <span className="hud-bracket bracket-bl" aria-hidden="true"></span>
        <span className="hud-bracket bracket-br" aria-hidden="true"></span>

        <header className="modal-header">
          <div className="modal-header-left">
            <div className="sector-code-badge">SECTOR 01 // PRODUCTION MISSIONS</div>
            <h2 id="missions-modal-title" className="modal-title">
              HIGH-THROUGHPUT PLATFORMS
            </h2>
          </div>
          <div className="modal-header-actions">
            <div className="sector-nav-pills" aria-label="Switch cockpit sector">
              <button
                type="button"
                className="sector-pill-btn active"
                onClick={() => handleSectorSwitch('missions')}
              >
                01 MISSIONS
              </button>
              <button
                type="button"
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('experience')}
              >
                02 LOG
              </button>
              <button
                type="button"
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('systems')}
              >
                03 SYSTEMS
              </button>
              <button
                type="button"
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('contact')}
              >
                04 RELAY
              </button>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              autoFocus
              aria-label="Close Missions Modal"
            >
              <span className="close-text">ESC</span>
              <span className="close-glyph" aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <nav className="project-filters" aria-label="Filter projects by domain">
          <button
            type="button"
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            ALL MISSIONS (5)
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === 'golang' ? 'active' : ''}`}
            onClick={() => handleFilterClick('golang')}
          >
            GOLANG & REAL-TIME
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === 'fintech' ? 'active' : ''}`}
            onClick={() => handleFilterClick('fintech')}
          >
            PAYMENT & MIDDLEWARE
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === 'enterprise' ? 'active' : ''}`}
            onClick={() => handleFilterClick('enterprise')}
          >
            ENTERPRISE & ETL
          </button>
        </nav>

        <div className="modal-body-scroll">
          <div className="projects-grid">
            {filteredProjects.map((p) => (
              <article key={p.id} className="project-card" data-category={p.category}>
                <div className="card-status-bar">
                  <span className="badge-accent">{p.badgeAccent}</span>
                  <span className="badge-dim">{p.badgeDim}</span>
                </div>
                <h3 className="card-title">{p.title}</h3>
                <p className="card-summary">{p.summary}</p>
                <div className="card-metrics">
                  {p.metrics.map((m, idx) => (
                    <div key={idx} className="metric-item">
                      <span className="metric-val">{m.val}</span>
                      <span className="metric-lbl">{m.lbl}</span>
                    </div>
                  ))}
                </div>
                <div className="tech-stack-row">
                  {p.tags.map((tag, idx) => (
                    <span key={idx} className="tech-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="card-actions">
                  <a
                    href="https://kreasifarhan.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-btn primary"
                  >
                    <span>{p.linkText}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
