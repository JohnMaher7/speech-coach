import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>
          Rhetor — an independent speech-coaching tool. Not affiliated with any
          public-speaking organisation.
        </p>
        <p>
          An AI-engineering portfolio project ·{" "}
          <Link
            href="https://github.com/JohnMaher7/speech-coach"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            source
          </Link>
        </p>
      </div>
    </footer>
  );
}
