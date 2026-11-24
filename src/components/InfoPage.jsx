import { useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT_EMAIL, mailto } from "../site.js";

export function Icon({ d, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {[].concat(d).map((p) => <path key={p} d={p} />)}
    </svg>
  );
}

export const ICONS = {
  browse: ["M4 4h16v16H4z", "M4 9h16", "M9 4v5", "M15 4v5"],
  play: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M10 8.5l5.5 3.5-5.5 3.5z"],
  idea: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
  mail: ["M3 6h18v12H3z", "M3 7l9 6 9-6"],
  copy: ["M9 9h11v11H9z", "M5 15H4V4h11v1"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  document: ["M6 3h8l4 4v14H6z", "M14 3v4h4", "M9 12h6", "M9 16h6"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 3.6-6 8-6s8 2 8 6"],
  banner: ["M3 5h18v14H3z", "M3 15h18", "M7 18v-3"],
  flag: ["M5 21V4", "M5 4h11l-2 4 2 4H5"],
  grid: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  send: ["M21 3L10 14", "M21 3l-7 18-4-7-7-4z"],
};

export function Hero({ eyebrow, title, accent, children }) {
  return (
    <section className="about-hero">
      <svg className="about-hero-mark" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M22 14l30 18-30 18z" />
      </svg>
      <span className="about-eyebrow">{eyebrow}</span>
      <h1>
        {title}
        {accent && <span>{accent}</span>}
      </h1>
      <p>{children}</p>
    </section>
  );
}

export function Steps({ id, heading, items, columns = 3 }) {
  return (
    <section id={id} className="about-section">
      <h2 className="about-heading">{heading}</h2>
      <ol className={`about-steps ${columns === 2 ? "about-steps-2" : ""}`}>
        {items.map((s, i) => (
          <li key={s.title} className="about-step">
            <div className="about-step-top">
              <span className="about-step-number">{String(i + 1).padStart(2, "0")}</span>
              <span className="about-step-icon"><Icon d={s.icon} /></span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>

            {s.actions && (
              <div className="about-pills">
                {s.actions.map((a) => (
                  <Link key={a.to} to={a.to} className="about-pill">{a.label}</Link>
                ))}
              </div>
            )}
            {s.badges && (
              <div className="about-pills">
                {s.badges.map((b) => (
                  <span key={b} className="about-pill about-pill-static">{b}</span>
                ))}
              </div>
            )}
            {s.mail && (
              <div className="about-pills">
                <a href={mailto(s.mail.subject)} className="about-pill about-pill-solid">{s.mail.label}</a>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ContactPanel({ id = "contact", title, text, subject, button = "Send an email" }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  return (
    <section id={id} className="about-contact">
      <span className="about-contact-icon"><Icon d={ICONS.mail} size={26} /></span>
      <div className="about-contact-text">
        <h2>{title}</h2>
        <p>{text}</p>
        <a href={mailto(subject)} className="about-email">{CONTACT_EMAIL}</a>
      </div>
      <div className="about-contact-actions">
        <a href={mailto(subject)} className="watch-button">{button}</a>
        <button type="button" onClick={copyEmail} className="about-copy" aria-live="polite">
          <Icon d={copied ? ICONS.check : ICONS.copy} size={18} />
          {copied ? "Copied" : "Copy address"}
        </button>
      </div>
    </section>
  );
}
