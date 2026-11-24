import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Home from "./pages/Home.jsx";
import Movies from "./pages/Movies.jsx";
import TvShows from "./pages/TvShows.jsx";
import Search from "./pages/Search.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import ShowDetails from "./pages/ShowDetails.jsx";
import WatchMovie from "./pages/WatchMovie.jsx";
import WatchEpisode from "./pages/WatchEpisode.jsx";
import NotFound from "./pages/NotFound.jsx";
import About from "./pages/About.jsx";
import RightsHolders from "./pages/RightsHolders.jsx";
import Advertising from "./pages/Advertising.jsx";

export default function App() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-75px)] flex-col *:w-full">
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TvShows />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:imdbId" element={<MovieDetails />} />
            <Route path="/tv/:showId" element={<ShowDetails />} />
            <Route path="/watch/movie/:imdbId" element={<WatchMovie />} />
            <Route path="/watch/tv/:showId/:season/:episode" element={<WatchEpisode />} />
            <Route path="/about" element={<About />} />
            <Route path="/rights-holders" element={<RightsHolders />} />
            <Route path="/dmca" element={<Navigate to="/rights-holders" replace />} />
            <Route path="/advertising" element={<Advertising />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <div aria-hidden="true" className="h-16 shrink-0 max-[599px]:h-12" />
        <Footer />
      </div>
    </>
  );
}
