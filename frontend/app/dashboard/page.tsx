"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Zap,
  Filter,
  Briefcase,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    title: "Analisar",
    description: "Análise completa de uma ação com 3 agentes",
    href: "/dashboard/analyze",
    icon: Search,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Swarm",
    description: "Ultra-análise com 12 agentes em 3 ondas",
    href: "/dashboard/swarm",
    icon: Zap,
    color: "from-indigo-500 to-purple-600",
  },
  {
    title: "Screening",
    description: "Filtre ações da B3 com 7 critérios de qualidade",
    href: "/dashboard/screen",
    icon: Filter,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Carteira",
    description: "Monte uma carteira diversificada otimizada",
    href: "/dashboard/portfolio",
    icon: Briefcase,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Macro",
    description: "Panorama macroeconômico brasileiro atualizado",
    href: "/dashboard/macro",
    icon: TrendingUp,
    color: "from-rose-500 to-pink-600",
  },
];

const recentPlaceholder = [
  { ticker: "WEGE3", type: "Swarm", date: "—", status: "placeholder" },
  { ticker: "ITUB3", type: "Análise", date: "—", status: "placeholder" },
  { ticker: "PETR4", type: "Análise", date: "—", status: "placeholder" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Investidor";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, {firstName}
        </h1>
        <p className="mt-1 text-slate-400">
          O que deseja analisar hoje?
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}
            >
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">{action.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {action.description}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
              Abrir <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent analyses */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Análises Recentes
          </h2>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-400"
          >
            <Clock className="h-3.5 w-3.5" />
            Ver histórico
          </Link>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <div className="divide-y divide-white/5">
            {recentPlaceholder.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-slate-300">
                    {item.ticker.slice(0, 4)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {item.ticker}
                    </p>
                    <p className="text-xs text-slate-500">{item.type}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-600">
                  {item.date}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 px-5 py-3 text-center">
            <p className="text-xs text-slate-600">
              As análises aparecerão aqui conforme você usar a plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
