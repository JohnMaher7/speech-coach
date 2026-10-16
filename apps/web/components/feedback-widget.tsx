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
  "w-full rounded-xl border border-input bg-card px-3.5 text-[15px] text-foreground shadow-[0_1px_2px_rgb(16_16_14/0.04)] transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:shadow-[0_0_0_4px_rgb(16_16_14/0.06)] focus:outline-none";

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
        aria-label="Feedback"
        className="btn btn-line btn-sm fixed right-4 bottom-4 z-40 shadow-lift max-sm:size-11 max-sm:px-0 sm:right-6 sm:bottom-6"
      >
        <MessageSquare className="size-4" strokeWidth={1.8} />
        <span className="max-sm:hidden">Feedback</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-labelledby="feedback-title"
      className="fixed right-4 bottom-4 left-4 z-40 max-h-[calc(100svh-32px)] overflow-y-auto rounded-[22px] border border-border bg-card shadow-float [animation:rise_.2s_ease-out] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[392px]"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <h2
            id="feedback-title"
            className="display text-[30px] leading-tight"
          >
            How can we help?
          </h2>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            Every message is read by a real person.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-[18px]" strokeWidth={1.8} />
        </button>
      </div>

      {sentTo !== undefined ? (
        <div className="px-6 pt-5 pb-6" role="status">
          <p className="flex items-center gap-2.5 text-[16px] font-medium">
            <Lamp tone="good" />
            Message sent. Thank you.
          </p>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
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
        <form onSubmit={onSubmit} className="px-6 pt-4 pb-6" noValidate>
          <fieldset disabled={busy}>
            <legend className="sr-only">Message type</legend>
            <div className="seg grid w-full grid-cols-3">
              {KINDS.map((opt) => {
                const selected = kind === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="seg-item px-1 text-center text-[13px] leading-tight"
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
              className="mt-5 mb-2 block text-[14px] font-medium"
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
              className="mt-4 mb-2 flex items-baseline justify-between gap-3 text-[14px] font-medium"
            >
              Your email
              <span className="text-[12.5px] font-normal text-muted-foreground">
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
                className="alert-stop mt-4 flex items-start gap-2.5 px-3.5 py-2.5 text-[14px]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-ink mt-6 w-full">
              {busy && <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />}
              {busy ? "Sending…" : "Send message"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
