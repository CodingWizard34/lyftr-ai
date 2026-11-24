import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ role, content, metadata }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] p-4 text-sm leading-relaxed transition-all shadow-md ${
          isUser
            ? "bg-purple/20 text-text-primary border border-purple/40 rounded-2xl rounded-tr-sm text-right"
            : "bg-surface text-text-primary border border-border/80 rounded-2xl rounded-tl-sm text-left"
        }`}
        data-testid={isUser ? "user-message" : "assistant-message"}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div>
            <div className="prose prose-invert max-w-none text-text-primary text-sm space-y-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
            {metadata && (
              <ResponseMetadata metadata={metadata} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResponseMetadata({ metadata }) {
  if (!metadata) return null;
  const isCache = metadata.resolution_source === "LLM_CACHE";
  const source = isCache ? "LLM_CACHE" : "LIVE_INFERENCE";
  const keyId = metadata.key_id ? metadata.key_id : "-";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border/60 text-[10px] uppercase tracking-wider text-text-secondary">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isCache ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
          }`}
        />
        <span
          data-testid="meta-source"
          className={`font-semibold ${isCache ? "text-amber-400" : "text-emerald-400"}`}
        >
          {source}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span data-testid="meta-model" className="text-text-primary font-medium">
            {metadata.model}
          </span>
        </div>
        <span>·</span>
        <div>
          <span data-testid="meta-latency" className="font-medium">
            {metadata.latency_ms} ms
          </span>
        </div>
        <span>·</span>
        <div>
          <span data-testid="meta-input-tokens">{metadata.input_tokens}</span> in
          <span className="mx-1">/</span>
          <span data-testid="meta-output-tokens">{metadata.output_tokens}</span> out
        </div>
        <span>·</span>
        <div>
          <span>Key: <strong className="text-purple">{keyId}</strong></span>
        </div>
      </div>
    </div>
  );
}
