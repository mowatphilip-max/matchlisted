import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Container } from "@/components/ui/container";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/introductions", label: "Introductions" },
  { href: "/admin/reports", label: "Home Reports" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/invoices", label: "Invoices" },
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
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </div>
      <Container className="min-h-[60vh] py-10">{children}</Container>
    </div>
  );
}
