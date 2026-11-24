export async function apiGet(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Server error (${res.status})`);
    err.limit = data?.code === "limit";
    err.fatal = data?.code === "limit" || data?.code === "config";
    throw err;
  }
  return data;
}
