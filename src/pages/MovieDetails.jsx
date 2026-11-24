import { Link, useParams } from "react-router-dom";
import Poster from "../components/Poster.jsx";
import { Loading, ErrorMessage } from "../components/Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getMovie, posterOrFallback } from "../api/omdb.js";
import { isMovieAvailable } from "../api/vidsrc.js";
import { useTitle } from "../hooks/useTitle.js";

export default function MovieDetails() {
  const { imdbId } = useParams();
  const { loading, data, error } = useAsync(
    () => Promise.all([getMovie(imdbId), isMovieAvailable(imdbId).catch(() => true)]),
    [imdbId]
  );
  useTitle(data?.[0] ? `${data[0].Title} (${data[0].Year})` : null);

  if (loading) return <div className="container"><Loading /></div>;
  if (error) return <div className="container"><ErrorMessage message={error} /></div>;

  const [movie, available] = data;

  return (
    <main className="details-page">
      <Poster className="details-poster" src={posterOrFallback(movie.Poster)} alt={movie.Title} />

      <div className="details-info">
        <h1 className="mb-3 font-bold">{movie.Title}</h1>
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-zinc-400">
          <span>{movie.Year}</span>
          <span>{movie.Rated}</span>
          <span>{movie.Runtime}</span>
          {movie.imdbRating !== "N/A" && <span>★ {movie.imdbRating}/10</span>}
        </div>

        <p>{movie.Plot}</p>

        <dl className="my-5 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-zinc-500">Genre</dt><dd>{movie.Genre}</dd>
          <dt className="text-zinc-500">Director</dt><dd>{movie.Director}</dd>
          <dt className="text-zinc-500">Cast</dt><dd>{movie.Actors}</dd>
          <dt className="text-zinc-500">Language</dt><dd>{movie.Language}</dd>
        </dl>

        {available ? (
          <Link to={`/watch/movie/${movie.imdbID}`} className="watch-button">▶ Watch Now</Link>
        ) : (
          <p className="text-amber-400">This movie isn't in the vidsrc catalog yet.</p>
        )}
      </div>
    </main>
  );
}
