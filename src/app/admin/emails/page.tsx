import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { allEmails } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Email outbox" };

// In the prototype nothing is really sent: every email the platform would
// send lands here so the flow can be inspected. Production swaps the
// recordEmail() seam in lib/db.ts for Resend.
export default function AdminEmailsPage() {
  const emails = allEmails();

  return (
    <>
      <h1 className="text-3xl">Email outbox</h1>
      <p className="mt-2 max-w-2xl text-charcoal-soft">
        Every email the platform would send, newest first. The prototype
        doesn&apos;t really send them — this is where you check the wording
        and the triggers. Production plugs Resend into the same seam.
      </p>

      {emails.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-paper p-6 text-sm text-charcoal-soft ring-1 ring-hairline">
          Nothing sent yet. Sign a new seeker agreement, or verify a Home
          Report to put a Hush Home live — possible-match emails will appear
          here.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {emails.map((e) => (
            <li
              key={e.id}
              className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-bold">
                  <Mail className="h-4 w-4 text-orange-deep" />
                  {e.subject}
                </p>
                <p className="text-xs text-charcoal-soft">
                  to {e.to} · {formatDateTime(e.createdAt)}
                </p>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-soft p-4 font-sans text-sm leading-relaxed text-charcoal">
                {e.body}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
