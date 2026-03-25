"use client";

import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm leading-relaxed text-amber-200/90">
          <span className="font-semibold text-amber-300">Aviso:</span> Este
          relatório é gerado por agentes de IA para fins exclusivamente
          educacionais e de estudo pessoal. Não constitui recomendação de
          investimento, consultoria financeira ou análise profissional. Renda
          variável envolve risco de perda do capital investido.
        </p>
      </div>
    </div>
  );
}
