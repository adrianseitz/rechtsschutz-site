import {
  Shield, ShieldCheck, Briefcase, House, Building2, Building, Layers, Car, KeyRound, Landmark, GraduationCap, Laptop,
  UserCheck, Users, Heart, Store, Sparkles, Calendar, Clock, Info, CircleCheck, Ban, HelpCircle, Scale, FileText,
  Lock, Handshake, Eye, MessageCircle, ClipboardCheck, Search, Phone, Mail, Gavel, Receipt, FileSignature, Coins, BadgeCheck,
  ShoppingBag, Wallet, Hammer, Award, DoorOpen, PenLine, Mailbox,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Shield, ShieldCheck, Briefcase, House, Building2, Building, Layers, Car, KeyRound, Landmark, GraduationCap, Laptop,
  UserCheck, Users, Heart, Store, Sparkles, Calendar, Clock, Info, CircleCheck, Ban, HelpCircle, Scale, FileText,
  Lock, Handshake, Eye, MessageCircle, ClipboardCheck, Search, Phone, Mail, Gavel, Receipt, FileSignature, Coins, BadgeCheck,
  ShoppingBag, Wallet, Hammer, Award, DoorOpen, PenLine, Mailbox,
};

export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = (name && map[name]) || Shield;
  return <C className={className} aria-hidden strokeWidth={1.8} />;
}
