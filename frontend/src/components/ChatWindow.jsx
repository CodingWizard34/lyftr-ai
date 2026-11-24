import MessageBubble, { ResponseMetadata } from "./MessageBubble";

export default function ChatWindow({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-12">
      {messages.length === 0 ? null : (
        <div className="flex flex-col gap-6">
          {messages.map((m, i) => (
            <div key={i} className="animate-fade-in">
              {m.role === "user" ? (
                <MessageBubble role="user" content={m.content} />
              ) : (
                <>
                  <MessageBubble role="assistant" content={m.content} />
                  <ResponseMetadata metadata={m.metadata} />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}
