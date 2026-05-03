"use client";

import { Home, Heart, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#test", icon: Home, label: "测一测" },
  { href: "/#discover", icon: Heart, label: "发现" },
  { href: "/matches", icon: MessageCircle, label: "匹配" },
  { href: "/profile", icon: User, label: "我的" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 safe-bottom">
      <div className="max-w-5xl mx-auto flex items-center justify-around h-16 sm:h-20 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = item.href.startsWith("/#") ? pathname === "/" : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                isActive
                  ? "text-[#0071e3]"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon
                className={cn(
                  "w-6 h-6 transition-all duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
