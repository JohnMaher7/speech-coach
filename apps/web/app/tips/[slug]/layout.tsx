import { TipsSidebar } from "@/components/tips-sidebar";

export default function TipsSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex-1">
      <div className="wrap py-10 lg:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,760px)] lg:gap-14">
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <TipsSidebar />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
