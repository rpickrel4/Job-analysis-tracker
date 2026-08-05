"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "My Profile" },
  { href: "/analyze", label: "Analyze a Posting" },
  { href: "/tracker", label: "Application Tracker" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
        <Link href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Job Hunt Copilot
        </Link>
        <nav className="flex gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
