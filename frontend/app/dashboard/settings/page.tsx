"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { backendFetch } from "@/lib/api";
import { Key, Shield, Zap } from "lucide-react";

interface KeyStatus {
  exists: boolean;
  key_prefix?: string;
  is_valid: boolean;
}

const profiles = [
  {
    id: "quality",
    label: "Quality",
    icon: Shield,
    description: "Claude Opus para tudo — máxima qualidade, maior custo",
    color: "border-purple-500",
    bgActive: "bg-purple-500/10",
  },
  {
    id: "balanced",
    label: "Balanced",
    icon: Zap,
    description: "Claude Sonnet + Haiku — bom equilíbrio (padrão)",
    color: "border-blue-500",
    bgActive: "bg-blue-500/10",
  },
  {
    id: "budget",
    label: "Budget",
    icon: Zap,
    description: "Claude Haiku para análises — menor custo",
    color: "border-green-500",
    bgActive: "bg-green-500/10",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [apiKey, setApiKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [deletingKey, setDeletingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedProfile, setSelectedProfile] = useState("balanced");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchKeyStatus = useCallback(async () => {
    if (!token) return;
    setLoadingKey(true);
    try {
      const data = await backendFetch("/api/keys/status", token);
      setKeyStatus(data);
    } catch {
      setKeyStatus(null);
    } finally {
      setLoadingKey(false);
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await backendFetch("/api/profile", token);
      if (data?.profile) setSelectedProfile(data.profile);
    } catch {
      // keep default
    }
  }, [token]);

  useEffect(() => {
    fetchKeyStatus();
    fetchProfile();
  }, [fetchKeyStatus, fetchProfile]);

  const handleSaveKey = async () => {
    if (!token || !apiKey.trim()) return;
    setSavingKey(true);
    setKeyMessage(null);
    try {
      await backendFetch("/api/keys", token, {
        method: "POST",
        body: JSON.stringify({ api_key: apiKey }),
      });
      setKeyMessage({ type: "success", text: "Chave salva com sucesso!" });
      setApiKey("");
      await fetchKeyStatus();
    } catch {
      setKeyMessage({ type: "error", text: "Erro ao salvar a chave." });
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!token) return;
    setDeletingKey(true);
    setKeyMessage(null);
    try {
      await backendFetch("/api/keys", token, { method: "DELETE" });
      setKeyMessage({ type: "success", text: "Chave removida com sucesso." });
      setKeyStatus({ exists: false, is_valid: false });
    } catch {
      setKeyMessage({ type: "error", text: "Erro ao remover a chave." });
    } finally {
      setDeletingKey(false);
    }
  };

  const handleProfileChange = async (profileId: string) => {
    if (!token) return;
    setSelectedProfile(profileId);
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await backendFetch("/api/profile", token, {
        method: "PUT",
        body: JSON.stringify({ profile: profileId }),
      });
      setProfileMessage({ type: "success", text: "Perfil atualizado!" });
    } catch {
      setProfileMessage({ type: "error", text: "Erro ao atualizar o perfil." });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>

      {/* Section 1: API Key Management */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-6 mb-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-semibold">Chave de API Anthropic</h2>
        </div>

        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              loadingKey ? "bg-gray-500" : keyStatus?.exists ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {loadingKey ? (
            <span className="text-gray-400">Verificando...</span>
          ) : keyStatus?.exists ? (
            <span className="text-green-400">
              Chave configurada: <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">{keyStatus.key_prefix}</code>
            </span>
          ) : (
            <span className="text-red-400">Nenhuma chave configurada</span>
          )}
        </div>

        {/* Input + buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveKey}
            disabled={savingKey || !apiKey.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {savingKey ? "Salvando..." : "Salvar Chave"}
          </button>
        </div>

        {keyStatus?.exists && (
          <button
            onClick={handleDeleteKey}
            disabled={deletingKey}
            className="mt-3 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            {deletingKey ? "Removendo..." : "Remover Chave"}
          </button>
        )}

        {keyMessage && (
          <p className={`mt-3 text-sm ${keyMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {keyMessage.text}
          </p>
        )}
      </div>

      {/* Section 2: Profile Selector */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Perfil de Análise</h2>
        </div>
        <p className="text-gray-400 text-sm mb-5">
          Selecione o equilíbrio entre qualidade e custo para suas análises.
        </p>

        <div className="space-y-3">
          {profiles.map((profile) => {
            const isActive = selectedProfile === profile.id;
            const Icon = profile.icon;
            return (
              <button
                key={profile.id}
                onClick={() => handleProfileChange(profile.id)}
                disabled={savingProfile}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  isActive
                    ? `${profile.color} ${profile.bgActive}`
                    : "border-slate-600 hover:border-slate-500"
                } disabled:opacity-70`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                  <div>
                    <div className="font-medium">{profile.label}</div>
                    <div className="text-sm text-gray-400">{profile.description}</div>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded-full">Ativo</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {profileMessage && (
          <p className={`mt-3 text-sm ${profileMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {profileMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
