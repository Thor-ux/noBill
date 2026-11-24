import { apiGet } from "./server.js";

export async function getRecentlyAdded(count = 6) {
  const { movies } = await apiGet("/api/recent");
  return movies.slice(0, count);
}

export async function getDiscover(count = 6) {
  const { movies } = await apiGet("/api/discover");
  return movies.slice(0, count);
}
