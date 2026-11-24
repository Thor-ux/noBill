import MovieCard from "./MovieCard.jsx";
import { Loading, ErrorMessage } from "./Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { showImage } from "../api/tvmaze.js";

export default function ShowSection({ title, fetcher, deps = [] }) {
  const { loading, data, error } = useAsync(fetcher, deps);

  return (
    <section className="movie-section">
      <h2>{title}</h2>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      {data && <ShowGrid shows={data} />}
    </section>
  );
}

export function ShowGrid({ shows }) {
  if (!shows.length) return <p className="text-zinc-400">No shows found.</p>;
  return (
    <div className="movie-grid">
      {shows.map((s) => (
        <MovieCard
          key={s.id}
          to={`/tv/${s.id}`}
          image={showImage(s)}
          title={s.name}
          subtitle={[s.premiered?.slice(0, 4), s.rating?.average && `★ ${s.rating.average}`]
            .filter(Boolean)
            .join(" • ")}
        />
      ))}
    </div>
  );
}
