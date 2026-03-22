"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageCircle,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Trophy,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "Nova", icon: MessageCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/mocks", label: "Mocks", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-border px-4 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-10">
        <span className="text-lg font-serif font-bold text-foreground tracking-tight">
          %/° TripleScore
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/8 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary font-normal"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="px-2 pt-4 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
              {user.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user.displayName ?? "Student"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
