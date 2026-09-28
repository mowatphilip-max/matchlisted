import type { Metadata } from "next";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { allLawyers } from "@/lib/db";
import { adminRemoveLawyer, adminSaveLawyer } from "@/lib/actions";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · lawyer panel" };

export default async function AdminLawyersPage() {
  const lawyers = await allLawyers();

  return (
    <>
      <h1 className="text-3xl">The conveyancing panel</h1>
      <p className="mt-2 text-charcoal-soft">
        Buyers may choose from this list after their offer is accepted.
        It is never a condition of making one (DECISIONS.md §0.5).
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {lawyers.map((l) => (
          <li
            key={l.id}
            className="rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{l.firm}</p>
                <p className="text-xs text-charcoal-soft">
                  {l.contactName} · {l.location}
                </p>
              </div>
              <p className="font-display text-lg font-bold">
                {formatPrice(l.feeEstimate)}
                <span className="text-xs font-normal text-charcoal-soft"> + VAT</span>
              </p>
            </div>
            <p className="mt-2 text-sm text-charcoal-soft">{l.blurb}</p>
            <form action={adminRemoveLawyer} className="mt-3">
              <input type="hidden" name="lawyerId" value={l.id} />
              {/* Removing a firm from the panel is not reversible from this
                  screen, so it arms before it commits. */}
              <ConfirmSubmit
                variant="secondary"
                size="sm"
                className="text-red-deep ring-red-deep/40 hover:bg-red-tint hover:ring-red-deep"
                confirmLabel="Yes, remove them"
                pendingLabel="Removing…"
              >
                Remove from panel
              </ConfirmSubmit>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl">Add a firm</h2>
      <form
        action={adminSaveLawyer}
        className="mt-4 grid max-w-2xl gap-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline sm:grid-cols-2"
      >
        <div>
          <label htmlFor="firm" className="block text-sm font-semibold">Firm</label>
          <input id="firm" name="firm" required className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base" />
        </div>
        <div>
          <label htmlFor="contactName" className="block text-sm font-semibold">Contact</label>
          <input id="contactName" name="contactName" required className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base" />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-semibold">Location</label>
          <input id="location" name="location" required className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base" />
        </div>
        <div>
          <label htmlFor="feeEstimate" className="block text-sm font-semibold">
            Typical fee (£ net)
          </label>
          <input id="feeEstimate" name="feeEstimate" type="number" required min={0} className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="blurb" className="block text-sm font-semibold">One-line blurb</label>
          <input id="blurb" name="blurb" required className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base" />
        </div>
        <div className="sm:col-span-2">
          <SubmitButton variant="seller" pendingLabel="Adding to panel…">
            Add to panel
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
