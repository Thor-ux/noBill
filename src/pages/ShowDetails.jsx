import { Link, useParams, useSearchParams } from "react-router-dom";
import Poster from "../components/Poster.jsx";
import { Loading, ErrorMessage } from "../components/Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getShow, showImage, stripHtml } from "../api/tvmaze.js";
import { isShowAvailable } from "../api/vidsrc.js";
import { useTitle } from "../hooks/useTitle.js";

export default function ShowDetails() {
  const { showId } = useParams();
  const [params, setParams] = useSearchParams();
  const { loading, data, error } = useAsync(async () => {
    const show = await getShow(showId);
    const available = await isShowAvailable(show.externals?.imdb).catch(() => Boolean(show.externals?.imdb));
    return [show, available];
  }, [showId]);
  useTitle(data?.[0]?.name ?? null);

  if (loading) return <div className="container"><Loading /></div>;
  if (error) return <div className="container"><ErrorMessage message={error} /></div>;

  const [show, canStream] = data;
  const seasons = show._embedded.seasons.filter((s) => s.episodeOrder !== 0);
  const activeSeason = Number(params.get("season")) || seasons[0]?.number;
  const episodes = show._embedded.episodes.filter((e) => e.season === activeSeason && e.number);
  const firstEpisode = show._embedded.episodes.find((e) => e.season === seasons[0]?.number && e.number);

  return (
    <main className="details-page">
      <Poster className="details-poster" src={showImage(show)} alt={show.name} />

      <div className="details-info min-w-0">
        <h1 className="mb-3 font-bold">{show.name}</h1>
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-zinc-400">
          <span>{show.premiered?.slice(0, 4)}</span>
          <span>{show.genres.join(", ")}</span>
          <span>{show.status}</span>
          {show.rating?.average && <span>★ {show.rating.average}/10</span>}
        </div>

        <p>{stripHtml(show.summary)}</p>

        {canStream && firstEpisode && (
          <Link to={`/watch/tv/${show.id}/${firstEpisode.season}/${firstEpisode.number}`} className="watch-button">
            ▶ Watch Now
          </Link>
        )}
        {!canStream && (
          <p className="text-amber-400">This show isn't in the vidsrc catalog, so it can't be streamed.</p>
        )}

        <h2 className="mt-6 mb-2 text-xl font-bold">Seasons</h2>
        <div className="season-list">
          {seasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setParams({ season: s.number })}
              className={`season-button cursor-pointer ${
                s.number === activeSeason ? "" : "!bg-[#202126] !text-white"
              }`}
            >
              Season {s.number}
            </button>
          ))}
        </div>

        <h2 className="mt-6 mb-3 text-xl font-bold">Episodes</h2>
        <ul className="flex flex-col gap-2">
          {episodes.map((ep) => {
            const row = (
              <>
                <span className="w-10 shrink-0 font-bold text-zinc-500">E{ep.number}</span>
                <span className="flex-1 truncate">{ep.name}</span>
                <span className="shrink-0 text-xs text-zinc-500">{ep.airdate}</span>
              </>
            );
            const cls = "flex items-center gap-3 rounded-lg bg-[#202126] px-4 py-3 text-sm";
            return (
              <li key={ep.id}>
                {canStream ? (
                  <Link
                    to={`/watch/tv/${show.id}/${ep.season}/${ep.number}`}
                    className={`${cls} hover:bg-[#2a2b31]`}
                  >
                    {row}
                  </Link>
                ) : (
                  <div className={cls}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
