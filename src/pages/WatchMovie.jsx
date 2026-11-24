import { Link, useParams } from "react-router-dom";
import Player from "../components/Player.jsx";
import ShareBar from "../components/ShareBar.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getMovie } from "../api/omdb.js";
import { isMovieAvailable, movieEmbedUrl } from "../api/vidsrc.js";
import { useTitle } from "../hooks/useTitle.js";

export default function WatchMovie() {
  const { imdbId } = useParams();
  const { data: movie } = useAsync(() => getMovie(imdbId), [imdbId]);
  const { loading: checking, data: available } = useAsync(() => isMovieAvailable(imdbId).catch(() => true), [imdbId]);
  useTitle(movie ? `Watch ${movie.Title}` : null);

  return (
    <main className="watch-page">
      <Link to={`/movie/${imdbId}`} className="text-sm text-zinc-400 hover:text-white">← Back to details</Link>
      <h1 className="mt-3 text-2xl font-bold">{movie ? `${movie.Title} (${movie.Year})` : "Loading..."}</h1>
      {checking ? null : available ? (
        <>
          <Player src={movieEmbedUrl(imdbId)} title={movie?.Title} />
          <ShareBar title={movie ? `${movie.Title} (${movie.Year})` : null} />
        </>
      ) : (
        <p className="mt-6 text-amber-400">This title isn't available to stream.</p>
      )}
    </main>
  );
}
