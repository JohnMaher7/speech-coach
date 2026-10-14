"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { AlertCircle, Loader2, MessageSquare, X } from "lucide-react";

import { Lamp } from "@/components/signal";
import { sendFeedback, type FeedbackKind } from "@/lib/api";

const KINDS: {
  value: FeedbackKind;
  label: string;
  prompt: string;
  placeholder: string;
}[] = [
  {
    value: "feedback",
    label: "Feedback",
    prompt: "What's on your mind?",
    placeholder: "What's working, what isn't, or what you'd like to see next.",
  },
  {
    value: "bug",
    label: "Report a bug",
    prompt: "What went wrong?",
    placeholder: "What you did, what you expected, and what happened instead.",
  },
  {
    value: "support",
    label: "Get help",
    prompt: "What do you need help with?",
    placeholder: "Questions about your account, billing or a report.",
  },
];

const FIELD =
  "w-full border-[1.5px] border-border bg-card px-3 text-[16px] text-foreground transition-colors placeholder:text-muted-foreground/80 focus:border-foreground focus:outline-none";

export function FeedbackWidget() {
  const pathname = usePathname();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null | undefined>(undefined);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);

  const emailValue = email ?? user?.primaryEmailAddress?.emailAddress ?? "";

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      return;
    }
    wasOpen.current = true;
    messageRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function openPanel() {
    if (sentTo !== undefined) reset();
    setOpen(true);
  }

  function reset() {
    setMessage("");
    setError(null);
    setSentTo(undefined);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const replyTo = emailValue.trim() || null;
    if (!message.trim()) {
      setError("Please write a message first.");
      messageRef.current?.focus();
      return;
    }
    if (kind === "support" && !replyTo) {
      setError("Add your email so we can reply.");
      return;
    }
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      setError("That email address doesn't look right.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = isSignedIn ? await getToken() : null;
      await sendFeedback(
        { kind, message, email: replyTo, page: pathname, website },
        token,
      );
      setSentTo(replyTo);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "Your message didn't send. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const current = KINDS.find((k) => k.value === kind) ?? KINDS[0];
  const emailRequired = kind === "support";

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        className="btn btn-ink btn-sm fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6"
      >
        <MessageSquare className="size-[18px]" strokeWidth={2.2} />
        Feedback
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-labelledby="feedback-title"
      className="fixed right-4 bottom-4 left-4 z-40 max-h-[calc(100svh-32px)] overflow-y-auto border-[1.5px] border-t-[3px] border-foreground bg-card shadow-[5px_5px_0_0_rgb(21_21_21_/_0.18)] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[384px]"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div>
          <h2
            id="feedback-title"
            className="font-display text-[26px] leading-tight font-bold"
          >
            How can we help?
          </h2>
          <p className="text-[14.5px] text-muted-foreground">
            Every message is read by a real person.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-muted"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
      </div>

      {sentTo !== undefined ? (
        <div className="px-5 pt-5 pb-5" role="status">
          <p className="flex items-center gap-2.5 font-display text-[22px] font-semibold">
            <Lamp tone="good" />
            Message sent. Thank you.
          </p>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {sentTo
              ? `If it needs a reply, we'll write to ${sentTo}.`
              : "We read every message, even when we can't reply."}
          </p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={reset} className="btn btn-line btn-sm">
              Send another
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ink btn-sm"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="px-5 pt-4 pb-5" noValidate>
          <fieldset disabled={busy}>
            <legend className="sr-only">Message type</legend>
            <div className="grid grid-cols-3 border-[1.5px] border-foreground">
              {KINDS.map((opt, i) => {
                const selected = kind === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex h-10 cursor-pointer items-center justify-center px-1 text-center text-[14.5px] leading-tight font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground ${
                      i > 0 ? "border-l-[1.5px] border-foreground" : ""
                    } ${selected ? "bg-foreground text-card" : "bg-card hover:bg-muted"}`}
                  >
                    <input
                      type="radio"
                      name="feedback-kind"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setKind(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>

            <label
              htmlFor="feedback-message"
              className="mt-4 mb-1.5 block text-[15px] font-semibold"
            >
              {current.prompt}
            </label>
            <textarea
              ref={messageRef}
              id="feedback-message"
              rows={5}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={current.placeholder}
              className={`${FIELD} block resize-y py-2.5 leading-snug`}
            />

            <label
              htmlFor="feedback-email"
              className="mt-4 mb-1.5 flex items-baseline justify-between gap-3 text-[15px] font-semibold"
            >
              Your email
              <span className="text-[13.5px] font-normal text-muted-foreground">
                {emailRequired ? "So we can reply" : "Optional, for a reply"}
              </span>
            </label>
            <input
              id="feedback-email"
              type="email"
              autoComplete="email"
              maxLength={320}
              value={emailValue}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required={emailRequired}
              className={`${FIELD} h-11`}
            />

            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="feedback-website">Website</label>
              <input
                id="feedback-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 border-l-[3px] border-stop bg-stop/10 px-3.5 py-2.5 text-[14.5px] text-stop-ink"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-ink mt-5 w-full">
              {busy && <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />}
              {busy ? "Sending…" : "Send message"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
