import { filterStreamableShows } from "./vidsrc.js";

const BASE_URL = "https://api.tvmaze.com";

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`TVmaze request failed (${res.status})`);
  return res.json();
}

export async function getTopShows(page = 1, limit = 12) {
  const shows = await filterStreamableShows(await request(`/shows?page=${page}`));
  return shows
    .filter((s) => s.image)
    .sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0))
    .slice(0, limit);
}

export async function getAiringToday(country = "US", limit = 12) {
  const episodes = await request(`/schedule?country=${country}`);
  const seen = new Set();
  const shows = [];
  for (const ep of episodes) {
    const show = ep.show;
    if (!show?.image || !show.externals?.imdb || seen.has(show.id)) continue;
    seen.add(show.id);
    shows.push(show);
  }
  return (await filterStreamableShows(shows)).slice(0, limit);
}

export async function searchShows(query) {
  const results = await request(`/search/shows?q=${encodeURIComponent(query)}`);
  return filterStreamableShows(results.map((r) => r.show));
}

export function getShow(id) {
  return request(`/shows/${id}?embed[]=seasons&embed[]=episodes`);
}

export function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, "") : "No summary available.";
}

export function showImage(show) {
  return show?.image?.original || show?.image?.medium || "/no-poster.svg";
}
