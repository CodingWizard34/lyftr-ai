import { MessageCircle, Zap, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "Smart Conversations",
    description: "Continue conversations with contextual AI memory across sessions.",
    prompt: "Demonstrate your multi-turn memory by summarizing what we can build together.",
    icon: MessageCircle,
  },
  {
    title: "Intelligent Caching",
    description: "Zero-latency responses through deterministic in-memory response caching.",
    prompt: "Explain how LiteLLM response caching works and how it saves tokens.",
    icon: Zap,
  },
  {
    title: "Reliable AI",
    description: "Automatic multi-key provider fallback for uninterrupted conversations.",
    prompt: "Explain how multi-key failover works when an upstream provider rate limits.",
    icon: ShieldCheck,
  },
];

const prompts = [
  "Explain how multi-key failover works",
  "Write a summary of distributed caching",
  "Help me debug a FastAPI backend service",
  "Brainstorm ideas for an AI startup",
];

export default function WelcomeScreen({ onPromptSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6 py-8">
      <div className="relative w-24 h-24 mb-6 animate-orb-float">
        <div className="absolute inset-0 rounded-full bg-purple/20 blur-3xl animate-pulse-glow" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-violet-500 shadow-[0_0_40px_rgba(168,85,247,0.6)]" />
      </div>

      <h1 className="text-2xl md:text-3xl font-light text-text-primary mb-3 leading-tight">
        Ready to Create Something New?
      </h1>
      <p className="text-text-secondary text-sm mb-8 max-w-md">
        Your resilient full-stack AI workspace with multi-key failover and intelligent caching.
      </p>

      <div className="flex flex-wrap justify-center gap-2.5 mb-10 max-w-2xl">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPromptSelect(p)}
            className="chip hover:border-purple/50 active:scale-95 transition-all text-xs"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => onPromptSelect(card.prompt)}
            className="card flex flex-col gap-2.5 text-left hover:border-purple/40 hover:bg-surface/60 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <card.icon className="w-4 h-4 text-purple group-hover:text-accent transition-colors" />
              <span className="text-text-primary text-xs font-semibold uppercase tracking-wider">
                {card.title}
              </span>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
