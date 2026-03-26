import Link from "next/link";
import {
  BarChart3,
  Zap,
  Shield,
  Clock,
  Bot,
  TrendingUp,
  Key,
  Database,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "12 Agentes de IA",
    description:
      "Análise profunda com agentes especializados em fundamentalista, técnica, macro, crédito e governança.",
  },
  {
    icon: TrendingUp,
    title: "Análise em Tempo Real",
    description:
      "Dados atualizados de preços, indicadores técnicos e fundamentos diretamente da B3.",
  },
  {
    icon: Key,
    title: "BYOK — Traga sua Chave",
    description:
      "Use sua própria chave de API. Seus dados e custos sob seu controle total.",
  },
  {
    icon: Database,
    title: "Histórico Persistente",
    description:
      "Todas as análises são salvas. Consulte relatórios anteriores a qualquer momento.",
  },
  {
    icon: Zap,
    title: "Swarm Analysis",
    description:
      "Ultra-análise com 12 agentes em 3 ondas, incluindo devil's advocate para testar a tese.",
  },
  {
    icon: Shield,
    title: "Checklist de Qualidade",
    description:
      "Critérios eliminatórios rigorosos: lucros consistentes, liquidez ON e histórico de 5+ anos.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              B3Analysis
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-20 right-0 h-[300px] w-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
            <Zap className="h-3.5 w-3.5" />
            Powered by 12 AI Agents
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Análise inteligente para{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ações da B3
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
            Combine 12 agentes de IA especializados para uma análise completa de
            ações brasileiras. Fundamentalista, técnica, macro, crédito,
            governança e devil&apos;s advocate — tudo em um clique.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
            >
              Começar Agora
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-8 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Saiba Mais
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Tudo que você precisa para analisar ações
            </h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Uma plataforma completa de análise com inteligência artificial,
              projetada especificamente para o mercado brasileiro.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-blue-500/20 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Clock className="mx-auto mb-6 h-10 w-10 text-blue-400" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            Pronto para começar?
          </h2>
          <p className="mb-8 text-slate-400">
            Crie sua conta gratuita e comece a analisar ações da B3 com
            inteligência artificial em minutos.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
          >
            Começar Agora — É Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-600">
          B3Analysis v0.1.0 — Uso exclusivamente educacional. Não constitui
          recomendação de investimento.
        </div>
      </footer>
    </div>
  );
}
