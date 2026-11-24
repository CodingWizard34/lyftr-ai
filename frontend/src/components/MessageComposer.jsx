import { useRef, useState } from "react";
import { Send, Paperclip, SlidersHorizontal, Loader2, X, FileText, Image as ImageIcon, RefreshCw } from "lucide-react";

const SYSTEM_PROMPT_PRESETS = [
  { label: "Helpful Assistant", prompt: "You are Lyftr AI, a helpful, precise, and friendly AI assistant." },
  { label: "Code Expert", prompt: "You are an elite software engineer. Provide clean, secure, well-commented code." },
  { label: "Concise & Direct", prompt: "Answer directly and concisely in clear bullet points without fluff." },
  { label: "Technical Architect", prompt: "Provide deep architectural analysis, engineering tradeoffs, and best practices." },
];

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  systemPrompt,
  onSystemPromptChange,
  isLoading,
  attachedFile,
  onAttachedFileChange,
}) {
  const fileInputRef = useRef(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(Boolean(systemPrompt));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      // Clear value first so selecting the same or updated file always fires onChange
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    // Reset input immediately so next click can pick a fresh file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAttachedFileChange({
          name: file.name,
          size: file.size,
          type: file.type,
          isImage: true,
          previewUrl: event.target?.result,
          lastModified: file.lastModified,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = typeof event.target?.result === "string" ? event.target.result : "";
        onAttachedFileChange({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          isImage: false,
          content: textContent,
          lastModified: file.lastModified,
        });
      };
      reader.readAsText(file);
    }
  };

  const triggerSend = () => {
    if (disabled || isLoading) return;

    if (attachedFile) {
      let snippet = "";
      if (attachedFile.isImage) {
        snippet = `[Attached Image: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)]\n\n${value.trim() || "Please describe or analyze this image."}`;
      } else if (attachedFile.content) {
        // Truncate file content so total prompt stays comfortably under 4000 characters
        const maxContentLen = Math.max(500, 3200 - value.trim().length);
        const snippetText = attachedFile.content.slice(0, maxContentLen);
        const truncatedNotice = attachedFile.content.length > maxContentLen ? "\n... [content truncated to fit character limit]" : "";
        snippet = `[Attached File: ${attachedFile.name}]\n\`\`\`\n${snippetText}${truncatedNotice}\n\`\`\`\n\n${value.trim() || "Please review and explain this attached file."}`;
      } else {
        snippet = `[Attached File: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)]\n\n${value.trim() || "Please assist with this file."}`;
      }

      onAttachedFileChange(null);
      onSend(snippet);
    } else {
      if (!value.trim()) return;
      onSend();
    }
  };

  return (
    <div className="composer-wrapper border-t border-border bg-surface/60 backdrop-blur p-4">
      {/* Top Toolbar: File Attachment & System Prompt toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-text-secondary">
          <button
            type="button"
            onClick={handleAttachClick}
            className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-surface border border-transparent ${
              attachedFile ? "text-purple font-medium bg-purple/15 border-purple/30" : "hover:text-text-primary"
            }`}
            title="Attach any file (code, documents, images, text, csv, etc.)"
          >
            <Paperclip className="w-3.5 h-3.5 text-purple" />
            <span>Attach File</span>
          </button>
          
          {/* File input accepting all files without restricting extensions */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-surface ${
              showSystemPrompt || systemPrompt ? "text-purple font-medium bg-purple/10" : "hover:text-text-primary"
            }`}
            title="Toggle custom system prompt"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>System Prompt</span>
            {systemPrompt && (
              <span className="w-2 h-2 rounded-full bg-purple inline-block ml-0.5" title="Active" />
            )}
          </button>
        </div>

        {/* Current Attached File Indicator */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple/20 border border-purple/40 text-xs text-text-primary animate-fade-in shadow-sm">
            {attachedFile.isImage && attachedFile.previewUrl ? (
              <img
                src={attachedFile.previewUrl}
                alt="thumbnail"
                className="w-5 h-5 rounded object-cover border border-purple/40 flex-shrink-0"
              />
            ) : (
              <FileText className="w-3.5 h-3.5 text-purple flex-shrink-0" />
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[11px] truncate max-w-[140px] text-text-primary font-medium">
                {attachedFile.name}
              </span>
              <span className="text-text-secondary text-[10px]">
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border/60">
              <button
                type="button"
                onClick={handleAttachClick}
                className="p-1 hover:text-purple text-text-secondary transition-colors"
                title="Change to a different file"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onAttachedFileChange(null)}
                className="p-1 hover:text-red-400 text-text-secondary transition-colors"
                title="Remove attached file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* System Prompt Expandable Drawer */}
      <div className={showSystemPrompt ? "mb-3 space-y-2 animate-fade-in" : "hidden"}>
        <div className="flex items-center justify-between text-[11px] text-text-secondary">
          <span className="font-medium text-text-primary">System Persona & Instructions:</span>
          {systemPrompt && (
            <button
              type="button"
              onClick={() => onSystemPromptChange("")}
              className="text-red-400 hover:underline text-[10px]"
            >
              Reset to Default
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {SYSTEM_PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSystemPromptChange(preset.prompt)}
              className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                systemPrompt === preset.prompt
                  ? "bg-purple/20 border-purple text-purple font-medium"
                  : "bg-surface border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <textarea
          data-testid="system-prompt-input"
          className="w-full bg-card/90 border border-purple/30 rounded-lg px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-purple/60 transition-colors resize-none placeholder:text-text-secondary/60"
          placeholder="Enter system prompt (e.g. 'You are an expert full-stack developer answering concisely')..."
          value={systemPrompt ?? ""}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          rows={2}
        />
      </div>

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-purple/50 transition-colors resize-none leading-relaxed"
            placeholder={
              attachedFile
                ? `Attached "${attachedFile.name}". Add a question or press Send...`
                : "Ask anything... (Shift+Enter for new line)"
            }
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
          onClick={triggerSend}
          disabled={disabled || (!value.trim() && !attachedFile)}
          className={`px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all transform active:scale-95 flex items-center justify-center min-w-[50px] ${
            disabled || (!value.trim() && !attachedFile)
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
