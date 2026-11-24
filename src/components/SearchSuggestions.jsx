import { Link } from "react-router-dom";
import Poster from "./Poster.jsx";
import { posterOrFallback } from "../api/omdb.js";
import { showImage } from "../api/tvmaze.js";

export function buildSuggestions(movies = [], shows = []) {
  return [
    ...movies.slice(0, 6).map((m) => ({
      key: `m-${m.imdbID}`,
      to: `/movie/${m.imdbID}`,
      image: posterOrFallback(m.Poster),
      title: m.Title,
      meta: m.Year,
      type: "Movie",
    })),
    ...shows.slice(0, 4).map((s) => ({
      key: `s-${s.id}`,
      to: `/tv/${s.id}`,
      image: s.image?.medium || showImage(s),
      title: s.name,
      meta: s.premiered?.slice(0, 4) || "",
      type: "TV",
    })),
  ];
}

export default function SearchSuggestions({ items, active, loading, hint, onPick }) {
  return (
    <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border border-[#25262a] bg-[#18191d] shadow-2xl">
      {loading && items.length === 0 && <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>}
      {!loading && hint && <p className="px-4 py-3 text-sm text-zinc-400">{hint}</p>}
      {!loading && !hint && items.length === 0 && (
        <p className="px-4 py-3 text-sm text-zinc-400">No matches.</p>
      )}

      <ul>
        {items.map((item, i) => (
          <li key={item.key}>
            <Link
              to={item.to}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onPick}
              className={`flex items-center gap-3 px-4 py-2 ${i === active ? "bg-[#2a2b31]" : "hover:bg-[#232429]"}`}
            >
              <Poster src={item.image} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.meta}</p>
              </div>
              <span className="shrink-0 rounded bg-[#25262a] px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase">
                {item.type}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
