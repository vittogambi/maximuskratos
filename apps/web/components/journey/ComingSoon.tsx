export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="mk-dashboard">
      <div className="mk-progress-hero">
        <p className="mk-section-eyebrow">PRÓXIMAMENTE</p>
        <h1 className="mk-page-title">{title}</h1>
        <p className="mk-progress-hero__sub">{body}</p>
      </div>
    </div>
  );
}
