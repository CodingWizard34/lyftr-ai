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
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-backdrop px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-surface text-text-secondary"
        >
          <ChevronLeft className={`w-5 h-5 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/50"
          >
            {["gemini/gemini-2.0-flash", "gemini/gemini-1.5-flash", "claude-3-haiku"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button onClick={onSettingsClick} className="ml-2 p-2 rounded-lg hover:bg-surface text-text-secondary">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
            } animate-pulse`}
          />
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </span>
        </div>
        {connectionStatus !== "connected" && (
          <button
            onClick={onReconnect}
            className="p-2 rounded-lg hover:bg-surface text-text-secondary"
            title="Reconnect"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </header>
  );
}
