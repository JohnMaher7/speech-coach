import { TipsSidebar } from "@/components/tips-sidebar";

export default function TipsSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex-1">
      <div className="wrap pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,740px)] lg:gap-20">
          <aside className="lg:sticky lg:top-[96px] lg:self-start">
            <TipsSidebar />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
