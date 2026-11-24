import { useTitle } from "../hooks/useTitle.js";
import { SITE_NAME } from "../site.js";
import { ContactPanel, Hero, ICONS, Steps } from "../components/InfoPage.jsx";

const REQUIREMENTS = [
  {
    icon: ICONS.document,
    title: "Proof of rights",
    text: "A document or other evidence confirming that you own the rights to the content or are acting on behalf of the rights holder.",
  },
  {
    icon: ICONS.link,
    title: "Specific links",
    text: `Direct URLs to the ${SITE_NAME} pages where the material in question is located.`,
  },
  {
    icon: ICONS.shield,
    title: "Description of the infringement",
    text: "Specify which protected asset is involved (e.g., a film, episode, recording, logo, or other material).",
  },
  {
    icon: ICONS.user,
    title: "Contact information",
    text: "Your name, organization, and an email address where we can send our response.",
  },
];

export default function RightsHolders() {
  useTitle("Rights Holders · DMCA");

  return (
    <main className="about-page">
      <Hero eyebrow="Rights Holders · DMCA" title="Respecting Intellectual Property">
        {SITE_NAME} does not host or store video content on its servers; videos are embedded from third-party
        sources, and our own pages contain only descriptions, posters, and ratings. If you are a rights holder and
        believe that any material infringes upon your rights, please submit a request—we will review it and
        remove the links in question.
      </Hero>

      <Steps heading="What to include in your request" items={REQUIREMENTS} columns={2} />

      <ContactPanel
        title="Where to send your request"
        text="Requests are reviewed in the order they are received."
        subject={`Rights holder request (DMCA) — ${SITE_NAME}`}
        button="Send a request"
      />
    </main>
  );
}
