import Link from "next/link";

import { Wordmark } from "@/components/site-header";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/report/sample", label: "Sample reports" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/tips", label: "Speaking tips" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/dashboard", label: "Your reports" },
      { href: "/sign-in", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="wrap grid gap-12 pt-14 pb-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" aria-label="SpeakGrade home">
            <Wordmark />
          </Link>
          <p className="mt-4 max-w-[30ch] text-[14.5px] leading-[1.6] text-muted-foreground">
            An evaluator&apos;s notes on every talk you give, in about three
            minutes.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[13.5px] font-medium text-foreground">{col.title}</p>
            <ul className="mt-3 grid gap-2.5 text-[14.5px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="wrap">
        <div className="flex flex-col gap-2 border-t border-border py-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SpeakGrade</p>
          <p>
            An independent speech-coaching tool. Not affiliated with any
            public-speaking organisation.
          </p>
        </div>
      </div>
    </footer>
  );
}
