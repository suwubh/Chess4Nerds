import React, { useEffect, useRef, useState } from "react";

type ChatMessage = { 
  fromUserId: string; 
  text: string; 
  ts: number; 
  gameId?: string;
};

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  gameId: string;
}

export function ChatPanel({ messages, currentUserId, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") send();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "400px", border: "1px solid #ccc" }}>
      <div style={{ padding: 10, borderBottom: "1px solid #ccc", fontWeight: "bold" }}>
        Chat
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: "bold", fontSize: "0.8em" }}>
              {m.fromUserId === currentUserId ? "Me" : "Opponent"}
            </div>
            <div>{m.text}</div>
            <div style={{ fontSize: "0.7em", color: "#666" }}>
              {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", padding: 10, gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button onClick={send} style={{ padding: 8, borderRadius: 6 }}>
          Send
        </button>
      </div>
    </div>
  );
}