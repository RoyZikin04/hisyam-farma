import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={user as any} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/70">{children}</main>
      </div>
    </div>
  );
}
