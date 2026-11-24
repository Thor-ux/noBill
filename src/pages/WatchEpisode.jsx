import { Link, useParams } from "react-router-dom";
import Player from "../components/Player.jsx";
import ShareBar from "../components/ShareBar.jsx";
import { Loading, ErrorMessage } from "../components/Status.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getShow } from "../api/tvmaze.js";
import { episodeEmbedUrl, isShowAvailable } from "../api/vidsrc.js";
import { useTitle } from "../hooks/useTitle.js";

export default function WatchEpisode() {
  const { showId, season, episode } = useParams();
  const { loading, data, error } = useAsync(async () => {
    const show = await getShow(showId);
    const available = await isShowAvailable(show.externals?.imdb).catch(() => Boolean(show.externals?.imdb));
    return { show, available };
  }, [showId]);
  const show = data?.show;
  useTitle(show ? `${show.name} S${season}E${episode}` : null);

  if (loading) return <div className="watch-page"><Loading /></div>;
  if (error) return <div className="watch-page"><ErrorMessage message={error} /></div>;

  const episodes = show._embedded.episodes.filter((e) => e.number);
  const index = episodes.findIndex((e) => e.season === +season && e.number === +episode);
  const current = episodes[index];
  const prev = episodes[index - 1];
  const next = episodes[index + 1];
  const epLink = (e) => `/watch/tv/${showId}/${e.season}/${e.number}`;

  return (
    <main className="watch-page">
      <Link to={`/tv/${showId}?season=${season}`} className="text-sm text-zinc-400 hover:text-white">
        ← Back to {show.name}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{show.name}</h1>
      <p className="text-zinc-400">
        S{season} E{episode}{current ? ` — ${current.name}` : ""}
      </p>

      {data.available ? (
        <>
          <Player src={episodeEmbedUrl(show.externals.imdb, season, episode)} title={current?.name} />
          <ShareBar title={`${show.name} S${season}E${episode}`} />
        </>
      ) : (
        <p className="mt-6 text-amber-400">This show isn't available to stream.</p>
      )}

      <div className="mt-4 flex justify-between">
        {prev ? <Link to={epLink(prev)} className="season-button">← Previous</Link> : <span />}
        {next && <Link to={epLink(next)} className="season-button">Next →</Link>}
      </div>
    </main>
  );
}
