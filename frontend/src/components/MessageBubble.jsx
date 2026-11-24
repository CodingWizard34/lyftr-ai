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
          <div className="prose prose-invert max-w-none text-text-primary text-sm space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
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
    <div className="flex flex-wrap items-center justify-between gap-2 mt-1 mb-4 px-4 py-2 bg-surface/60 rounded-lg border border-border/60 text-[10px] uppercase tracking-wider text-text-secondary max-w-[85%] md:max-w-[75%]">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isCache ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
          }`}
        />
        <span className={`font-semibold ${isCache ? "text-amber-400" : "text-emerald-400"} data-testid meta-source`}>
          {source}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="data-testid meta-model text-text-primary font-medium">{metadata.model}</span>
        </div>
        <span>·</span>
        <div>
          <span className="data-testid meta-latency font-medium">{metadata.latency_ms} ms</span>
        </div>
        <span>·</span>
        <div>
          <span className="data-testid meta-input-tokens">{metadata.input_tokens} in</span>
          <span className="mx-1">/</span>
          <span className="data-testid meta-output-tokens">{metadata.output_tokens} out</span>
        </div>
        <span>·</span>
        <div>
          <span>Key: <strong className="text-purple">{keyId}</strong></span>
        </div>
      </div>
    </div>
  );
}
