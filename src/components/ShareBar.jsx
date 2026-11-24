import { useEffect, useRef, useState } from "react";
import { BRAND_PATHS } from "./brandIcons.js";
import { SITE_NAME } from "../site.js";

const enc = encodeURIComponent;
const isPhone = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

const PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", kind: "link", href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
  { id: "facebook", name: "Facebook", color: "#0866FF", kind: "link", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { id: "x", name: "X", color: "#000000", kind: "link", href: (u, t) => `https://x.com/intent/post?url=${enc(u)}&text=${enc(t)}` },
  { id: "telegram", name: "Telegram", color: "#26A5E4", kind: "link", href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  { id: "reddit", name: "Reddit", color: "#FF4500", kind: "link", href: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}` },
  { id: "messenger", name: "Messenger", color: "#0084FF", kind: "app", phoneHref: (u) => `fb-messenger://share/?link=${enc(u)}` },
  { id: "instagram", name: "Instagram", color: "#E4405F", kind: "app", gradient: "linear-gradient(45deg,#f9ce34,#ee2a7b 50%,#6228d7)" },
  { id: "tiktok", name: "TikTok", color: "#000000", kind: "app" },
];

const UTIL_ICONS = {
  email: ["M3 6h18v12H3z", "M3 7l9 6 9-6"],
  copy: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  more: ["M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7", "M12 3v12", "M7.5 7.5L12 3l4.5 4.5"],
};

function BrandIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path fill="currentColor" d={BRAND_PATHS[id]} />
    </svg>
  );
}

function LineIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  );
}

export default function ShareBar({ title }) {
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = title ? `Watching ${title} on ${SITE_NAME}` : `Watch on ${SITE_NAME}`;

  const showToast = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setToast("");
      setCopied(false);
    }, 3200);
  };

  const copyLink = async (message = "Link copied") => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast(message);
    } catch {
      showToast("Couldn't copy. Copy the address from your browser bar.");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: text, text, url });
      return true;
    } catch (err) {
      return err?.name === "AbortError";
    }
  };

  const shareToApp = async (p) => {
    if (isPhone() && p.phoneHref) {
      window.location.href = p.phoneHref(url);
      return;
    }
    if (isPhone() && canNativeShare() && (await nativeShare())) return;
    copyLink(`Link copied. Paste it in ${p.name}`);
  };

  return (
    <section className="share-bar" aria-label="Share">
      <span className="share-title">Share with friends</span>

      <div className="share-buttons">
        {PLATFORMS.map((p, i) => {
          const style = { "--brand": p.color, "--brand-bg": p.gradient || p.color, "--i": i };
          const props = { className: `share-btn share-${p.id}`, style, title: `Share on ${p.name}`, "aria-label": `Share on ${p.name}` };
          return p.kind === "link" ? (
            <a key={p.id} {...props} href={p.href(url, text)} target="_blank" rel="noopener noreferrer">
              <BrandIcon id={p.id} />
            </a>
          ) : (
            <button key={p.id} type="button" {...props} onClick={() => shareToApp(p)}>
              <BrandIcon id={p.id} />
            </button>
          );
        })}

        <span className="share-divider" aria-hidden="true" />

        <a
          className="share-btn"
          style={{ "--brand": "#a1a1aa", "--brand-bg": "#3f3f46", "--i": PLATFORMS.length }}
          href={`mailto:?subject=${enc(text)}&body=${enc(`${text}\n${url}`)}`}
          title="Share by email"
          aria-label="Share by email"
        >
          <LineIcon d={UTIL_ICONS.email} />
        </a>
        <button
          type="button"
          className="share-btn"
          style={{ "--brand": "#a1a1aa", "--brand-bg": "#3f3f46", "--i": PLATFORMS.length + 1 }}
          onClick={() => copyLink()}
          title="Copy link"
          aria-label="Copy link"
        >
          <LineIcon d={copied ? UTIL_ICONS.check : UTIL_ICONS.copy} />
        </button>
        {canNativeShare() && (
          <button
            type="button"
            className="share-btn"
            style={{ "--brand": "#a1a1aa", "--brand-bg": "#3f3f46", "--i": PLATFORMS.length + 2 }}
            onClick={nativeShare}
            title="More apps"
            aria-label="Share to more apps"
          >
            <LineIcon d={UTIL_ICONS.more} />
          </button>
        )}
      </div>

      <div className={`share-toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </section>
  );
}
