import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex flex-1">
        <AppSidebar />

        <main className="flex-1 overflow-x-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
