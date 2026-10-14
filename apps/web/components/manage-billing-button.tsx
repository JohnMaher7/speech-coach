"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { createPortalSession } from "@/lib/api";

export function ManageBillingButton({ className = "btn btn-line" }: { className?: string }) {
  const { getToken } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setPending(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const { url } = await createPortalSession(token);
      window.location.assign(url);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Couldn't open billing.");
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={open} disabled={pending} className={className}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Manage billing
      </button>
      {error && (
        <span role="alert" className="text-[14px] text-stop-ink">
          {error}
        </span>
      )}
    </span>
  );
}
