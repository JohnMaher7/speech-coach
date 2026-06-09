import { TipsSidebar } from "@/components/tips-sidebar";

export default function TipsSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1240px] px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[232px_minmax(0,720px)] lg:gap-16">
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <TipsSidebar />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
