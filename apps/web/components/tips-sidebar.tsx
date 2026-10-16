"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TIPS_SECTIONS } from "@/lib/tips-content";

export function TipsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Speaking tips sections">
      <Link
        href="/tips"
        className="hidden text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground lg:block"
      >
        Speaking tips
      </Link>

      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-4 lg:grid lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {TIPS_SECTIONS.map((section, i) => {
          const href = `/tips/${section.slug}`;
          const active = pathname === href;
          return (
            <li key={section.slug} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center gap-2.5 rounded-full border px-3.5 text-[14px] whitespace-nowrap transition-colors lg:h-auto lg:rounded-xl lg:border-0 lg:px-3 lg:py-2 lg:whitespace-normal ${
                  active
                    ? "border-foreground bg-foreground font-medium text-white lg:bg-card lg:text-foreground lg:shadow-soft lg:ring-1 lg:ring-border"
                    : "border-border bg-card text-ink-2 hover:text-foreground lg:bg-transparent lg:text-muted-foreground lg:hover:bg-muted/60"
                }`}
              >
                <span className="text-[12px] font-medium opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.navLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
