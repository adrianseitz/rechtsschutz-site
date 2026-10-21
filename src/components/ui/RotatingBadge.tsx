/** Rundes Siegel mit umlaufendem Text und Paragrafenzeichen in der Mitte. */
export function RotatingBadge({ text = "Kostenlos · Unverbindlich · Persönlich · ", size = 132, className = "", dark = false }: { text?: string; size?: number; className?: string; dark?: boolean }) {
  const id = `circle-${size}-${dark ? "d" : "l"}`;
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin_slow motion-reduce:animate-none">
        <defs><path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
        <circle cx="100" cy="100" r="98" fill={dark ? "#0B0B0A" : "#FFD60A"} />
        <circle cx="100" cy="100" r="62" fill="none" stroke={dark ? "rgba(255,255,255,0.25)" : "rgba(11,11,10,0.25)"} strokeDasharray="2 5" />
        <text fill={dark ? "#FFFFFF" : "#0B0B0A"} style={{ fontFamily: '"Geist Mono Variable", monospace', fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <textPath href={`#${id}`}>{(text + text).toUpperCase()}</textPath>
        </text>
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-serif text-[2.6em] italic leading-none ${dark ? "text-sun" : "text-navy"}`} style={{ fontSize: size * 0.34 }}>§</span>
    </div>
  );
}
