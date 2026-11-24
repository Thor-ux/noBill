import { MovieGrid } from "../components/MovieSection.jsx";
import LoadMore from "../components/LoadMore.jsx";
import { usePagedList } from "../hooks/usePagedList.js";
import { isFatalOmdbError, searchMovies } from "../api/omdb.js";
import { getRecentlyAdded } from "../api/recent.js";
import { useTitle } from "../hooks/useTitle.js";

const TERMS = [
  "Avengers", "Spider-Man", "Batman", "Harry Potter", "Star Wars", "Fast and Furious",
  "John Wick", "Mission Impossible", "Toy Story", "Lord of the Rings", "Jurassic",
  "Transformers", "Pirates of the Caribbean", "Hunger Games", "Matrix", "Shrek",
  "James Bond", "Rocky", "Terminator", "Alien", "Godzilla", "Despicable Me",
  "Frozen", "X-Men", "Guardians of the Galaxy", "Iron Man", "Thor", "Captain America",
  "Deadpool", "Joker", "Superman", "Kung Fu Panda", "Ice Age", "Madagascar",
  "Indiana Jones", "Back to the Future", "Die Hard", "Planet of the Apes",
  "Mad Max", "Kingsman", "Dune", "Avatar", "Insidious", "Conjuring", "Scream",
];
const TERMS_PER_PAGE = 4;

async function loadMoviePage(page) {
  const terms = TERMS.slice(page * TERMS_PER_PAGE, (page + 1) * TERMS_PER_PAGE);
  if (!terms.length) return null;
  const lists = await Promise.all([
    page === 0 ? getRecentlyAdded(12) : [],
    ...terms.map((t) => searchMovies(t).catch((err) => (isFatalOmdbError(err) ? err : []))),
  ]);
  const fatal = lists.find((l) => l instanceof Error);
  const movies = lists.filter(Array.isArray).flat();
  if (fatal && !movies.length) throw fatal;
  return movies;
}

export default function Movies() {
  useTitle("Movies");
  const { items, loading, error, done, loadMore } = usePagedList(loadMoviePage, (m) => m.imdbID);

  return (
    <main className="container">
      <section className="movie-section">
        <h2>Movies</h2>
        {items.length > 0 && <MovieGrid movies={items} />}
        <LoadMore loading={loading} error={error} done={done} onClick={loadMore} />
      </section>
    </main>
  );
}
