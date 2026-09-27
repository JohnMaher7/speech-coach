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
        className="hidden font-display text-[22px] font-bold transition-colors hover:text-muted-foreground lg:block"
      >
        Speaking tips
      </Link>

      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-3 lg:block lg:overflow-visible lg:border-t-[3px] lg:border-foreground lg:bg-card lg:px-0 lg:pb-0">
        {TIPS_SECTIONS.map((section, i) => {
          const href = `/tips/${section.slug}`;
          const active = pathname === href;
          return (
            <li key={section.slug} className="shrink-0 lg:border-b lg:border-border">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center gap-2.5 border-[1.5px] px-3 text-[15px] whitespace-nowrap transition-colors lg:h-auto lg:border-0 lg:border-l-[3px] lg:py-2.5 lg:pr-3 lg:pl-3 lg:whitespace-normal ${
                  active
                    ? "border-foreground bg-foreground font-semibold text-card lg:border-l-foreground lg:bg-muted lg:text-foreground"
                    : "border-foreground bg-card text-foreground hover:bg-muted lg:border-l-transparent lg:text-muted-foreground lg:hover:text-foreground"
                }`}
              >
                <span className="font-display text-[16px] font-bold">
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
