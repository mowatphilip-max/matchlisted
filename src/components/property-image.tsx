// Listing photo, or a soft branded placeholder when the seller hasn't
// uploaded photography yet (sample data ships without photos).

import Image from "next/image";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

const placeholderGrounds = [
  "from-orange-tint to-soft",
  "from-blue-tint to-soft",
  "from-soft to-orange-tint",
  "from-blue-tint to-orange-tint",
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
  const ground = placeholderGrounds[hashKey(placeholderKey) % placeholderGrounds.length];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        ground,
        className,
      )}
      role="img"
      aria-label={alt}
    >
      <Home className="h-10 w-10 text-charcoal/20" strokeWidth={1.5} />
    </div>
  );
}
