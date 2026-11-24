const FALLBACK = "/no-poster.svg";

export default function Poster({ src, alt = "", ...props }) {
  return (
    <img
      src={src && src !== "N/A" ? src : FALLBACK}
      alt={alt}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK;
      }}
      {...props}
    />
  );
}
