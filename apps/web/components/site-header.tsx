"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`grid gap-[3px] ${className}`}>
      <span className="lamp size-[7px] bg-go" />
      <span className="lamp size-[7px] bg-caution" />
      <span className="lamp size-[7px] bg-stop" />
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
      className={`py-1 transition-colors hover:text-foreground ${
        active
          ? "text-foreground underline decoration-2 underline-offset-[6px]"
          : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-foreground bg-card">
      <div className="wrap flex h-[62px] items-center justify-between gap-6">
        <Link
          href="/"
          className="inline-flex items-center gap-[10px] font-display text-[25px] leading-none font-bold"
        >
          <BrandMark />
          SpeakGrade
        </Link>

        <nav className="hidden items-center gap-6 text-[15.5px] font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          <Show when="signed-in">
            <NavLink href="/dashboard" label="Dashboard" />
          </Show>
          <Show when="signed-out">
            <NavLink href="/sign-in" label="Log in" />
          </Show>
          <Link href="/#upload" className="btn btn-ink btn-sm">
            New analysis
          </Link>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>

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
