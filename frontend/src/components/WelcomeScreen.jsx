import { MessageCircle, Zap, ShieldCheck, Sparkles } from "lucide-react";

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

const naturalPrompts = [
  "Explain how multi-key failover works",
  "Write a summary of distributed caching",
  "Explain quantum computing in simple terms",
  "Write a clean Python script for data processing",
  "Help me debug a FastAPI backend service",
  "Brainstorm 5 innovative startup ideas",
  "Draft a polite follow-up email to a client",
  "How does response caching save LLM costs?",
];

export default function WelcomeScreen({ onPromptSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-8">
      {/* Animated Glowing AI Orb */}
      <div className="relative w-24 h-24 mb-7 animate-orb-float flex items-center justify-center">
        {/* Soft breathing outer halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/50 via-fuchsia-500/40 to-indigo-500/40 blur-2xl animate-pulse-glow" />
        
        {/* Outer subtle ring */}
        <div className="absolute -inset-1.5 rounded-full border border-purple-400/25 animate-spin [animation-duration:18s]" />

        {/* Multi-layered glassmorphic sphere */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 p-[1.5px] shadow-[0_0_40px_rgba(168,85,247,0.55)]">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-500/40 via-[#18122B]/90 to-[#0e0c18] flex items-center justify-center backdrop-blur-md overflow-hidden relative">
            {/* Top specular reflection */}
            <div className="absolute -top-3 left-2 w-10 h-7 rounded-full bg-white/25 blur-[3px] pointer-events-none" />
            
            {/* Glowing Icon */}
            <Sparkles className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-light text-text-primary mb-3 leading-tight">
        Ready to Create Something New?
      </h1>
      <p className="text-text-secondary text-sm mb-8 max-w-md">
        Your resilient full-stack AI workspace with multi-key failover and intelligent caching.
      </p>

      {/* Natural Prompts Grid */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-2xl">
        {naturalPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onPromptSelect(p)}
            className="chip hover:border-purple/50 active:scale-95 transition-all text-xs py-1.5 px-3.5 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => onPromptSelect(card.prompt)}
            className="card flex flex-col gap-2.5 text-left hover:border-purple/40 hover:bg-surface/80 transition-all cursor-pointer group active:scale-[0.99]"
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
