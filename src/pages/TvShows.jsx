import { ShowGrid } from "../components/ShowSection.jsx";
import LoadMore from "../components/LoadMore.jsx";
import { usePagedList } from "../hooks/usePagedList.js";
import { getAiringToday, getTopShows } from "../api/tvmaze.js";
import { useTitle } from "../hooks/useTitle.js";

const SHOWS_PER_PAGE = 36;

async function loadShowPage(page) {
  try {
    const [airing, top] = await Promise.all([
      page === 0 ? getAiringToday("US", 12) : [],
      getTopShows(page, SHOWS_PER_PAGE),
    ]);
    const shows = [...airing, ...top];
    return shows.length ? shows : null;
  } catch (err) {
    if (err.message.includes("404")) return null;
    throw err;
  }
}

export default function TvShows() {
  useTitle("TV Shows");
  const { items, loading, error, done, loadMore } = usePagedList(loadShowPage, (s) => s.id);

  return (
    <main className="container">
      <section className="movie-section">
        <h2>TV Shows</h2>
        {items.length > 0 && <ShowGrid shows={items} />}
        <LoadMore loading={loading} error={error} done={done} onClick={loadMore} />
      </section>
    </main>
  );
}
