"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
        className="inline-flex size-10 items-center justify-center border-[1.5px] border-foreground text-foreground transition-colors hover:bg-muted"
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
            className="absolute inset-0 bg-foreground/50"
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-[340px] flex-col border-l-[3px] border-foreground bg-card px-6 pt-4 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[24px] font-bold">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="inline-flex size-10 items-center justify-center border-[1.5px] border-foreground text-foreground transition-colors hover:bg-muted"
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
                  className="border-b border-border py-3 font-display text-[22px] font-semibold text-foreground transition-colors hover:text-muted-foreground"
                >
                  {label}
                </Link>
              ))}
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="border-b border-border py-3 font-display text-[22px] font-semibold text-foreground transition-colors hover:text-muted-foreground"
                >
                  Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={close}
                  className="border-b border-border py-3 font-display text-[22px] font-semibold text-foreground transition-colors hover:text-muted-foreground"
                >
                  Log in
                </Link>
              </Show>
            </nav>

            <Link
              href="/#upload"
              onClick={close}
              className="btn btn-ink mt-6 w-full"
            >
              New analysis
            </Link>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
