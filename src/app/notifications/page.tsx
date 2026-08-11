import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Heart, CalendarClock, FileText, Info } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/session";
import { notificationsForUser } from "@/lib/db";
import { markAllNotificationsRead } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

const icons = {
  match: Heart,
  viewing: CalendarClock,
  offer: FileText,
  system: Info,
} as const;

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const items = await notificationsForUser(user.id);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-3xl">
            <Bell className="h-6 w-6 text-orange-deep" /> Notifications
          </h1>
          {items.some((n) => !n.readAt) && (
            <form action={markAllNotificationsRead}>
              <Button variant="secondary" className="min-h-9 px-4 py-1.5">
                Mark all read
              </Button>
            </form>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-soft p-6 text-sm text-charcoal-soft">
            Nothing yet. When the Matchlist finds something, you&apos;ll hear
            about it here first.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((n) => {
              const Icon = icons[n.kind];
              const inner = (
                <div
                  className={cn(
                    "flex gap-4 rounded-2xl p-4 ring-1 ring-hairline transition-colors",
                    n.readAt ? "bg-paper" : "bg-orange-tint/60",
                    n.href && "hover:bg-soft",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-fit rounded-xl p-2.5",
                      n.kind === "match"
                        ? "bg-orange-tint text-orange-deep"
                        : "bg-blue-tint text-blue-deep",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", n.kind === "match" && "fill-current")} />
                  </span>
                  <div>
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-sm text-charcoal-soft">{n.body}</p>
                    <p className="mt-1 text-xs text-charcoal-soft/70">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? <Link href={n.href}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
