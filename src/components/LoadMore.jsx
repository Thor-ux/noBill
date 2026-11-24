import { Loading, ErrorMessage } from "./Status.jsx";

export default function LoadMore({ loading, error, done, onClick }) {
  return (
    <div className="mt-8 text-center">
      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      {!loading && !done && (
        <button onClick={onClick} className="watch-button cursor-pointer">
          {error ? "Try again" : "Load more"}
        </button>
      )}
    </div>
  );
}
