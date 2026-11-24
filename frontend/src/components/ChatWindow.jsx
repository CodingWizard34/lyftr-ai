import MessageBubble, { ResponseMetadata } from "./MessageBubble";
import { Loader2 } from "lucide-react";

export default function ChatWindow({ messages, isLoading }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      {messages.length === 0 ? null : (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {messages.map((m, i) => (
            <div key={i} className="animate-fade-in flex flex-col">
              <MessageBubble role={m.role} content={m.content} metadata={m.metadata} />
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-surface/50 border border-border/60 rounded-2xl max-w-xs animate-pulse">
              <Loader2 className="w-4 h-4 text-purple animate-spin" />
              <span className="text-xs text-text-secondary">Lyftr AI is generating response...</span>
            </div>
          )}
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}
