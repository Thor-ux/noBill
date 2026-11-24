import { useTitle } from "../hooks/useTitle.js";
import { SITE_NAME } from "../site.js";
import { ContactPanel, Hero, ICONS, Steps } from "../components/InfoPage.jsx";

const FORMATS = [
  {
    icon: ICONS.banner,
    title: "Banners on watch pages",
    text: "Available for both desktop and mobile, these ads are displayed next to the video player—at the very moment audience engagement is at its peak.",
  },
  {
    icon: ICONS.flag,
    title: "Section branding",
    text: "Feature your brand on a specific collection, such as Recently Added, Top Rated TV Shows, or Superhero Movies, for a week or an entire month.",
  },
  {
    icon: ICONS.grid,
    title: "Native placements in the catalog",
    text: "Integrated cards within the movie and TV show grids, designed to match the site’s look.",
  },
  {
    icon: ICONS.send,
    title: "Telegram channel posts",
    text: "Reach the subscribers who follow our new-release announcements—perfect for integrations around the week’s biggest releases.",
  },
];

export default function Advertising() {
  useTitle("Advertising");

  return (
    <main className="about-page">
      <Hero eyebrow="Advertising on the Site" title="An audience watching movies and TV shows " accent="in real time.">
        {SITE_NAME} offers access to a live audience of movie and TV show fans at peak moments—such as new
        additions and the highest-rated releases. Your ads appear exactly where audience attention is most
        focused: right alongside the player. We are always open to new partnerships!
      </Hero>

      <Steps heading="Ad Formats" items={FORMATS} columns={2} />

      <ContactPanel
        title="Discuss advertising opportunities"
        text="For advertising inquiries, please reach out via email:"
        subject={`Advertising inquiry — ${SITE_NAME}`}
        button="Email us"
      />
    </main>
  );
}
