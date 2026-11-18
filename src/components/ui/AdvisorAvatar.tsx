/** Kleines Foto von Adrian (ganzes Bild, Hochformat) – für Stellen, an denen ein Mensch Vertrauen schafft. */
export function AdvisorAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  const height = Math.round(size * 1.25);
  return (
    <picture className={`block shrink-0 overflow-hidden rounded-[10px] border border-navy/15 bg-paper ${className}`} style={{ width: size, height }}>
      <source srcSet="/images/adrian-thumb.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/adrian-thumb.jpg" alt="Adrian Seitz" width={size} height={height} loading="eager" decoding="async" className="h-full w-full object-cover object-top" />
    </picture>
  );
}
