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

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  );
}
