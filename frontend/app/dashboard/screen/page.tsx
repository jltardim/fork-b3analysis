"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAnalysis } from "@/lib/hooks/useAnalysis";
import { TickerInput } from "@/components/TickerInput";
import { ReportViewer } from "@/components/ReportViewer";
import { Loader2, Search, AlertCircle, X } from "lucide-react";

const SECTOR_TICKERS: Record<string, string[]> = {
  bancos: ["ITUB3", "ITUB4", "BBAS3", "BBDC3", "BBDC4", "SANB11", "BPAC11", "BRSR3", "ABCB4", "BPAN4", "BMOB3", "PINE4"],
  seguros_financeiro: ["BBSE3", "PSSA3", "B3SA3", "CXSE3", "IRBR3", "BRBI11", "WIZC3"],
  energia_eletrica: ["ELET3", "ELET6", "EQTL3", "CPFE3", "EGIE3", "ENGI11", "NEOE3", "CPLE6", "CMIG4", "TAEE11", "ALUP11", "AESB3", "COCE5", "ENEV3", "TRPL4", "EMAE4"],
  petroleo_gas: ["PETR3", "PETR4", "PRIO3", "RECV3", "RRRP3", "ENAT3", "CSAN3", "UGPA3", "VBBR3", "RAIZ4"],
  mineracao_siderurgia: ["VALE3", "CSNA3", "GGBR4", "GOAU4", "USIM5", "BRAP4", "CMIN3", "FESA4"],
  papel_celulose: ["SUZB3", "KLBN11", "DXCO3", "RANI3"],
  varejo: ["RENT3", "LREN3", "MGLU3", "BHIA3", "ARZZ3", "SOMA3", "GUAR3", "GRND3", "ALPA4", "LJQQ3", "CEAB3", "SBFG3", "PETZ3"],
  saude: ["RDOR3", "HAPV3", "FLRY3", "RADL3", "DASA3", "BLAU3", "ONCO3", "PARD3", "QUAL3", "AALR3", "ODPV3"],
  tecnologia: ["TOTS3", "LWSA3", "POSI3", "INTB3", "SQIA3", "CASH3", "NINJ3", "MBLY3", "DESK3"],
  industrial: ["WEGE3", "EMBR3", "TUPY3", "MYPK3", "KEPL3", "ROMI3", "FRAS3", "SHUL4", "POMO4", "LEVE3", "MILS3"],
  construcao: ["CYRE3", "MRVE3", "EZTC3", "CURY3", "TEND3", "DIRR3", "EVEN3", "MDNE3", "LAVV3", "HBOR3", "TRIS3", "MELK3"],
  alimentos_bebidas: ["ABEV3", "JBSS3", "BRFS3", "MRFG3", "MDIA3", "SMTO3", "SLCE3", "CAML3", "BEEF3", "JALL3"],
  transporte_logistica: ["CCRO3", "RAIL3", "STBP3", "JSLG3", "VAMO3", "SIMH3", "TGMA3", "LOGN3", "AZUL4", "GOLL4", "ECOR3"],
  telecomunicacoes: ["VIVT3", "TIMS3", "OIBR3"],
  saneamento: ["SBSP3", "SAPR11", "CSMG3"],
  shopping_imobiliario: ["MULT3", "IGTI11", "ALOS3", "BRPR3", "LOGG3", "JHSF3"],
  agronegocio: ["AGRO3", "SLCE3", "SMTO3", "TTEN3", "FRIO3", "CAML3"],
  educacao: ["YDUQ3", "COGN3", "SEER3", "ANIM3"],
};

const SECTOR_LABELS: Record<string, string> = {
  bancos: "Bancos",
  seguros_financeiro: "Seguros e Financeiro",
  energia_eletrica: "Energia Elétrica",
  petroleo_gas: "Petróleo e Gás",
  mineracao_siderurgia: "Mineração e Siderurgia",
  papel_celulose: "Papel e Celulose",
  varejo: "Varejo",
  saude: "Saúde",
  tecnologia: "Tecnologia",
  industrial: "Industrial",
  construcao: "Construção Civil",
  alimentos_bebidas: "Alimentos e Bebidas",
  transporte_logistica: "Transporte e Logística",
  telecomunicacoes: "Telecomunicações",
  saneamento: "Saneamento",
  shopping_imobiliario: "Shopping e Imobiliário",
  agronegocio: "Agronegócio",
  educacao: "Educação",
};

export default function ScreenPage() {
  const { data: session } = useSession();
  const token = ((session as unknown) as Record<string, unknown>)?.accessToken as string ?? "";
  const { start, cancel, progress, result, error, isRunning } = useAnalysis(
    "/api/ws/screen",
    token,
  );

  const [sector, setSector] = useState("");
  const [customTickers, setCustomTickers] = useState<string[]>([]);
  const [tickerInput, setTickerInput] = useState("");
  const [mode, setMode] = useState<"sector" | "custom">("sector");

  const effectiveTickers =
    mode === "sector" && sector
      ? SECTOR_TICKERS[sector] ?? []
      : customTickers;

  const handleStart = () => {
    if (effectiveTickers.length === 0) return;
    start({ tickers: effectiveTickers });
  };

  const addTicker = (t: string) => {
    if (t && !customTickers.includes(t)) {
      setCustomTickers((prev) => [...prev, t]);
    }
    setTickerInput("");
  };

  const removeTicker = (t: string) => {
    setCustomTickers((prev) => prev.filter((x) => x !== t));
  };

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const totalTickers = effectiveTickers.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Screening B3</h1>
        <p className="mt-1 text-sm text-slate-400">
          Analise múltiplas ações por setor ou selecione uma lista
          personalizada para avaliação comparativa.
        </p>
      </div>

      {/* Input Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-5">
        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("sector")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "sector"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Por setor
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "custom"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Lista personalizada
          </button>
        </div>

        {/* Sector Selector */}
        {mode === "sector" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Setor</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="">Selecione um setor</option>
              {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({SECTOR_TICKERS[key].length} ações)
                </option>
              ))}
            </select>

            {sector && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SECTOR_TICKERS[sector]?.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Ticker List */}
        {mode === "custom" && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              Adicionar ações
            </label>
            <div className="flex gap-2 items-end">
              <TickerInput
                value={tickerInput}
                onChange={(t) => {
                  setTickerInput(t);
                  if (t) addTicker(t);
                }}
                placeholder="Buscar e adicionar ação"
              />
            </div>

            {customTickers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customTickers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs text-slate-300"
                  >
                    {t}
                    <button
                      onClick={() => removeTicker(t)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={isRunning ? cancel : handleStart}
          disabled={effectiveTickers.length === 0 && !isRunning}
          className={`
            inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold
            transition-all disabled:cursor-not-allowed disabled:opacity-40
            ${
              isRunning
                ? "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            }
          `}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelar
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Iniciar Screening
            </>
          )}
        </button>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Progresso</span>
            <span className="text-blue-400">
              {completedCount}/{totalTickers} ações analisadas
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
              style={{
                width: `${totalTickers > 0 ? (completedCount / totalTickers) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="space-y-1">
            {progress.map((p, i) => (
              <p key={i} className="text-xs text-slate-500">
                {p.agent && <span className="text-slate-400">[{p.agent}]</span>}{" "}
                {p.detail ?? p.status}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && <ReportViewer content={result.report_text} showDisclaimer={false} />}
    </div>
  );
}
