import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle.js";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <main className="container text-center">
      <h1 className="mt-10 mb-3 text-3xl font-bold">404</h1>
      <p className="mb-6 text-zinc-400">This page doesn't exist.</p>
      <Link to="/" className="watch-button">Go home</Link>
    </main>
  );
}
