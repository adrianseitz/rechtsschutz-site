"use client";
import dynamic from "next/dynamic";

const Shield3D = dynamic(() => import("./Shield3D"), { ssr: false });

export function ShieldScene({ className }: { className?: string }) {
  return <Shield3D className={className} />;
}
