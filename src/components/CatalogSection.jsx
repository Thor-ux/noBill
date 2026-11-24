import { MovieGrid } from "./MovieSection.jsx";
import { Loading, ErrorMessage } from "./Status.jsx";
import { useAsync } from "../hooks/useAsync.js";

export default function CatalogSection({ title, load, deps = [] }) {
  const { loading, data, error } = useAsync(load, deps);

  return (
    <section className="movie-section">
      <h2>{title}</h2>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      {data && <MovieGrid movies={data} />}
    </section>
  );
}
