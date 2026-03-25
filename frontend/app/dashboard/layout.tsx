"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Disclaimer from "@/components/Disclaimer";
import { User, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 px-6 lg:px-8">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              {session.user?.name}
            </span>
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "Avatar"}
                className="h-8 w-8 rounded-full border border-white/10"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-blue-500/20">
                <User className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Beta
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mb-6">
            <Disclaimer />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
