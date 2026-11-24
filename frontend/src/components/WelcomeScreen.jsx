import { MessageCircle, Zap, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "Smart Conversations",
    description: "Continue conversations with contextual AI memory.",
    icon: MessageCircle,
  },
  {
    title: "Intelligent Caching",
    description: "Faster responses through intelligent response caching.",
    icon: Zap,
  },
  {
    title: "Reliable AI",
    description: "Automatic provider fallback for uninterrupted conversations.",
    icon: ShieldCheck,
  },
];

export default function WelcomeScreen({ onPromptSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="relative w-24 h-24 mb-8 animate-orb-float">
        <div
          className="absolute inset-0 rounded-full bg-purple/20 blur-3xl animate-pulse-glow"
        />
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-violet-500 shadow-[0_0_40px_rgba(168,85,247,0.6)]"
        />
      </div>

      <h1 className="text-2xl md:text-3xl font-light text-text-primary mb-3 leading-tight">
        Ready to Create Something New?
      </h1>
      <p className="text-text-secondary text-sm mb-10 max-w-md">
        Your intelligent workspace for conversations, ideas and problem solving.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPromptSelect(p)}
            className="chip"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        {cards.map((card) => (
          <div
            key={card.title}
            className="card flex flex-col gap-3 hover:border-purple/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <card.icon className="w-5 h-5 text-text-secondary" />
              <span className="text-text-secondary text-xs uppercase tracking-wider">{card.title}</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="card flex flex-col gap-3 hover:border-purple/30 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-text-secondary" />
        <span className="text-text-secondary text-xs uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
