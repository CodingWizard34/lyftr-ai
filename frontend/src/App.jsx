import { useState, useEffect, useCallback, useRef } from "react";
import { chat, health, getMessages, extractError } from "./services/api";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import WelcomeScreen from "./components/WelcomeScreen";
import ChatWindow from "./components/ChatWindow";
import MessageComposer from "./components/MessageComposer";
import {
  X,
  CheckCircle,
  RefreshCw,
  Sliders,
  Database,
  AlertTriangle,
  Archive,
  ArrowRight,
  Trash2,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(undefined);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [healthData, setHealthData] = useState(null);
  const [model, setModel] = useState("gemini/gemini-3.5-flash-lite");
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [welcomeScreen, setWelcomeScreen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);

  // Saved sessions for History & Archive
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const stored = localStorage.getItem("lyftr_saved_sessions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals & Navigation Tabs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [syncingSqlite, setSyncingSqlite] = useState(false);

  const scrollRef = useRef(null);

  const checkBackendHealth = useCallback(() => {
    setConnectionStatus("checking");
    health()
      .then((res) => {
        setConnectionStatus("connected");
        setHealthData(res.data);
      })
      .catch(() => {
        setConnectionStatus("disconnected");
        setHealthData(null);
      });
  }, []);

  // Initialize session and poll health
  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
    checkBackendHealth();

    const timer = setInterval(() => {
      checkBackendHealth();
    }, 15000);
    return () => clearInterval(timer);
  }, [checkBackendHealth]);

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Persist sessions to localStorage whenever messages change
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;

    setSavedSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === sessionId);
      const firstUserMsg = messages.find((m) => m.role === "user")?.content || "Conversation";
      const lastMsg = messages[messages.length - 1]?.content || "";

      const updatedItem = {
        id: sessionId,
        title: firstUserMsg.length > 50 ? firstUserMsg.slice(0, 50) + "..." : firstUserMsg,
        preview: lastMsg.length > 80 ? lastMsg.slice(0, 80) + "..." : lastMsg,
        updatedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages,
        archived: existingIdx >= 0 ? prev[existingIdx].archived : false,
      };

      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = updatedItem;
      } else {
        next = [updatedItem, ...prev];
      }

      try {
        localStorage.setItem("lyftr_saved_sessions", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save session to localStorage:", e);
      }
      return next;
    });
  }, [messages, sessionId]);

  const handleNewChat = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
    setInputValue("");
    setAttachedFile(null);
    setHistoryOpen(false);
    setArchiveOpen(false);
  }, []);

  const handleSelectChat = useCallback(() => {
    setHistoryOpen(false);
    setArchiveOpen(false);
    setSettingsOpen(false);
    if (messages.length > 0) {
      setWelcomeScreen(false);
    }
  }, [messages]);

  const handleLoadSession = useCallback((targetSession) => {
    if (!targetSession) return;
    setSessionId(targetSession.id);
    setMessages(targetSession.messages || []);
    setWelcomeScreen(false);
    setError(null);
    setAttachedFile(null);
    setHistoryOpen(false);
    setArchiveOpen(false);
  }, []);

  const handleArchiveToggle = useCallback((targetId) => {
    setSavedSessions((prev) => {
      const next = prev.map((s) =>
        s.id === targetId ? { ...s, archived: !s.archived } : s
      );
      try {
        localStorage.setItem("lyftr_saved_sessions", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const handleDeleteSession = useCallback((targetId) => {
    setSavedSessions((prev) => {
      const next = prev.filter((s) => s.id !== targetId);
      try {
        localStorage.setItem("lyftr_saved_sessions", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (sessionId === targetId) {
      handleNewChat();
    }
  }, [sessionId, handleNewChat]);

  const handleSyncSessionFromSqlite = useCallback(async (targetId) => {
    setSyncingSqlite(true);
    try {
      const res = await getMessages(targetId);
      if (res.data?.messages) {
        setMessages(res.data.messages);
        setSessionId(targetId);
        setWelcomeScreen(false);
        setHistoryOpen(false);
      }
    } catch (err) {
      alert("Unable to fetch session messages from SQLite: " + extractError(err));
    } finally {
      setSyncingSqlite(false);
    }
  }, []);

  const handleSend = useCallback(async (textOverride) => {
    const rawText = typeof textOverride === "string" ? textOverride : inputValue;
    if (!rawText || !rawText.trim() || loading || !sessionId) return;

    const text = rawText.trim();
    setInputValue("");
    setLoading(true);
    setError(null);
    setWelcomeScreen(false);

    const optimisticUser = { role: "user", content: text, metadata: null };
    setMessages((prev) => [...prev, optimisticUser]);

    const headers = {};
    if (simulateFailure) {
      headers["X-Simulate-Failure"] = "key_1=429";
    }

    try {
      const res = await chat(
        {
          session_id: sessionId,
          message: text,
          system_prompt: systemPrompt || undefined,
          model: model,
        },
        headers
      );

      setConnectionStatus("connected");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply,
          metadata: res.data.metadata,
        },
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, sessionId, systemPrompt, simulateFailure, model]);

  const handlePromptSelect = useCallback((prompt) => {
    handleSend(prompt);
  }, [handleSend]);

  const activeSessionsList = savedSessions.filter((s) => !s.archived);
  const archivedSessionsList = savedSessions.filter((s) => s.archived);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        activeSession={sessionId || ""}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onOpenHistory={() => {
          setHistoryOpen(true);
          setArchiveOpen(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenArchive={() => {
          setArchiveOpen(true);
          setHistoryOpen(false);
        }}
        activeTab={historyOpen ? "history" : archiveOpen ? "archive" : "chat"}
        sessionCount={activeSessionsList.length}
        archivedCount={archivedSessionsList.length}
      />

      <div className={`workspace flex flex-col flex-1 h-screen overflow-hidden ${collapsed ? "collapsed" : ""}`}>
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          model={model}
          onModelChange={setModel}
          onSettingsClick={() => setSettingsOpen(true)}
          connectionStatus={connectionStatus}
          onReconnect={checkBackendHealth}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative w-full">
          <div className="flex-1 overflow-y-auto w-full" ref={scrollRef}>
            <div className="max-w-4xl mx-auto w-full px-4 py-6">
              {welcomeScreen && messages.length === 0 ? (
                <WelcomeScreen onPromptSelect={handlePromptSelect} />
              ) : (
                <ChatWindow messages={messages} isLoading={loading} />
              )}
            </div>

            {error && (
              <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center mx-6 my-4 flex items-center justify-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-surface/50 backdrop-blur z-10 w-full">
            <div className="max-w-4xl mx-auto w-full">
              <MessageComposer
                value={inputValue}
                onChange={setInputValue}
                onSend={(msg) => handleSend(msg)}
                disabled={loading}
                systemPrompt={systemPrompt}
                onSystemPromptChange={setSystemPrompt}
                isLoading={loading}
                attachedFile={attachedFile}
                onAttachedFileChange={setAttachedFile}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple" />
                <h3 className="font-semibold text-text-primary text-base">Settings & System Info</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface/60 border border-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Backend Connection:</span>
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      connectionStatus === "connected" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {connectionStatus}
                  </span>
                </div>
                {healthData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Keys Configured:</span>
                      <span className="font-mono text-purple font-medium">
                        {healthData.keys_configured} active in pool
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Cache Engine:</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {healthData.cache_enabled ? "Active (In-Memory LiteLLM)" : "Disabled"}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-text-secondary">Backend Host:</span>
                  <span className="font-mono text-[10px] text-text-primary truncate max-w-[210px]">
                    {import.meta.env.VITE_API_URL || "http://localhost:8000"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-primary font-medium block">Default Global System Prompt</label>
                <textarea
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary text-xs focus:outline-none focus:border-purple/50 resize-none"
                  rows={2}
                  placeholder="Set global system prompt (optional)..."
                  value={systemPrompt ?? ""}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-surface/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-text-primary font-medium">Simulate Key 1 Failure (429)</div>
                  <div className="text-[10px] text-text-secondary">Tests seamless multi-key provider fallback</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulateFailure(!simulateFailure)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    simulateFailure
                      ? "bg-amber-500 text-black font-semibold shadow-sm"
                      : "bg-surface border border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {simulateFailure ? "Simulating 429" : "Normal"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple text-white text-xs font-medium hover:bg-purple/90 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple" />
                <div>
                  <h3 className="font-semibold text-text-primary text-base leading-tight">Conversation History</h3>
                  <span className="text-[10px] text-text-secondary">Persisted across SQLite database & local storage</span>
                </div>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Session Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-border mb-4 text-xs">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple" />
                <span className="text-text-secondary">Active Session ID:</span>
                <span className="font-mono text-purple font-medium truncate max-w-[220px]">{sessionId}</span>
              </div>
              <button
                onClick={() => handleSyncSessionFromSqlite(sessionId)}
                disabled={syncingSqlite}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple/15 text-purple text-[11px] hover:bg-purple/25 transition-colors font-medium"
                title="Verify and sync history directly from SQLite"
              >
                <RefreshCw className={`w-3 h-3 ${syncingSqlite ? "animate-spin" : ""}`} />
                <span>Sync SQLite</span>
              </button>
            </div>

            {/* Session Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {savedSessions.length === 0 ? (
                <div className="p-12 text-center text-text-secondary text-xs">
                  <Database className="w-8 h-8 text-purple/40 mx-auto mb-2" />
                  <p className="font-medium text-text-primary">No conversation history yet</p>
                  <p className="mt-1">Send a prompt in the chat to start recording persistent conversations in SQLite.</p>
                </div>
              ) : (
                savedSessions.map((s) => {
                  const isActive = s.id === sessionId;
                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-purple/10 border-purple/40 shadow-sm"
                          : "bg-surface/40 border-border hover:bg-surface/70 hover:border-purple/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-text-primary text-xs truncate max-w-[280px]">
                              {s.title}
                            </span>
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                                Active Now
                              </span>
                            )}
                            {s.archived && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Archived
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary truncate">{s.preview}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(s.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span>{s.messageCount} messages</span>
                            <span className="font-mono text-purple/80">{s.id.slice(0, 8)}...</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleLoadSession(s)}
                            className="px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple/90 transition-colors flex items-center gap-1 shadow-sm"
                            title="Load this conversation into the chat"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(s.id)}
                            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                            title={s.archived ? "Unarchive" : "Archive session"}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-text-secondary text-[11px]">
                {savedSessions.length} total saved conversation(s)
              </span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple text-white text-xs font-medium hover:bg-purple/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archived Chats Modal */}
      {archiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-fade-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-purple" />
                <div>
                  <h3 className="font-semibold text-text-primary text-base leading-tight">Archived Chats</h3>
                  <span className="text-[10px] text-text-secondary">Saved records safely stored away from your active view</span>
                </div>
              </div>
              <button
                onClick={() => setArchiveOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Archive active chat button */}
            {messages.length > 0 && !archivedSessionsList.some((s) => s.id === sessionId) && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-purple/30 mb-3 text-xs">
                <div>
                  <span className="font-medium text-text-primary">Current Chat Has Messages</span>
                  <p className="text-[10px] text-text-secondary">Archive this active conversation</p>
                </div>
                <button
                  onClick={() => {
                    handleArchiveToggle(sessionId);
                    handleNewChat();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple/20 text-purple border border-purple/40 text-xs font-medium hover:bg-purple/30 transition-colors"
                >
                  Archive Active Chat
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {archivedSessionsList.length === 0 ? (
                <div className="p-10 text-center text-text-secondary text-xs">
                  <Archive className="w-8 h-8 text-purple/40 mx-auto mb-2" />
                  <p className="font-medium text-text-primary">No archived chats</p>
                  <p className="mt-1">
                    Keep your active workspace clean by archiving conversations. They will appear here and can be restored anytime.
                  </p>
                </div>
              ) : (
                archivedSessionsList.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-border bg-surface/40 hover:bg-surface/70 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text-primary truncate mb-0.5">{s.title}</h4>
                      <p className="text-[11px] text-text-secondary truncate">{s.preview}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-secondary">
                        <span>{s.messageCount} messages</span>
                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          handleArchiveToggle(s.id);
                          handleLoadSession(s);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple/90 transition-colors shadow-sm"
                        title="Restore and continue conversation"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-text-secondary text-[11px]">
                {archivedSessionsList.length} archived session(s)
              </span>
              <button
                onClick={() => setArchiveOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple text-white text-xs font-medium hover:bg-purple/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
