import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Container } from "@/components/ui/container";
import { AdminNav } from "./admin-nav";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/introductions", label: "Introductions" },
  { href: "/admin/reports", label: "Home Reports" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/orders", label: "POs" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/lawyers", label: "Lawyers" },
  { href: "/admin/settings", label: "Matching" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");

  return (
    <div className="bg-soft">
      <div className="border-b border-hairline bg-charcoal-deep">
        <Container className="flex flex-wrap items-center gap-1 py-3">
          <span className="mr-4 text-sm font-bold uppercase tracking-wider text-white/60">
            Back-office
          </span>
          <AdminNav items={nav} />
        </Container>
      </div>
      <Container className="min-h-[60vh] py-10">{children}</Container>
    </div>
  );
}
