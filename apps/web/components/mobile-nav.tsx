"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Show } from "@clerk/nextjs";

import { NAV_LINKS, Wordmark } from "@/components/site-header";

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
        className="inline-flex size-10 items-center justify-center rounded-full border border-border-strong bg-card text-foreground transition-colors hover:bg-muted"
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
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] [animation:fade_.2s_ease-out]"
          />
          <div className="absolute inset-y-2 right-2 flex w-[calc(100%-16px)] max-w-[360px] flex-col rounded-3xl border border-border bg-card px-6 pt-3 pb-6 shadow-float [animation:rise_.22s_ease-out]">
            <div className="mb-4 flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
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
                  className="display border-b border-border py-3.5 text-[28px] text-foreground transition-colors hover:text-muted-foreground"
                >
                  {label}
                </Link>
              ))}
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="display border-b border-border py-3.5 text-[28px] text-foreground transition-colors hover:text-muted-foreground"
                >
                  Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={close}
                  className="display border-b border-border py-3.5 text-[28px] text-foreground transition-colors hover:text-muted-foreground"
                >
                  Log in
                </Link>
              </Show>
            </nav>

            <div className="mt-auto pt-6">
              <Show when="signed-in">
                <Link href="/#upload" onClick={close} className="btn btn-ink btn-lg w-full">
                  New analysis
                </Link>
              </Show>
              <Show when="signed-out">
                <Link href="/pricing" onClick={close} className="btn btn-ink btn-lg w-full">
                  Start free trial
                </Link>
                <p className="mt-3 text-center text-[13.5px] text-muted-foreground">
                  7 days free · cancel anytime
                </p>
              </Show>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
