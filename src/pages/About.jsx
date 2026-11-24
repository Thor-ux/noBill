import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle.js";
import { SITE_NAME } from "../site.js";
import { ContactPanel, Hero, ICONS, Steps } from "../components/InfoPage.jsx";

const COLLECTIONS = [
  { label: "Recently Added", note: "Filtered by highest rating and year of release", to: "/" },
  { label: "Sci-Fi Classics", to: "/" },
  { label: "Top Rated TV Shows", to: "/tv" },
  { label: "Discover", to: "/" },
  { label: "Superhero Movies", to: "/" },
];

const STEPS = [
  {
    icon: ICONS.browse,
    title: "Choose a movie or TV show",
    text: "Browse the site using the “Movies” and “TV Shows” tabs, or the search button. Suggestions always appear at the top as you type what you want to watch.",
    actions: [
      { to: "/movies", label: "Movies" },
      { to: "/tv", label: "TV Shows" },
      { to: "/search", label: "Search" },
    ],
  },
  {
    icon: ICONS.play,
    title: "Start the stream",
    text: "Found a movie or TV show? Click its poster. A “Watch Now” button is waiting on the movie or TV show page. You can choose from multiple subtitle languages.",
    badges: ["▶ Watch Now", "CC Subtitles"],
  },
  {
    icon: ICONS.idea,
    title: "Make a suggestion",
    text: "Is a specific movie or TV show missing? Let us know—we read every suggestion!",
    mail: { subject: `Suggestion for ${SITE_NAME}`, label: "Suggest a title" },
  },
];

export default function About() {
  useTitle("About Us");

  return (
    <main className="about-page">
      <Hero eyebrow="About the Project" title="Wherever there are movies—and TV shows—" accent="we’re there.">
        {SITE_NAME} is a project created by movie and TV show fans. After yet another stream froze on a similar
        platform, we decided to build our own.
      </Hero>

      <section className="about-story">
        <div className="about-card">
          <h2>Built for smooth streaming</h2>
          <p>
            Our top priority is stream quality: we use powerful servers so you can watch your favorite movies
            and TV shows comfortably.
          </p>
          <p>
            We started with <strong>Recently Added</strong>, filtered by highest rating and year of release,
            and we’re gradually adding the movies and TV shows you want to see.
          </p>
        </div>

        <div className="about-card">
          <h2>What’s on {SITE_NAME}</h2>
          <ul className="about-collections">
            {COLLECTIONS.map((c) => (
              <li key={c.label}>
                <Link to={c.to}>
                  <span className="about-dot" aria-hidden="true" />
                  <span>
                    {c.label}
                    {c.note && <small>{c.note}</small>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Steps id="how-it-works" heading="How It Works" items={STEPS} />

      <ContactPanel
        title="Contact Us"
        text="Have questions? Send us an email—we’ll get back to you."
        subject={`Question for ${SITE_NAME}`}
      />
    </main>
  );
}
