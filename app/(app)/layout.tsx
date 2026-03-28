import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen md:pb-0 pb-16">
        {children}
      </main>
    </div>
  );
}
