import { useState, useEffect, useCallback, useRef } from "react";
import { chat, health, extractError } from "./services/api";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import WelcomeScreen from "./components/WelcomeScreen";
import ChatWindow from "./components/ChatWindow";
import MessageComposer from "./components/MessageComposer";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(undefined);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [model, setModel] = useState("gemini/gemini-2.0-flash");
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [welcomeScreen, setWelcomeScreen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
  }, []);

  useEffect(() => {
    health()
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("disconnected"));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setWelcomeScreen(true);
    setError(null);
  }, []);

  const handleSelectSession = useCallback((id) => {
    setWelcomeScreen(false);
    setError(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading || !sessionId) return;

    const text = inputValue.trim();
    setInputValue("");
    setLoading(true);
    setError(null);
    setWelcomeScreen(false);

    const optimisticUser = { role: "user", content: text, metadata: null };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await chat({
        session_id: sessionId,
        message: text,
        system_prompt: systemPrompt || undefined,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, metadata: res.data.metadata }]);
    } catch (err) {
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, sessionId, systemPrompt]);

  const handlePromptSelect = useCallback((prompt) => {
    setInputValue(prompt);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        sessions={[]}
        activeSession={sessionId || ""}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <div className={`workspace flex flex-col ${collapsed ? "collapsed" : ""}`}>
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          model={model}
          onModelChange={setModel}
          onSettingsClick={() => {}}
          connectionStatus={connectionStatus}
          onReconnect={() => setConnectionStatus("connected")}
        />
        <main className="flex-1 flex flex-col" ref={scrollRef}>
          {welcomeScreen ? (
            <WelcomeScreen onPromptSelect={handlePromptSelect} />
          ) : (
            <>
              <ChatWindow messages={messages} />
              <div className="border-t border-border">
                <MessageComposer
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  disabled={loading}
                  systemPrompt={systemPrompt}
                  onSystemPromptChange={setSystemPrompt}
                  isLoading={loading}
                />
              </div>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-400 text-center mx-8 my-2">
                  {error}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
