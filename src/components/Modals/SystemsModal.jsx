import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../utils/audio';

export default function SystemsModal({ isOpen, onClose, onSwitchSector }) {
  const [telemetryLogs, setTelemetryLogs] = useState([
    '[00:00:01] GOLANG_ENGINE: Ingesting sports feed API stream : latency 32ms : JSON parsed',
    '[00:00:02] AIRGIFT_ROUTER: Multi-supplier gateway online : Redis queue health nominal',
    '[00:00:03] DOCKER_NODE: 12 microservice containers reporting healthy status',
    '[00:00:04] GRAFANA_OBSERVE: Scraping API latency metrics : Prometheus interval 15s',
    '[00:00:05] DB_POOL: PostgreSQL connection pool active : max_open=50 max_idle=10',
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const samplePool = [
      'GOLANG_WORKER: Processed batch 4,200 events/sec without backpressure',
      'AIRGIFT_PAY: Multi-merchant transaction routed via primary supplier in 142ms',
      'REDIS_CLUSTER: Memory cache hit ratio at 98.4% : volatile-lru policy nominal',
      'GRAFANA_ALERT: P99 latency threshold verified at 48ms across all ingress routes',
      'DOCKER_SWARM: Container health check passed for 14 microservices',
      'POSTGRES_METRIC: Read replica lag 0ms : WAL streaming nominal',
      'JWT_AUTH: 1,820 API tokens validated : zero security anomalies detected',
    ];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomMsg = samplePool[Math.floor(Math.random() * samplePool.length)];
      setTelemetryLogs((prev) => {
        const next = [...prev.slice(-6), `[${timeStr}] ${randomMsg}`];
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSectorSwitch = (sector) => {
    audioEngine.playWarpSound();
    onSwitchSector(sector);
  };

  return (
    <dialog
      id="modal-systems"
      open
      className="cockpit-modal"
      aria-labelledby="systems-modal-title"
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
            <div className="sector-code-badge">SECTOR 03 // PROPULSION & OBSERVABILITY</div>
            <h2 id="systems-modal-title" className="modal-title">
              PROPULSION & ARCHITECTURE
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
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('experience')}
              >
                02 LOG
              </button>
              <button
                type="button"
                className="sector-pill-btn active"
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
              aria-label="Close Systems Modal"
            >
              <span className="close-text">ESC</span>
              <span className="close-glyph" aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <div className="modal-body-scroll">
          <div className="systems-grid">
            {/* Core Languages & Frameworks */}
            <div className="system-card">
              <div className="system-card-header">
                <span className="system-icon" aria-hidden="true">⚡</span>
                <h3>PROGRAMMING & RUNTIMES</h3>
              </div>
              <p className="system-desc">High-throughput languages, asynchronous runtimes, and frameworks.</p>
              <div className="skill-meter-group">
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Golang (Go)</span>
                    <span>95%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '95%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Node.js & TypeScript</span>
                    <span>91%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '91%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>PHP & Laravel</span>
                    <span>92%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '92%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Next.js & React</span>
                    <span>89%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '89%' }}></div></div>
                </div>
              </div>
            </div>

            {/* Relays & Caching */}
            <div className="system-card">
              <div className="system-card-header">
                <span className="system-icon" aria-hidden="true">∞</span>
                <h3>CACHING & TASK QUEUES</h3>
              </div>
              <p className="system-desc">In-memory data structures, pub/sub channels, and background workers.</p>
              <div className="skill-meter-group">
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Redis (Caching & In-Memory)</span>
                    <span>94%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '94%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Asynchronous Queue Workers</span>
                    <span>90%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '90%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Payment Gateway Aggregation</span>
                    <span>92%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '92%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>RESTful APIs & JWT Authentication</span>
                    <span>95%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '95%' }}></div></div>
                </div>
              </div>
            </div>

            {/* Databases & ETL */}
            <div className="system-card">
              <div className="system-card-header">
                <span className="system-icon" aria-hidden="true">♦</span>
                <h3>DATABASES & ETL INTEGRATION</h3>
              </div>
              <p className="system-desc">Relational systems, data warehouses, and data integration.</p>
              <div className="skill-meter-group">
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>PostgreSQL</span>
                    <span>92%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '92%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>MySQL & MariaDB</span>
                    <span>90%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '90%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Pentaho Data Integration (ETL)</span>
                    <span>87%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '87%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Data Warehouse Architecture</span>
                    <span>86%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '86%' }}></div></div>
                </div>
              </div>
            </div>

            {/* DevOps & Observability */}
            <div className="system-card">
              <div className="system-card-header">
                <span className="system-icon" aria-hidden="true">⌖</span>
                <h3>DEVOPS & OBSERVABILITY</h3>
              </div>
              <p className="system-desc">Telemetry metrics, container orchestration, and runtime health.</p>
              <div className="skill-meter-group">
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Docker Containerization</span>
                    <span>91%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '91%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Grafana Dashboards & Alerting</span>
                    <span>90%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '90%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Prometheus Metrics Collection</span>
                    <span>88%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '88%' }}></div></div>
                </div>
                <div className="skill-meter">
                  <div className="skill-info">
                    <span>Git Version Control & CI/CD Pipelines</span>
                    <span>93%</span>
                  </div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: '93%' }}></div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Simulated Telemetry Stream */}
          <section className="telemetry-console-box" aria-label="Simulated real-time system telemetry">
            <div className="console-header">
              <span className="console-title">LIVE TELEMETRY STREAM : LUMOSHIVE CLUSTER-01</span>
              <span className="console-status">STREAM ACTIVE (200 OK)</span>
            </div>
            <pre className="console-log" id="telemetry-log-output">
              {telemetryLogs.join('\n')}
            </pre>
          </section>
        </div>
      </div>
    </dialog>
  );
}
