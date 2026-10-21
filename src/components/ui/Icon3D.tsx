import { Icon } from "./Icon";

/** 3D-Icons (Microsoft Fluent Emoji 3D, MIT-Lizenz) aus /public/3d. */
export const ICON3D = [
  "authority", "bell", "briefcase", "bulb", "calendar", "car", "chart", "chat", "check", "coin", "document", "envelope",
  "handshake", "hourglass", "house", "key", "laptop", "lock", "memo", "mobile", "moneybag", "office", "oldkey",
  "package", "phone", "receipt", "scale", "shield", "shop", "sparkles", "star", "stopwatch", "store", "tabs", "worker",
] as const;
export type Icon3DName = (typeof ICON3D)[number];

/** Zuordnung der bisher verwendeten Lucide-Namen zu 3D-Icons. */
const FROM_LUCIDE: Record<string, Icon3DName> = {
  Briefcase: "briefcase", Shield: "shield", House: "house", Building2: "office", Building: "office", Layers: "tabs",
  Landmark: "authority", Laptop: "laptop", UserCheck: "worker", Store: "shop", Sparkles: "sparkles", Calendar: "calendar",
  Clock: "hourglass", Info: "bulb", CircleCheck: "check", HelpCircle: "chat", Car: "car", KeyRound: "key", Users: "handshake",
  FileText: "document", Receipt: "receipt", Scale: "scale", Coins: "moneybag", ShoppingBag: "package", MessageCircle: "chat",
  Mailbox: "envelope", DoorOpen: "envelope", Award: "star", Wallet: "moneybag", FileSignature: "memo", Gavel: "scale",
  GraduationCap: "memo",
};

export function Icon3D({ name, size = 48, className = "", alt = "", priority = false }: { name: Icon3DName | string; size?: number; className?: string; alt?: string; priority?: boolean }) {
  const file = (ICON3D as readonly string[]).includes(name) ? name : FROM_LUCIDE[name];
  if (!file) return <Icon name={name} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/3d/${file}.webp`} width={size} height={size} alt={alt} aria-hidden={alt ? undefined : true}
      loading={priority ? "eager" : "lazy"} decoding="async" draggable={false}
      className={`select-none drop-shadow-[0_10px_14px_rgba(11,11,10,0.18)] ${className}`} style={{ width: size, height: size }} />
  );
}
