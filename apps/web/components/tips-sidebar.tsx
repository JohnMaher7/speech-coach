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
        className="hidden font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground lg:block"
      >
        Speaking tips
      </Link>

      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-4 lg:flex-col lg:gap-[2px] lg:overflow-visible lg:px-0 lg:pb-0">
        {TIPS_SECTIONS.map((section, i) => {
          const href = `/tips/${section.slug}`;
          const active = pathname === href;
          return (
            <li key={section.slug} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-8 items-center gap-2.5 rounded-full border px-[13px] text-[13px] whitespace-nowrap transition-colors lg:flex lg:h-auto lg:rounded-[9px] lg:border-0 lg:px-[10px] lg:py-[7px] lg:text-[13.5px] lg:whitespace-normal ${
                  active
                    ? "border-[color-mix(in_oklch,var(--primary)_28%,transparent)] bg-accent text-accent-foreground lg:font-medium"
                    : "border-border text-muted-foreground hover:text-foreground lg:hover:bg-secondary"
                }`}
              >
                <span
                  className={`font-mono text-[10.5px] ${active ? "text-primary" : "text-muted-foreground/70"}`}
                >
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
