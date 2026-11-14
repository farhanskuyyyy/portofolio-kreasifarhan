import React, { useState } from 'react';
import { audioEngine } from '../../utils/audio';

export default function RelayModal({ isOpen, onClose, onSwitchSector }) {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formFeedback, setFormFeedback] = useState(null);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSectorSwitch = (sector) => {
    audioEngine.playWarpSound();
    onSwitchSector(sector);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('arfianto472@gmail.com');
      setCopied(true);
      audioEngine.playUiClick(950, 'sine', 0.05);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      // fallback
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Callsign or name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid comm email frequency is required';
    }
    if (!formData.message.trim()) newErrors.message = 'Transmission payload cannot be empty';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      audioEngine.playUiClick(340, 'triangle', 0.08);
      return;
    }

    audioEngine.playUiClick(1100, 'sine', 0.08);
    setFormFeedback({
      type: 'success',
      msg: 'TRANSMISSION DELIVERED: Payload queued successfully into Farhan Arfianto inbox buffer.',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <dialog open className="cockpit-modal" aria-labelledby="contact-modal-title">
      <div className="modal-window">
        <span className="hud-bracket bracket-tl" aria-hidden="true"></span>
        <span className="hud-bracket bracket-tr" aria-hidden="true"></span>
        <span className="hud-bracket bracket-bl" aria-hidden="true"></span>
        <span className="hud-bracket bracket-br" aria-hidden="true"></span>

        <header className="modal-header">
          <div className="modal-header-left">
            <div className="sector-code-badge">SECTOR 04 // TRANSMISSION RELAY</div>
            <h2 id="contact-modal-title" className="modal-title">
              COMMUNICATIONS & DOSSIER
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
                className="sector-pill-btn"
                onClick={() => handleSectorSwitch('systems')}
              >
                03 SYSTEMS
              </button>
              <button
                type="button"
                className="sector-pill-btn active"
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
              aria-label="Close Contact Modal"
            >
              <span className="close-text">ESC</span>
              <span className="close-glyph" aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <div className="modal-body-scroll">
          <div className="contact-split-layout">
            {/* Left: Transmission Form */}
            <section className="contact-form-section" aria-label="Send direct transmission">
              <h3 className="contact-subheading">ENCRYPTED DISPATCH TERMINAL</h3>
              <p className="contact-intro">
                Send an engineering inquiry, collaborative proposal, or system consultation request directly to Farhan Arfianto.
              </p>

              <form id="transmission-form" className="telemetry-form" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="sender-name" className="form-label">
                    CALLSIGN / NAME <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="sender-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. Captain Cooper or Enterprise Lead"
                    autoComplete="name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="sender-email" className="form-label">
                    COMM FREQUENCY / EMAIL <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="sender-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="name@domain.com"
                    autoComplete="email"
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="sender-subject" className="form-label">
                    MISSION SUBJECT
                  </label>
                  <input
                    type="text"
                    id="sender-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Distributed Backend Consultation"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sender-message" className="form-label">
                    TRANSMISSION PAYLOAD <span className="required">*</span>
                  </label>
                  <textarea
                    id="sender-message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Detail your project scope, throughput expectations, or engineering timeline..."
                  ></textarea>
                  {errors.message && <span className="form-error">{errors.message}</span>}
                </div>

                <button type="submit" className="submit-transmission-btn" id="submit-btn">
                  <span className="btn-text">TRANSMIT TO RELAY</span>
                  <span className="btn-icon" aria-hidden="true">→</span>
                </button>

                {formFeedback && (
                  <div
                    className={`form-feedback ${formFeedback.type}`}
                    role="alert"
                    style={{ display: 'block', marginTop: '12px' }}
                  >
                    {formFeedback.msg}
                  </div>
                )}
              </form>
            </section>

            {/* Right: Real Direct Relay Coordinates */}
            <aside className="contact-info-section" aria-label="Direct contact coordinates">
              <h3 className="contact-subheading">DIRECT RELAY COORDINATES</h3>

              {/* Real Email Copy Card */}
              <div className="info-card">
                <span className="info-label">OFFICIAL EMAIL FREQUENCY</span>
                <div className="copy-box">
                  <span className="copy-value" id="email-address-text">
                    arfianto472@gmail.com
                  </span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={handleCopyEmail}
                    aria-label="Copy email address to clipboard"
                  >
                    <span>{copied ? 'COPIED!' : 'COPY'}</span>
                  </button>
                </div>
                <a href="mailto:arfianto472@gmail.com" className="direct-link">
                  Open native mail client →
                </a>
              </div>

              {/* Real Phone Card */}
              <div className="info-card">
                <span className="info-label">PHONE & WHATSAPP</span>
                <div className="copy-box">
                  <span className="copy-value">+62 896-2965-7237</span>
                  <a
                    href="https://wa.me/6289629657237"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="copy-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    CHAT
                  </a>
                </div>
              </div>

              {/* Base Coordinates */}
              <div className="info-card">
                <span className="info-label">ORBIT BASE</span>
                <p className="info-val">East Jakarta, Jakarta, Indonesia (GMT+7)</p>
                <p className="info-sub">
                  Available for remote distributed engineering and enterprise architecture reviews.
                </p>
              </div>

              {/* Digital Profiles */}
              <div className="info-card">
                <span className="info-label">EXTERNAL TRANSMISSION CHANNELS</span>
                <div className="channel-links">
                  <a
                    href="https://github.com/farhanskuyyyy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="channel-btn"
                  >
                    <span>GITHUB REPOSITORIES (@farhanskuyyyy)</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    href="https://linkedin.com/in/farhanarfianto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="channel-btn"
                  >
                    <span>LINKEDIN NETWORK (/in/farhanarfianto)</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    href="https://kreasifarhan.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="channel-btn"
                  >
                    <span>ORIGINAL PORTFOLIO (kreasifarhan.id)</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>

              {/* Flight Log Download */}
              <div className="info-card highlight-card">
                <span className="info-label">OFFICIAL DOSSIER</span>
                <h4 className="dossier-title">Farhan Arfianto Flight Resume (CV)</h4>
                <p className="dossier-desc">
                  Curriculum vitae documenting professional experience at Lumoshive, academic credentials at UNINDRA (GPA 3.61), and complete technical capabilities.
                </p>
                <a
                  href="https://kreasifarhan.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-resume-btn"
                >
                  <span>DOWNLOAD RESUME (CV)</span>
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </dialog>
  );
}
