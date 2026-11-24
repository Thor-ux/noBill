import { Link, NavLink, useNavigate } from "react-router-dom";
import { TELEGRAM_URL } from "../site.js";

const LINKS = [
  { to: "/", label: "Home", end: true, icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" },
  { to: "/movies", label: "Movies", icon: "M4 4h16v16H4zM4 9h16M9 4v5M15 4v5" },
  { to: "/tv", label: "TV Shows", icon: "M3 7h18v12H3zM8 3l4 4 4-4" },
  { to: "/search", label: "Search", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35" },
];

export default function Header() {
  const navigate = useNavigate();
  const navClass = ({ isActive }) => (isActive ? "text-white" : "hover:text-white");

  return (
    <>
      <header className="header">
        <Link to="/" className="logo" aria-label="noBill home">
          <span className="font-normal text-zinc-400">no</span>Bill
        </Link>

        <nav>
          {LINKS.slice(0, 3).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="header-icons">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tg-button"
            aria-label="Join our Telegram channel"
            title="Join our Telegram channel"
          >
            <span className="tg-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="#ffffff"
                  d="M9.04 15.6l-.38 5.3c.54 0 .78-.23 1.06-.51l2.55-2.44 5.28 3.87c.97.53 1.65.25 1.91-.89l3.46-16.2c.31-1.43-.52-1.99-1.46-1.64L1.13 9.9c-1.39.54-1.37 1.32-.24 1.67l5.2 1.62L18.2 5.6c.57-.38 1.09-.17.66.21z"
                />
              </svg>
            </span>
            <span className="tg-label">Join us</span>
          </a>
          <button type="button" aria-label="Search" title="Search" onClick={() => navigate("/search")} className="cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed right-0 bottom-0 left-0 z-30 flex border-t border-[#25262a] bg-[#101114]/95 backdrop-blur min-[600px]:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${isActive ? "text-white" : "text-zinc-500"}`
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={l.icon} />
            </svg>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
