import { ChevronLeft, Settings, Wifi, AlertCircle } from "lucide-react";

export default function Header({
  collapsed,
  onToggleSidebar,
  model,
  onModelChange,
  onSettingsClick,
  connectionStatus,
  onReconnect,
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-surface text-text-secondary transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`w-5 h-5 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/50 cursor-pointer"
          >
            <option value="gemini/gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Recommended - Fast & Stable)</option>
            <option value="gemini/gemini-3.5-flash">Gemini 3.5 Flash (Standard)</option>
            <option value="gemini/gemini-3.8-flash">Gemini 3.8 Flash (Latest Preview)</option>
            <option value="gemini/gemini-pro-latest">Gemini Pro</option>
          </select>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                : connectionStatus === "checking"
                ? "bg-amber-400 animate-pulse"
                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            }`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "checking"
              ? "Checking..."
              : "Disconnected"}
          </span>
        </div>
        {connectionStatus !== "connected" && (
          <button
            onClick={onReconnect}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-red-400 transition-colors"
            title="Retry backend connection"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </header>
  );
}
