import { useState, useEffect, useCallback, useRef } from "react";
import { chat, health, getMessages, extractError } from "./services/api";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import WelcomeScreen from "./components/WelcomeScreen";
import ChatWindow from "./components/ChatWindow";
import MessageComposer from "./components/MessageComposer";
import { X, CheckCircle, RefreshCw, Sliders, Database, AlertTriangle } from "lucide-react";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(undefined);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [healthData, setHealthData] = useState(null);
  const [model, setModel] = useState("gemini/gemini-2.0-flash");
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [welcomeScreen, setWelcomeScreen] = useState(true);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

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

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
    checkBackendHealth();
  }, [checkBackendHealth]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleNewChat = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
    setInputValue("");
  }, []);

  const handleSelectSession = useCallback(() => {
    setWelcomeScreen(false);
    setError(null);
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
  }, [inputValue, loading, sessionId, systemPrompt, simulateFailure]);

  const handlePromptSelect = useCallback((prompt) => {
    handleSend(prompt);
  }, [handleSend]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        sessions={[]}
        activeSession={sessionId || ""}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenArchive={() => setArchiveOpen(true)}
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
              <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center mx-6 my-4 flex items-center justify-center gap-2">
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
                onSend={() => handleSend()}
                disabled={loading}
                systemPrompt={systemPrompt}
                onSystemPromptChange={setSystemPrompt}
                isLoading={loading}
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
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-surface/60 border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Backend Status:</span>
                  <span className={`font-semibold uppercase tracking-wider ${connectionStatus === "connected" ? "text-emerald-400" : "text-red-400"}`}>
                    {connectionStatus}
                  </span>
                </div>
                {healthData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Keys Configured:</span>
                      <span className="font-mono text-purple">{healthData.keys_configured} active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Cache Status:</span>
                      <span className="font-mono text-emerald-400">
                        {healthData.cache_enabled ? "Enabled (In-Memory)" : "Disabled"}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-text-secondary">API Target:</span>
                  <span className="font-mono text-[10px] text-text-primary truncate max-w-[200px]">
                    {import.meta.env.VITE_API_URL || "http://localhost:8000"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-primary font-medium block">Default System Prompt</label>
                <textarea
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary text-xs focus:outline-none focus:border-purple/50 resize-none"
                  rows={2}
                  placeholder="Set global system prompt (optional)..."
                  value={systemPrompt ?? ""}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg bg-surface/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-text-primary font-medium">Simulate Key 1 Failure</div>
                  <div className="text-[10px] text-text-secondary">Sends X-Simulate-Failure: key_1=429</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulateFailure(!simulateFailure)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    simulateFailure ? "bg-amber-500 text-black" : "bg-surface border border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {simulateFailure ? "Simulating 429" : "Normal"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-fade-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple" />
                <h3 className="font-semibold text-text-primary text-base">Conversation History (SQLite)</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-text-secondary mb-3">
              Active Session ID: <span className="font-mono text-purple">{sessionId}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-text-secondary text-xs">
                  No messages recorded in the active session yet. Send a message to start recording history in SQLite.
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface/50 border border-border/60 text-xs">
                    <span className="font-bold text-purple uppercase text-[10px] block mb-1">
                      {m.role}
                    </span>
                    <p className="text-text-primary line-clamp-3">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
              <span className="text-[10px] text-text-secondary">{messages.length} message(s) in session</span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-purple/20 text-purple mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-text-primary text-sm mb-1">Archived Sessions</h4>
            <p className="text-text-secondary text-xs mb-4">
              All previous sessions are safely persisted in SQLite storage. Use "New Chat" to start a fresh thread anytime.
            </p>
            <button
              onClick={() => setArchiveOpen(false)}
              className="px-4 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple/90"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
