import MovieCard from "./MovieCard.jsx";
import { Loading, ErrorMessage } from "./Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { searchMovies, posterOrFallback } from "../api/omdb.js";

export default function MovieSection({ title, query, limit = 6 }) {
  const { loading, data, error } = useAsync(() => searchMovies(query), [query]);

  return (
    <section className="movie-section">
      <h2>{title}</h2>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      {data && <MovieGrid movies={data.slice(0, limit)} />}
    </section>
  );
}

export function MovieGrid({ movies }) {
  if (!movies.length) return <p className="text-zinc-400">No movies found.</p>;
  return (
    <div className="movie-grid">
      {movies.map((m) => (
        <MovieCard
          key={m.imdbID}
          to={`/movie/${m.imdbID}`}
          image={posterOrFallback(m.Poster)}
          title={m.Title}
          subtitle={m.Year}
        />
      ))}
    </div>
  );
}
