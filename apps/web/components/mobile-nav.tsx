"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Show } from "@clerk/nextjs";

import { NAV_LINKS } from "@/components/site-header";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-[10px] border border-border text-foreground transition-colors hover:bg-muted"
      >
        <Menu className="size-5" strokeWidth={2} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[82%] max-w-[320px] flex-col border-l border-border bg-background px-6 pt-5 pb-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-[18px] font-medium tracking-[-0.005em]">
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="inline-flex size-9 items-center justify-center rounded-[10px] border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex flex-col">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="border-b border-border/60 py-3 text-[15px] text-foreground transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              ))}
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="border-b border-border/60 py-3 text-[15px] text-foreground transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={close}
                  className="border-b border-border/60 py-3 text-[15px] text-foreground transition-colors hover:text-primary"
                >
                  Log in
                </Link>
              </Show>
            </nav>

            <Link
              href="/#upload"
              onClick={close}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[oklch(0.22_0.01_264)]"
            >
              New analysis
              <ArrowRight className="size-[14px]" strokeWidth={2} />
            </Link>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
