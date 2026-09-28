import type { Metadata } from "next";
import { SubmitButton } from "@/components/ui/submit-button";
import { matchWeights } from "@/lib/db";
import { adminSaveWeights } from "@/lib/actions";

export const metadata: Metadata = { title: "Admin · matching weights" };

const fields: { key: string; label: string; hint: string }[] = [
  { key: "location", label: "Location", hint: "Heaviest by design: a miss caps the match at 15%" },
  { key: "price", label: "Price vs budget", hint: ">10% over budget caps the match at 25%" },
  { key: "beds", label: "Bedrooms", hint: "One short scores 40%" },
  { key: "type", label: "Property type", hint: "Non-preferred type scores 20%" },
  { key: "baths", label: "Bathrooms", hint: "One short scores 50%" },
  { key: "garden", label: "Garden", hint: "A missing must-have caps at 49%" },
  { key: "other", label: "Stated extras", hint: "Share of wished-for features present" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const weights = await matchWeights() as unknown as Record<string, number>;
  const { saved } = await searchParams;
  const total = fields.reduce((s, f) => s + (weights[f.key] ?? 0), 0);

  return (
    <>
      <h1 className="text-3xl">Matching weights</h1>
      <p className="mt-2 max-w-2xl text-charcoal-soft">
        The Matchlist normalises whatever you enter, so the numbers are
        relative importance, not strict percentages. Current total: {total}.
      </p>
      {saved && (
        <p className="mt-4 w-fit rounded-xl bg-green-tint px-4 py-2 text-sm font-medium text-green-deep">
          Weights saved. Every Match % on the site now uses them.
        </p>
      )}
      <form
        action={adminSaveWeights}
        className="mt-8 max-w-2xl space-y-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
      >
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-4">
            <label htmlFor={f.key} className="w-36 shrink-0 text-sm font-semibold">
              {f.label}
            </label>
            <input
              id={f.key}
              name={f.key}
              type="number"
              min={0}
              max={100}
              defaultValue={weights[f.key]}
              className="min-h-11 w-24 rounded-xl border border-hairline px-4 text-base"
            />
            <p className="text-xs text-charcoal-soft">{f.hint}</p>
          </div>
        ))}
        <SubmitButton variant="seller" pendingLabel="Saving weights…">
          Save weights
        </SubmitButton>
      </form>
    </>
  );
}
