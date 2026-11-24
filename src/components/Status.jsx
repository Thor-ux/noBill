export function Loading() {
  return <p className="text-zinc-400">Loading...</p>;
}

export function ErrorMessage({ message }) {
  return <p className="text-red-400">⚠ {message}</p>;
}
