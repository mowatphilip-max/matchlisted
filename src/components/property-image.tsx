// Listing photo, or a soft branded placeholder when the seller hasn't
// uploaded photography yet (sample data ships without photos).

import Image from "next/image";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Brand grounds (Anchor, Anchor deep, Precision) with a Signal or
// Precision glow, picked per home so a grid of covers reads as designed.
const covers = [
  { ground: "linear-gradient(135deg, #3d4f61 0%, #2c3947 100%)", glow: "#e8693a" },
  { ground: "linear-gradient(135deg, #2c3947 0%, #1977a3 100%)", glow: "#3aadda" },
  { ground: "linear-gradient(135deg, #1e8fc4 0%, #2c3947 100%)", glow: "#e8693a" },
  { ground: "linear-gradient(135deg, #3d4f61 0%, #1e8fc4 100%)", glow: "#3aadda" },
  { ground: "linear-gradient(135deg, #2c3947 0%, #3d4f61 100%)", glow: "#e8693a" },
];

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function PropertyImage({
  src,
  alt,
  placeholderKey,
  className,
}: {
  src?: string | null;
  alt: string;
  placeholderKey: string;
  className?: string;
}) {
  if (src) {
    // Seller-uploaded photos live in the store as data: URLs (prototype);
    // next/image rejects those, so render them with a plain img.
    if (src.startsWith("data:")) {
      return (
        <div className={cn("relative overflow-hidden", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    );
  }
  // No photography: a designed brand cover rather than an empty box. A Hush
  // Home is private by default, so the cover says so instead of pretending
  // to be a photo.
  const cover = covers[hashKey(placeholderKey) % covers.length];
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: cover.ground }}
      role="img"
      aria-label={alt}
    >
      <div
        className="absolute -right-1/4 -top-1/3 h-[120%] w-[80%] rounded-full opacity-40 blur-3xl"
        style={{ background: cover.glow }}
        aria-hidden
      />
      <svg
        viewBox="0 0 120 100"
        className="absolute left-1/2 top-1/2 h-[58%] max-h-40 -translate-x-1/2 -translate-y-[58%] text-white/85"
        fill="none"
        aria-hidden
      >
        <path
          d="M14 50 L60 12 L106 50 M26 42 V88 H94 V42"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M60 76 C60 76 44 66 44 55.5 C44 50 48 46.5 52.5 46.5 C56 46.5 58.6 48.6 60 51 C61.4 48.6 64 46.5 67.5 46.5 C72 46.5 76 50 76 55.5 C76 66 60 76 60 76 Z"
          fill="#e8693a"
        />
      </svg>
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
        <Lock className="h-3 w-3" strokeWidth={2.2} />
        Hush Home · private listing
      </span>
    </div>
  );
}
