import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allHomes, usersById } from "@/lib/db";
import { adminVerifyReport } from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatDate, formatPrice } from "@/lib/format";
import { HOME_REPORT_SUPPLIERS } from "@/lib/site";

export const metadata: Metadata = { title: "Admin · Home Reports" };

export default async function AdminReportsPage() {
  const pending = (await allHomes()).filter((h) => h.homeReport.status === "uploaded");
  const verified = (await allHomes()).filter(
    (h) => h.homeReport.status === "verified",
  );
  const users = await usersById();

  return (
    <>
      <h1 className="text-3xl">Home Report verification</h1>
      <p className="mt-2 text-charcoal-soft">
        The go-live gate: no listing goes live until its report is verified
        here.
      </p>

      {pending.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-paper p-6 text-sm text-charcoal-soft ring-1 ring-hairline">
          Nothing waiting. Every uploaded report has been reviewed.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {pending.map((h) => {
            const seller = users.get(h.sellerId);
            const supplier = HOME_REPORT_SUPPLIERS.find(
              (s) => s.id === h.homeReport.supplier,
            );
            return (
              <li
                key={h.id}
                className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{h.headline}</p>
                    <p className="text-sm text-charcoal-soft">
                      {areaLabel(h.areaId)} · {h.addressLine} ·{" "}
                      {formatPrice(h.price)} · seller {seller?.name}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">{h.homeReport.fileName}</span>{" "}
                      <span className="text-charcoal-soft">
                        · {supplier?.name}, uploaded{" "}
                        {h.homeReport.uploadedAt
                          ? formatDate(h.homeReport.uploadedAt)
                          : ""}
                      </span>
                    </p>
                  </div>
                  <form action={adminVerifyReport}>
                    <input type="hidden" name="homeId" value={h.id} />
                    <Button type="submit">
                      <FileCheck2 className="h-4 w-4" /> Verify & go live
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-12 text-xl">Verified</h2>
      <ul className="mt-4 space-y-2">
        {verified.map((h) => (
          <li
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-sm ring-1 ring-hairline"
          >
            <span>
              {h.headline}{" "}
              <span className="text-charcoal-soft">
                · {h.homeReport.fileName}
              </span>
            </span>
            <span className="font-medium text-green-deep">
              Verified{" "}
              {h.homeReport.verifiedAt ? formatDate(h.homeReport.verifiedAt) : ""}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
