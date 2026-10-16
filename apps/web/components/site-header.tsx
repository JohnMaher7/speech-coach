"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";

import { MobileNav } from "@/components/mobile-nav";

export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#how", label: "How it works" },
  { href: "/report/sample", label: "Sample reports" },
  { href: "/tips", label: "Speaking tips" },
  { href: "/pricing", label: "Pricing" },
];

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`size-6 shrink-0 ${className}`}
    >
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <rect x="6.25" y="10" width="2.5" height="4" rx="1.25" fill="var(--background)" />
      <rect x="10.75" y="6" width="2.5" height="12" rx="1.25" fill="var(--background)" />
      <rect x="15.25" y="8.5" width="2.5" height="7" rx="1.25" fill="var(--stop)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark />
      <span className="display text-[25px] leading-none tracking-[-0.01em]">
        SpeakGrade
      </span>
    </span>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    !href.startsWith("/#") &&
    (pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 transition-colors hover:text-foreground ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="SpeakGrade home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 text-[14.5px] font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-[14.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link href="/#upload" className="btn btn-ink btn-sm">
              New analysis
            </Link>
            <span className="ml-1 inline-flex">
              <UserButton />
            </span>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full px-3 py-1.5 text-[14.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link href="/pricing" className="btn btn-ink btn-sm">
              Start free trial
            </Link>
          </Show>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
