import { Link } from "react-router-dom";
import { CONTACT_EMAIL, SITE_NAME, mailto } from "../site.js";

const PAGES = [
  { to: "/about", label: "About Us" },
  { to: "/rights-holders", label: "Rights Holders" },
  { to: "/advertising", label: "Advertising" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo" aria-label={`${SITE_NAME} home`}>
            <span className="font-normal text-zinc-400">no</span>Bill
          </Link>
          <p>Movies and TV shows, made by fans for fans.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          {PAGES.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        <a href={mailto()}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}
