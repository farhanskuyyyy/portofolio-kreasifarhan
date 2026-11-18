import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../utils/audio';

export default function FlightLogModal({ isOpen, onClose, onSwitchSector }) {
  const [activeTab, setActiveTab] = useState('work');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabClick = (tab) => {
    audioEngine.playUiClick(840, 'sine', 0.03);
    setActiveTab(tab);
  };

  const handleSectorSwitch = (sector) => {
    audioEngine.playWarpSound();
    onSwitchSector(sector);
  };

  return (
    <dialog
      id="modal-experience"
      open
      className="cockpit-modal"
      aria-labelledby="exp-modal-title"
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
            <div className="sector-code-badge">SECTOR 02 // CAREER & EDUCATION</div>
            <h2 id="exp-modal-title" className="modal-title">
              FLIGHT LOG & MILESTONES
            </h2>
          </div>
          <div className="modal-header-actions">
            <div className="sector-nav-pills">
              <button
                type="button"
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('missions')}
              >
                01 MISSIONS
              </button>
              <button
                type="button"
                className="sector-pill-btn active"
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
              aria-label="Close Experience Modal"
            >
              <span className="close-text">ESC</span>
              <span className="close-glyph" aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <nav className="timeline-tabs" aria-label="Select log category">
          <button
            type="button"
            className={`tab-chip ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => handleTabClick('work')}
          >
            PROFESSIONAL EXPERIENCE
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => handleTabClick('education')}
          >
            FORMAL EDUCATION & DEGREES
          </button>
        </nav>

        <div className="modal-body-scroll">
          {activeTab === 'work' && (
            <div id="timeline-work-view" className="timeline-container">
              {/* Role 1: Lumoshive */}
              <div className="timeline-entry current">
                <div className="timeline-marker">
                  <span className="marker-dot"></span>
                  <span className="marker-line"></span>
                </div>
                <div className="timeline-content">
                  <div className="entry-meta">
                    <span className="entry-period">APRIL 2021 : PRESENT</span>
                    <span className="entry-badge active">CURRENT MISSION</span>
                  </div>
                  <h3 className="entry-title">Fullstack Developer (Full-time)</h3>
                  <h4 className="entry-company">LUMOSHIVE : Jakarta, Indonesia</h4>
                  <p className="entry-desc">
                    Designing, building, and maintaining B2B transactional platforms, high-performance API ecosystems, Web3 payment integrations, and system observability suites across multiple production platforms.
                  </p>
                  <ul className="entry-bullets">
                    <li>
                      Engineered and architected <strong>Airtime (B2B PPOB Platform)</strong> in <strong>Golang and PostgreSQL</strong>, establishing a high-throughput engine for automated pulse, data, and utility bill disbursements.
                    </li>
                    <li>
                      Implemented <strong>Asynq</strong> distributed task queue backed by <strong>Redis</strong> for asynchronous transaction dispatching, retry mechanisms, and supplier status polling with <strong>99.9% delivery reliability</strong>.
                    </li>
                    <li>
                      Integrated smart contracts via the <strong>Paymento</strong> cryptocurrency payment gateway and engineered wallet-to-wallet stablecoin transfers (<strong>USDC and USDT0</strong> across Arbitrum One, Base, OP Mainnet, and Polygon) utilizing <strong>Alchemy RPC</strong> to automate real-time on-chain payment confirmation and product fulfillment.
                    </li>
                    <li>
                      Architected a high-performance backend in <strong>Golang (Echo)</strong> to ingest and process real-time external sports APIs, power gameweek dream team selection mechanics, and run match score prediction systems.
                    </li>
                    <li>
                      Engineered <strong>Airgift</strong>, a robust transactional middleware connecting multiple top-up suppliers to portal merchants using <strong>Laravel, Redis, PostgreSQL, Docker, Grafana, and Prometheus</strong>.
                    </li>
                    <li>
                      Developed and launched <strong>Gameshop</strong>, a dedicated consumer game top-up portal integrating multi-channel e-wallet and mobile billing payment gateways with automated voucher delivery.
                    </li>
                    <li>
                      Maintained, optimized, and upgraded core modules of an enterprise-grade <strong>HRIS</strong> application using <strong>Laravel and Livewire</strong> (attendance monitoring, leave management, employee directory).
                    </li>
                    <li>
                      Containerized applications using <strong>Docker</strong> to standardize development environments and implemented <strong>Grafana/Prometheus</strong> dashboards for real-time API request monitoring and tracking latency.
                    </li>
                    <li>
                      Collaborated with and mentored team members, conducting code reviews and resolving technical blockers to maintain high code quality.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Role 2: PT Anggada Duta Wisesa */}
              <div className="timeline-entry">
                <div className="timeline-marker">
                  <span className="marker-dot"></span>
                </div>
                <div className="timeline-content">
                  <div className="entry-meta">
                    <span className="entry-period">MAY 2020 : MARCH 2021</span>
                    <span className="entry-badge">COMPLETED</span>
                  </div>
                  <h3 className="entry-title">PHP Developer (Internship)</h3>
                  <h4 className="entry-company">PT ANGGADA DUTA WISESA : Jakarta, Indonesia</h4>
                  <p className="entry-desc">
                    Engineered data warehouse extraction pipelines and maintained corporate E-Procurement client applications.
                  </p>
                  <ul className="entry-bullets">
                    <li>
                      Designed and executed complex SQL queries to analyze data warehouse repositories using <strong>Pentaho Data Integration (ETL)</strong>, generating actionable business insights.
                    </li>
                    <li>
                      Developed new features, resolved bugs, and maintained corporate <strong>E-Procurement</strong> client applications built with <strong>PHP (CodeIgniter)</strong> and JavaScript, ensuring secure transaction modules.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div id="timeline-education-view" className="timeline-container">
              {/* Degree 1: UNINDRA */}
              <div className="timeline-entry current">
                <div className="timeline-marker">
                  <span className="marker-dot"></span>
                  <span className="marker-line"></span>
                </div>
                <div className="timeline-content">
                  <div className="entry-meta">
                    <span className="entry-period">2021 : 2025</span>
                    <span className="entry-badge active">GPA 3.61 / 4.00</span>
                  </div>
                  <h3 className="entry-title">Bachelor of Science in Information Technology (S1)</h3>
                  <h4 className="entry-company">Universitas Indraprasta PGRI (UNINDRA) : Jakarta, Indonesia</h4>
                  <p className="entry-desc">
                    Undergraduate study in information technology with a focus on web programming, software development, and database management.
                  </p>
                  <ul className="entry-bullets">
                    <li>
                      Cumulative Grade Point Average of <strong>3.61 / 4.00</strong>.
                    </li>
                    <li>
                      Focus: PHP, Web Programming, Software Development, Database Management.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Degree 2: SMKN 26 Jakarta */}
              <div className="timeline-entry">
                <div className="timeline-marker">
                  <span className="marker-dot"></span>
                </div>
                <div className="timeline-content">
                  <div className="entry-meta">
                    <span className="entry-period">JULY 2017 : AUGUST 2021</span>
                    <span className="entry-badge">GRADUATED</span>
                  </div>
                  <h3 className="entry-title">Vocational High School Diploma : Network & System Administration</h3>
                  <h4 className="entry-company">SMKN 26 Jakarta : Jakarta, Indonesia</h4>
                  <p className="entry-desc">
                    Vocational training in computer networking and systems administration.
                  </p>
                  <ul className="entry-bullets">
                    <li>
                      Focus: Network Infrastructure, Systems Administration, IT Fundamentals.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
