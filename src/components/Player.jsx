export default function Player({ src, title = "Player" }) {
  return (
    <div className="player-container">
      <iframe
        key={src}
        src={src}
        title={title}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="origin"
      />
    </div>
  );
}
