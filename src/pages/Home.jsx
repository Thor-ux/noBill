import MovieSection from "../components/MovieSection.jsx";
import ShowSection from "../components/ShowSection.jsx";
import CatalogSection from "../components/CatalogSection.jsx";
import { getAiringToday, getTopShows } from "../api/tvmaze.js";
import { getDiscover, getRecentlyAdded } from "../api/recent.js";
import { useTitle } from "../hooks/useTitle.js";

const HOME_ROW = 6;

export default function Home() {
  useTitle(null);
  return (
    <main className="container">
      <CatalogSection title="Recently Added" load={() => getRecentlyAdded(HOME_ROW)} />
      <ShowSection title="Airing Today" fetcher={() => getAiringToday("US", HOME_ROW)} />
      <MovieSection title="Superhero Movies" query="Avengers" limit={HOME_ROW} />
      <CatalogSection title="Discover" load={() => getDiscover(HOME_ROW)} />
      <ShowSection title="Top Rated TV Shows" fetcher={() => getTopShows(1, HOME_ROW)} />
      <MovieSection title="Sci-Fi Classics" query="Star Wars" limit={HOME_ROW} />
    </main>
  );
}
