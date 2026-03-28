"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  BookOpen,
  Search,
  Languages,
  BookText,
  Library,
  FileText,
  Calendar,
  MessageSquare,
  Home,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Not authenticated");
    return r.json();
  }).then((res) => res.data);

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/bible", label: "Bible", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/strongs", label: "Strong's", icon: Languages },
  { href: "/dictionary", label: "Dictionary", icon: BookText },
  { href: "/library", label: "Library", icon: Library },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/devotional", label: "Devotional", icon: Calendar },
  { href: "/study", label: "AI Study", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Check auth state via SWR (silent fail for non-auth pages)
  const { data: user, mutate: mutateUser } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    errorRetryCount: 0,
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    mutateUser(null, false);
    router.push("/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-gold text-xl font-scripture">✦</span>
              <span className="font-semibold text-sm tracking-wide">
                Bible Study
              </span>
            </div>
          )}
          {collapsed && (
            <span className="text-gold text-xl font-scripture mx-auto">✦</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gold/15 text-gold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — User + Theme + Collapse */}
        <div className="p-2 border-t border-border space-y-1">
          {/* User section */}
          {user ? (
            <div className={cn(
              "flex items-center gap-2 px-2 py-2",
              collapsed && "justify-center"
            )}>
              <Link
                href="/profile"
                className="h-7 w-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0 hover:bg-gold/30 transition-colors"
                title="Profile"
              >
                <User className="h-3.5 w-3.5 text-gold" />
              </Link>
              {!collapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <Link href="/profile" className="text-xs font-medium truncate block hover:text-gold transition-colors">
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="h-2.5 w-2.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? "Sign in" : undefined}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="animate-fade-in">Sign In</span>}
            </Link>
          )}

          <div className={cn("flex items-center", collapsed ? "justify-center" : "px-2 justify-between")}>
            {!collapsed && <ThemeToggle />}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="relative">
          <div className="flex overflow-x-auto hide-scrollbar px-1 py-2 gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 min-w-14 px-2 py-1 rounded-lg text-[10px] transition-colors shrink-0",
                    isActive
                      ? "text-gold"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
          {/* Scroll hint gradient — fades right edge to signal more items */}
          <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-background/95 to-transparent" />
        </div>
      </nav>
    </>
  );
}
