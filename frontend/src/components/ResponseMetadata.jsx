import { Send } from "lucide-react";

export function ResponseMetadata({ metadata }) {
  if (!metadata) return null;
  const source = metadata.resolution_source === "LLM_CACHE" ? "LLM_CACHE" : "LIVE_INFERENCE";
  const keyId = metadata.key_id ? metadata.key_id : "-";

  return (
    <div className="flex items-center justify-between mt-2 px-5 py-2 bg-surface/50 rounded-lg border border-border/50 text-[10px] uppercase tracking-wider text-text-secondary">
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" />
          <span className="data-testid meta-source">{source}</span>
        </span>
      </div>
      <div className="flex items-center gap-4 text-text-secondary">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="data-testid meta-model">{metadata.model}</span>
          <span>·</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="data-testid meta-latency">{metadata.latency_ms} ms</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="data-testid meta-input-tokens">{metadata.input_tokens} tokens</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="data-testid meta-output-tokens">{metadata.output_tokens} tokens</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-text-secondary">
        <span>Key: {keyId}</span>
      </div>
    </div>
  );
}