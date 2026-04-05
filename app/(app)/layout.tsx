import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-screen md:pb-0 pb-16 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
