import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-2 px-5 py-8 text-center text-[12.5px] text-muted-foreground sm:flex-row sm:justify-between sm:px-8 sm:text-left">
        <p>
          SpeakGrade — an independent speech-coaching tool. Not affiliated with any
          public-speaking organisation.
        </p>
        <p>
          <Link
            href="/tips"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Speaking tips
          </Link>{" "}
          · An AI-engineering portfolio project ·{" "}
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
