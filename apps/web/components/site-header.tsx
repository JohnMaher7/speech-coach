"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

import { MobileNav } from "@/components/mobile-nav";

export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#how", label: "How it works" },
  { href: "/#measure", label: "What we measure" },
  { href: "/report/sample", label: "Sample report" },
  { href: "/tips", label: "Speaking tips" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-[10px] font-serif text-[19px] font-medium tracking-[-0.005em]"
        >
          <span className="inline-flex size-[30px] items-center justify-center rounded-[9px] bg-foreground text-background">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="size-4"
              aria-hidden
            >
              <path d="M4 12h2" />
              <path d="M8 8v8" />
              <path d="M12 5v14" />
              <path d="M16 8v8" />
              <path d="M20 11h2" />
            </svg>
          </span>
          SpeakGrade
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Log in
            </Link>
          </Show>
          <Link
            href="/#upload"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-foreground px-[14px] text-[13.5px] font-medium text-background transition-colors hover:bg-[oklch(0.22_0.01_264)]"
          >
            New analysis
            <ArrowRight className="size-[14px]" strokeWidth={2} />
          </Link>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
