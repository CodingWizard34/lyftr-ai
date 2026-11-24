import { Send } from "lucide-react";

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  systemPrompt,
  onSystemPromptChange,
  isLoading,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="composer-wrapper border-t border-border bg-surface/50 backdrop-blur p-4">
      <div className="flex items-end gap-3">
        <div className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary">
          <Send className="w-4 h-4" />
          <span className="text-xs">Attach</span>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex-1 relative">
          <textarea
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-purple/50 transition-colors resize-none"
            placeholder="Ask anything..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={2}
            maxLength={4000}
            data-testid="chat-input"
          />
          <div className="absolute bottom-1 right-2 text-[10px] text-text-secondary">
            {value.length}/4000
          </div>
        </div>

        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={`px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg transition-all transform active:scale-95 ${
            disabled || !value.trim()
              ? "bg-surface text-text-secondary cursor-not-allowed shadow-none"
              : "bg-purple text-white shadow-purple glow"
          }`}
          data-testid="send-button"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {systemPrompt !== undefined && (
        <div className="mt-3">
          <textarea
            className="w-full bg-surface/30 border border-rounded-lg px-3 py-2 text-text-secondary text-xs focus:outline-none focus:border-purple/50 transition-colors"
            placeholder="System prompt (optional)"
            value={systemPrompt ?? ""}
            onChange={(e) => onSystemPromptChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}