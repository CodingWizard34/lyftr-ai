import { useRef, useState } from "react";
import { Send, Paperclip, SlidersHorizontal, Loader2 } from "lucide-react";

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  systemPrompt,
  onSystemPromptChange,
  isLoading,
}) {
  const fileInputRef = useRef(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(Boolean(systemPrompt));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const snippet = `\n\n[File: ${file.name}]\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``;
        onChange(value ? `${value}${snippet}` : snippet);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="composer-wrapper border-t border-border bg-surface/50 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-text-secondary">
          <button
            type="button"
            onClick={handleAttachClick}
            className="flex items-center gap-1.5 text-xs hover:text-text-primary transition-colors cursor-pointer"
            title="Attach a code or text file"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attach File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.html,.css,.csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
              showSystemPrompt || systemPrompt ? "text-purple font-medium" : "hover:text-text-primary"
            }`}
            title="Toggle custom system prompt"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>System Prompt {systemPrompt ? "(Active)" : ""}</span>
          </button>
        </div>
      </div>

      <div className={showSystemPrompt ? "mb-3" : "hidden"}>
        <textarea
          data-testid="system-prompt-input"
          className="w-full bg-card/80 border border-purple/30 rounded-lg px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-purple/60 transition-colors resize-none"
          placeholder="System prompt (e.g. 'You are an expert full-stack developer answering concisely')..."
          value={systemPrompt ?? ""}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-purple/50 transition-colors resize-none"
            placeholder="Ask anything... (Shift+Enter for new line)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={2}
            maxLength={4000}
            data-testid="chat-input"
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-text-secondary">
            {value.length}/4000
          </div>
        </div>

        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={`px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg transition-all transform active:scale-95 flex items-center justify-center min-w-[50px] ${
            disabled || !value.trim()
              ? "bg-surface text-text-secondary cursor-not-allowed shadow-none"
              : "bg-purple text-white shadow-purple glow hover:bg-purple/90"
          }`}
          data-testid="send-button"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
