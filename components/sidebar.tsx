"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bible/genesis/1", label: "Bible", icon: BookOpen },
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
  const [collapsed, setCollapsed] = useState(false);

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

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="flex justify-around py-2 px-1">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
