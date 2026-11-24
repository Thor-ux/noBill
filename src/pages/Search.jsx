import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MovieGrid } from "../components/MovieSection.jsx";
import { ShowGrid } from "../components/ShowSection.jsx";
import SearchSuggestions, { buildSuggestions } from "../components/SearchSuggestions.jsx";
import { Loading, ErrorMessage } from "../components/Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { searchMovies } from "../api/omdb.js";
import { searchShows } from "../api/tvmaze.js";
import { useTitle } from "../hooks/useTitle.js";

const MIN_CHARS = 2;

async function searchBoth(q) {
  const [movies, shows] = await Promise.all([
    searchMovies(q).catch((err) => (err.tooShort ? { hint: err.message } : Promise.reject(err))),
    searchShows(q),
  ]);
  return Array.isArray(movies) ? { movies, shows } : { movies: [], shows, hint: movies.hint };
}

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  useTitle(query ? `Search: ${query}` : "Search");
  const [input, setInput] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const typed = useDebounce(input.trim(), 300);
  const showDropdown = open && typed.length >= MIN_CHARS;
  const suggest = useAsync(
    () => (typed.length >= MIN_CHARS ? searchBoth(typed) : Promise.resolve(null)),
    [typed]
  );
  const items = suggest.data ? buildSuggestions(suggest.data.movies, suggest.data.shows) : [];
  useEffect(() => {
    setActive(-1);
  }, [typed]);

  const results = useAsync(() => (query ? searchBoth(query) : Promise.resolve(null)), [query]);

  function submit(e) {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      navigate(items[active].to);
      return;
    }
    const q = input.trim();
    if (q) setParams({ q });
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!showDropdown || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <main className="container">
      <form onSubmit={submit} className="relative mb-10 flex gap-3">
        <div className="relative flex-1">
          <input
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            placeholder="Search movies and TV shows..."
            className="w-full rounded-lg border border-[#25262a] bg-[#202126] px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
          {showDropdown && (
            <SearchSuggestions
              items={items}
              active={active}
              loading={suggest.loading || typed !== input.trim()}
              hint={suggest.error || (items.length === 0 && suggest.data?.hint)}
              onPick={() => setOpen(false)}
            />
          )}
        </div>
        <button type="submit" className="watch-button !m-0 cursor-pointer">Search</button>
      </form>

      {query && results.loading && <Loading />}
      {results.error && <ErrorMessage message={results.error} />}
      {results.data && (
        <>
          <section className="movie-section">
            <h2>Movies</h2>
            {results.data.hint ? (
              <p className="text-zinc-400">{results.data.hint}</p>
            ) : (
              <MovieGrid movies={results.data.movies} />
            )}
          </section>
          <section className="movie-section">
            <h2>TV Shows</h2>
            <ShowGrid shows={results.data.shows} />
          </section>
        </>
      )}
    </main>
  );
}
