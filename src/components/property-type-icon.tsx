// The Quiet Seeker property-type line drawings — a closed set of eleven,
// lifted verbatim from the approved mockup (64×64 grid, 2.6 stroke, round
// caps/joins, coral ground line at y=54). Inline SVG so the slate strokes
// inherit currentColor and stay crisp on retina; the coral accents map to
// the site's orange token.
//
// The icon always describes what the buyer is LOOKING FOR, never a property
// that exists — accessible labels are phrased that way.

import { SEEKER_PROPERTY_TYPES, type SeekerPropertyType } from "@/lib/mowatt-seekers";

const CORAL = "var(--color-orange, #F37C24)";

/** Secondary "context" strokes (the rest of the building) — muted slate. */
const CTX = { opacity: 0.42 } as const;

function art(type: SeekerPropertyType): React.ReactNode {
  switch (type) {
    case "tenement_flat":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M26 18 V9 H39 V18" />
            <path d="M13 18 H51" />
            <path d="M18 18 V54 H46 V18" />
            <rect x="21.5" y="23" width="9" height="9" />
            <rect x="21.5" y="36" width="9" height="9" />
            <rect x="33.5" y="36" width="9" height="9" />
            <path d="M26 23 V32 M21.5 27.5 H30.5" />
            <path d="M26 36 V45 M21.5 40.5 H30.5" />
            <path d="M38 36 V45 M33.5 40.5 H42.5" />
            <rect x="27" y="47" width="10" height="7" />
          </g>
          <g>
            <rect x="33.5" y="23" width="9" height="9" fill={CORAL} opacity=".2" />
            <rect x="33.5" y="23" width="9" height="9" fill="none" stroke={CORAL} strokeWidth={2.6} />
            <path d="M38 23 V32 M33.5 27.5 H42.5" stroke={CORAL} strokeWidth={2.6} />
          </g>
          <g stroke="currentColor" strokeWidth={2.2} fill="none">
            <rect x="28" y="5" width="3.5" height="4" />
            <rect x="34" y="5" width="3.5" height="4" />
          </g>
          <path d="M8 54 H56" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "newbuild_apartment":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 15 H50" />
            <path d="M17 15 V54 H47 V15" />
            <path d="M17 28 H47" />
            <path d="M17 41 H47" />
            <rect x="21" y="19" width="11" height="6" />
            <rect x="36" y="19" width="7" height="6" />
            <rect x="21" y="45" width="11" height="6" />
            <rect x="36" y="45" width="7" height="6" />
          </g>
          <g>
            <rect x="17" y="28" width="30" height="13" fill={CORAL} opacity=".13" />
            <path d="M17 28 H47 M17 41 H47" stroke={CORAL} strokeWidth={2.6} strokeLinecap="round" />
            <g stroke={CORAL} strokeWidth={2.4} fill="none" strokeLinecap="round">
              <rect x="21" y="32" width="11" height="6" />
              <path d="M36 32 H43 M36 38 H43 M38 32 V38 M41 32 V38" />
            </g>
          </g>
          <path d="M8 54 H56" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "main_door_flat":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" {...CTX}>
            <path d="M14 14 H50" />
            <path d="M17 14 V36 M47 14 V36" />
            <rect x="21" y="19" width="8" height="8" />
            <rect x="35" y="19" width="8" height="8" />
          </g>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 36 H47" />
            <path d="M17 36 V54 H47 V36" />
            <rect x="21" y="41" width="9" height="9" />
            <path d="M25.5 41 V50 M21 45.5 H30" />
            <rect x="35" y="40" width="9" height="14" />
          </g>
          <path d="M8 54 H56" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
          <g stroke={CORAL} strokeWidth={2.2} fill="none" strokeLinecap="round">
            <path d="M10 54 V45 H16 V54 M13 45 V54" />
          </g>
        </>
      );
    case "top_floor_flat":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" {...CTX}>
            <path d="M17 30 V54 H47 V30" />
            <rect x="21" y="34" width="9" height="8" />
            <rect x="35" y="34" width="8" height="8" />
            <rect x="27" y="46" width="10" height="8" />
          </g>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 30 L32 15 L52 30" />
            <path d="M17 30 H47" />
          </g>
          <g>
            <path d="M20 26 L32 17 L44 26 L44 30 H20 Z" fill={CORAL} opacity=".15" />
            <g stroke={CORAL} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="27" y="21" width="10" height="9" rx="1" />
              <path d="M32 21 V30 M27 25.5 H37" />
            </g>
          </g>
          <path d="M8 54 H56" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "bungalow":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 30 L32 15 L52 30" />
            <path d="M16 28 V54 H48 V28" />
            <rect x="27.5" y="42" width="9" height="12" />
            <rect x="19" y="34" width="9" height="8" />
            <rect x="36" y="34" width="9" height="8" />
            <path d="M23.5 34 V42 M19 38 H28" />
            <path d="M40.5 34 V42 M36 38 H45" />
            <path d="M42 22 V14 H47 V26" />
          </g>
          <path d="M8 54 H56" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "detached":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 28 L28 14 L44 28" />
            <path d="M16 26 V54 H40 V26" />
            <rect x="24" y="43" width="8" height="11" />
            <rect x="19" y="32" width="8" height="8" />
            <rect x="30" y="32" width="8" height="8" />
            <path d="M23 32 V40 M19 36 H27" />
            <path d="M34 32 V40 M30 36 H38" />
            <path d="M37 20 V13 H42 V25" />
            <path d="M42 38 L50 31 L58 38" />
            <path d="M45 37 V54 H55 V37" />
            <rect x="47" y="44" width="6" height="10" />
          </g>
          <path d="M6 54 H60" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "semi_detached":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 30 L20 18 L32 30" />
            <path d="M32 30 L44 18 L56 30" />
            <path d="M12 28 V54 H52 V28" />
            <rect x="15" y="34" width="8" height="8" />
            <rect x="41" y="34" width="8" height="8" />
            <rect x="16" y="45" width="7" height="9" />
            <rect x="41" y="45" width="7" height="9" />
            <path d="M19 34 V42 M15 38 H23" />
            <path d="M45 34 V42 M41 38 H49" />
          </g>
          <path d="M32 30 V54" stroke={CORAL} strokeWidth={2.4} strokeDasharray="4 4" strokeLinecap="round" />
          <path d="M6 54 H58" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "terraced":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 24 L16 16 L24 24" />
            <path d="M24 24 L32 16 L40 24" />
            <path d="M40 24 L48 16 L56 24" />
            <path d="M11 23 V54 H53 V23" />
            <path d="M27 23 V54 M37 23 V54" />
            <rect x="14" y="29" width="7" height="7" />
            <rect x="30" y="29" width="7" height="7" />
            <rect x="44" y="29" width="7" height="7" />
            <rect x="15" y="43" width="6" height="11" />
            <rect x="30" y="43" width="7" height="11" />
            <rect x="44" y="43" width="6" height="11" />
          </g>
          <path d="M6 54 H58" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
          <path d="M30 43 H37 V54" stroke={CORAL} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "cottage":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 31 L30 16 L49 31" />
            <path d="M16 29 V54 H44 V29" />
            <rect x="25.5" y="43" width="9" height="11" />
            <rect x="18.5" y="34" width="7" height="7" />
            <rect x="35" y="34" width="7" height="7" />
            <path d="M22 34 V41 M18.5 37.5 H25.5" />
            <path d="M38.5 34 V41 M35 37.5 H42" />
            <path d="M18 26 V18 H23 V29" />
          </g>
          <g stroke={CORAL} strokeWidth={2.4} fill="none" strokeLinecap="round">
            <path d="M52 54 V40" />
            <path d="M52 44 C44 40 42 30 47 26 C54 31 55 41 52 44" />
          </g>
          <path d="M8 54 H58" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "country_house":
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 28 L24 15 L39 28" />
            <path d="M13 26 V54 H35 V26" />
            <rect x="20" y="43" width="8" height="11" />
            <rect x="16" y="32" width="7" height="7" />
            <rect x="26" y="32" width="7" height="7" />
            <path d="M33 20 V13 H38 V24" />
            <path d="M40 36 L48 29 L56 36" />
            <path d="M43 35 V54 H53 V35" />
            <rect x="45" y="43" width="6" height="11" />
          </g>
          <g stroke={CORAL} strokeWidth={2.4} fill="none" strokeLinecap="round">
            <path d="M8 54 V47" />
            <circle cx="8" cy="42" r="5" />
          </g>
          <path d="M4 54 H60" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "any":
      // "Open to any property type" — drawn to match the set: a modest house
      // and a small flats block side by side, coral ground line, and a soft
      // coral dot for the "anywhere the light is on" idea.
      return (
        <>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 30 L21 18 L34 30" />
            <path d="M12 28 V54 H30 V28" />
            <rect x="17.5" y="43" width="7" height="11" />
            <rect x="15" y="33" width="6" height="6" />
            <rect x="24" y="33" width="6" height="6" />
          </g>
          <g stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M36 22 H54" />
            <path d="M38 22 V54 H52 V22" />
            <rect x="41" y="26" width="8" height="6" />
            <rect x="41" y="35" width="8" height="6" />
            <rect x="42" y="46" width="6" height="8" />
          </g>
          <circle cx="45" cy="38" r="1.4" fill={CORAL} stroke="none" />
          <circle cx="45" cy="38" r="4.6" fill={CORAL} opacity=".18" stroke="none" />
          <path d="M6 54 H58" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      );
  }
}

export function propertyTypeLabel(type: SeekerPropertyType): string {
  return (
    SEEKER_PROPERTY_TYPES.find((t) => t.key === type)?.label ?? "Any property"
  );
}

export function PropertyTypeIcon({
  type,
  size = 64,
  title,
  className,
}: {
  type: SeekerPropertyType;
  /** Rendered square size in px — 52–76 in practice. */
  size?: number;
  /**
   * Optional accessible label. When set, the SVG is announced (phrased as
   * the buyer's WANT, not a listing); otherwise it is decorative.
   */
  title?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      {...(title
        ? { role: "img", "aria-label": title }
        : { "aria-hidden": true })}
    >
      {art(type)}
    </svg>
  );
}
