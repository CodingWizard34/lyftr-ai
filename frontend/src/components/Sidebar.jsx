import { ChevronLeft, Settings, Plus, LogOut, Archive, BookOpen, MessageCircle as MsgCircle } from "lucide-react";

export default function Sidebar({
  collapsed,
  onToggle,
  activeSession,
  onNewChat,
  onSelectChat,
  onOpenHistory,
  onOpenSettings,
  onOpenArchive,
  activeTab = "chat",
  sessionCount = 0,
  archivedCount = 0,
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple to-accent flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple/30">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-text-primary text-sm tracking-tight leading-tight">Lyftr AI</span>
              <span className="text-[10px] text-text-secondary leading-none">Resilient Workspace</span>
            </div>
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

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {!collapsed ? (
          <>
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple/15 border border-purple/30 text-text-primary text-xs font-medium transition-all hover:bg-purple/25 hover:border-purple/50 active:scale-98 shadow-sm"
            >
              <Plus className="w-4 h-4 text-purple" />
              <span>New Chat</span>
            </button>

            <div className="mt-5 mb-2 px-2">
              <span className="block text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-2">Features</span>
              <div className="space-y-1">
                {/* Chat */}
                <button
                  onClick={onSelectChat}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    activeTab === "chat"
                      ? "bg-purple/20 text-text-primary border border-purple/30 font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MsgCircle className="w-4 h-4 text-purple" />
                    <span>Chat</span>
                  </div>
                  {sessionCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface text-text-secondary border border-border">
                      {sessionCount}
                    </span>
                  )}
                </button>

                {/* Archived */}
                <button
                  onClick={onOpenArchive}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    activeTab === "archive"
                      ? "bg-purple/20 text-text-primary border border-purple/30 font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Archive className="w-4 h-4 text-purple" />
                    <span>Archived</span>
                  </div>
                  {archivedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple/30 text-purple border border-purple/40">
                      {archivedCount}
                    </span>
                  )}
                </button>

                {/* Conversation History */}
                <button
                  onClick={onOpenHistory}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    activeTab === "history"
                      ? "bg-purple/20 text-text-primary border border-purple/30 font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-purple" />
                    <span>Conversation History</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="mt-5 mb-2 px-2">
              <span className="block text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-2">Settings</span>
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-purple" />
                <span>Settings</span>
              </button>
            </div>
          </>
        ) : (
          /* Collapsed view icons */
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg bg-purple/20 text-purple hover:bg-purple/30 transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onSelectChat}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === "chat" ? "bg-purple text-white" : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
              title="Chat"
            >
              <MsgCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenArchive}
              className="p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              title="Archived"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              title="Conversation History"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="card !p-3 space-y-2.5 bg-surface/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple/15 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-text-primary font-medium">Session</div>
                <div className="text-[10px] text-text-secondary font-mono truncate">
                  {activeSession ? activeSession.slice(0, 14) + "..." : "Default"}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
              <span className="text-text-secondary uppercase tracking-wider">Version</span>
              <span className="text-text-primary font-medium">v1.0 (Gemini)</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full py-1.5 rounded-lg text-[11px] text-text-secondary hover:text-text-primary transition-colors text-center mt-1"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    </aside>
  );
}
