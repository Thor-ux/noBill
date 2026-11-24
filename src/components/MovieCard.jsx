import { Link } from "react-router-dom";
import Poster from "./Poster.jsx";

export default function MovieCard({ to, image, title, subtitle }) {
  return (
    <Link to={to} className="movie-card">
      <div className="poster-wrapper">
        <Poster className="poster-image" src={image} alt={title} loading="lazy" />
      </div>
      <div className="movie-info">
        <h3 className="truncate">{title}</h3>
        <p>{subtitle}</p>
      </div>
    </Link>
  );
}
