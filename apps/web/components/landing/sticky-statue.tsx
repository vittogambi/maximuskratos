type GradientDir = 'to-b' | 'to-t';

/** Estatua de fondo, pineada por scroll (`.ag-sticky-bg`), con velo de degradado hacia la sección siguiente. */
export function StickyStatue({
  src,
  alt,
  imgOpacity,
  gradientDir,
  gradientFrom,
  gradientVia,
  gradientTo,
  hasBg,
  variant = 'default',
}: {
  src: string;
  alt: string;
  imgOpacity: number;
  gradientDir: GradientDir;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  hasBg?: boolean;
  variant?: 'default' | 'crisis';
}) {
  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: gradientVia
      ? `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientVia}, ${gradientTo})`
      : `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientTo})`,
  };

  const isCrisis = variant === 'crisis';

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    objectFit: 'cover',
    ...(isCrisis ? {} : { objectPosition: 'center' }),
    opacity: imgOpacity,
  };

  return (
    <div
      className={isCrisis ? 'ag-sticky-bg ag-crisis-bg' : 'ag-sticky-bg'}
      style={hasBg ? { backgroundColor: '#0e0e0e' } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={isCrisis ? 'ag-crisis-bg__img' : undefined}
        style={imgStyle}
      />
      <div style={gradientStyle} />
    </div>
  );
}
