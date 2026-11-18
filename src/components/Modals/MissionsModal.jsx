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
      id: 6,
      categories: ['golang', 'fintech'],
      badgeAccent: 'B2B PPOB PLATFORM',
      badgeDim: 'WEB3 PAYMENTS',
      title: 'Airtime: B2B PPOB',
      summary:
        'Engineered a B2B PPOB platform facilitating bulk digital product distribution (Pulsa, Data, PLN, Bill Payments) across multiple merchant clients. Golang and Asynq run concurrent, non-blocking task execution over Redis job queues in a decoupled Producer-Consumer architecture, preventing transaction bottlenecks during peak hours. Integrated smart contracts through the Paymento crypto payment gateway and wallet-to-wallet stablecoin transfers (USDC, USDT0) across Arbitrum One, Base, OP Mainnet, and Polygon, with Alchemy RPC automating real-time on-chain payment verification and fulfillment. Includes a Laravel admin dashboard for financial reporting, vendor balance monitoring, and automated callback handling.',
      metrics: [
        { val: '99.9%', lbl: 'Delivery Reliability' },
        { val: 'Multi-Chain', lbl: 'USDC · USDT0' },
        { val: 'Asynq', lbl: 'Producer-Consumer Queue' },
      ],
      tags: ['Golang', 'PostgreSQL', 'Laravel', 'Redis', 'Asynq', 'Docker', 'Paymento', 'Alchemy RPC'],
      linkText: 'INSPECT PLATFORM',
    },
    {
      id: 1,
      categories: ['golang'],
      badgeAccent: 'LUMOSHIVE CORE PLATFORM',
      badgeDim: 'PRODUCTION',
      title: 'Fantasy Eleven: Football Strategy & Fantasy Team Platform',
      summary:
        'Developed a Golang (Echo) backend ingesting external sports APIs for clubs, players, and leagues. Engineered a dynamic, gameweek-based dream team selection system and an interactive upcoming match score prediction engine, establishing a highly engaging, compliance-focused fantasy sports platform.',
      metrics: [
        { val: 'Real-Time', lbl: 'Sports API Stream' },
        { val: 'Gameweek', lbl: 'Squad Selection' },
        { val: 'Low Latency', lbl: 'Score Prediction' },
      ],
      tags: ['Golang (Echo)', 'Next.js', 'Redis', 'REST APIs'],
      linkText: 'INSPECT PLATFORM',
    },
    {
      id: 2,
      categories: ['fintech'],
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
      categories: ['fintech'],
      badgeAccent: 'CONSUMER PAYMENTS',
      badgeDim: 'INSTANT FULFILLMENT',
      title: 'Gameshop: Consumer Game Top-Up Portal',
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
      categories: ['enterprise'],
      badgeAccent: 'WORKFORCE PLATFORM',
      badgeDim: 'ENTERPRISE',
      title: 'Enterprise Human Resource Information System (HRIS)',
      summary:
        'Engineered and managed critical core modules of an enterprise HRIS web application built with Laravel and Livewire, including automated leave request approval pipelines, biometric and manual attendance tracking systems, and a scalable employee directory database.',
      metrics: [
        { val: 'Enterprise', lbl: 'Attendance Tracking' },
        { val: 'Automated', lbl: 'Leave Approvals' },
        { val: 'Scalable', lbl: 'Staff Directory' },
      ],
      tags: ['PHP (Laravel)', 'MySQL', 'Livewire'],
      linkText: 'VIEW HRIS ARCHITECTURE',
    },
    {
      id: 5,
      categories: ['enterprise'],
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
    filter === 'all' ? projects : projects.filter((p) => p.categories.includes(filter));

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
            ALL MISSIONS ({projects.length})
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
              <article key={p.id} className="project-card" data-category={p.categories[0]}>
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
