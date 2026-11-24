import { ChevronLeft, Settings, Plus, LogOut, Archive, BookOpen, MessageCircle as MsgCircle } from "lucide-react";

export default function Sidebar({
  collapsed,
  onToggle,
  sessions = [],
  activeSession,
  onSelectSession,
  onNewChat,
  onOpenHistory,
  onOpenSettings,
  onOpenArchive,
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="flex items-center justify-between px-5 py-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple/30">
              L
            </div>
            <span className="font-bold text-text-primary text-sm tracking-tight">Lyftr AI</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {!collapsed && (
          <>
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple/15 border border-purple/30 text-text-primary text-sm font-medium transition-all hover:bg-purple/25 hover:border-purple/50 active:scale-98"
            >
              <Plus className="w-4 h-4 text-purple" />
              New Chat
            </button>
            <div className="mt-5 mb-2 px-2">
              <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-2">Features</span>
              <div className="space-y-1">
                <button
                  onClick={() => onSelectSession?.("chat")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSession === "chat" || !activeSession
                      ? "bg-purple/20 text-text-primary border border-purple/30 font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/30"
                  }`}
                >
                  <MsgCircle className="w-4 h-4 text-purple" /> Chat
                </button>
                <button
                  onClick={onOpenArchive}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface/30 transition-colors"
                >
                  <Archive className="w-4 h-4" /> Archived
                </button>
                <button
                  onClick={onOpenHistory}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface/30 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Conversation History
                </button>
              </div>
            </div>
            <div className="mt-5 mb-2 px-2">
              <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-2">Settings</span>
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface/30 transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                <LogOut className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <div className="text-xs text-text-primary font-medium">Session</div>
                <div className="text-[10px] text-text-secondary font-mono truncate max-w-[140px]">
                  {activeSession ? activeSession.slice(0, 16) + "..." : "Default"}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Product</div>
              <div className="text-xs text-text-primary font-medium">Lyftr AI v1.0</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors text-center mt-2"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    </aside>
  );
}
