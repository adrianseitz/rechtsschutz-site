/** Rundes Foto von Adrian – für Stellen, an denen ein Mensch Vertrauen schafft (erster Bildschirm, Rückruf). */
export function AdvisorAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <picture className={`block shrink-0 overflow-hidden rounded-full border border-navy/15 bg-paper ${className}`} style={{ width: size, height: size }}>
      <source srcSet="/images/adrian-avatar.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/adrian-avatar.jpg" alt="Adrian Seitz" width={size} height={size} loading="eager" decoding="async" className="h-full w-full object-cover" />
    </picture>
  );
}
