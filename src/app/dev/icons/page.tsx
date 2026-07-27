// Storybook-equivalent for the property-type icon set: all eleven at the
// three sizes they render in practice (filter chips 52, card tile 64,
// picker/band 76). Dev aid only — not linked from anywhere.

import type { Metadata } from "next";
import { requireDevEnvironment } from "@/lib/dev-only";
import { Container } from "@/components/ui/container";
import {
  PropertyTypeIcon,
  propertyTypeLabel,
} from "@/components/property-type-icon";
import { SEEKER_PROPERTY_TYPES } from "@/lib/mowatt-seekers";

export const metadata: Metadata = { title: "Dev — property type icons" };

const SIZES = [52, 64, 76] as const;

export default function IconsPreviewPage() {
  requireDevEnvironment();
  return (
    <Container className="py-12">
      <h1 className="text-3xl">Property-type icon library</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal-soft">
        Eleven types, three sizes. Slate strokes inherit{" "}
        <code>currentColor</code>; coral maps to the site orange token; the
        ground line sits at y=54. Icons describe what a buyer is seeking —
        never a property that exists.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SEEKER_PROPERTY_TYPES.map((t) => (
          <div
            key={t.key}
            className="rounded-xl bg-paper p-4 text-center ring-1 ring-hairline"
          >
            <div className="flex items-end justify-center gap-4 rounded-lg bg-orange-tint py-3 text-charcoal">
              {SIZES.map((s) => (
                <PropertyTypeIcon key={s} type={t.key} size={s} />
              ))}
            </div>
            <p className="mt-2 text-sm font-bold">{propertyTypeLabel(t.key)}</p>
            <p className="text-xs uppercase tracking-wide text-muted">
              {t.group} · {t.key}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}
