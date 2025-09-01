import React, { useEffect, useRef, useState } from "react";

type ChatMessage = { 
  type: "CHAT_MESSAGE"; 
  payload: {
    gameId: string; 
    text: string; 
    ts: number; 
    fromUserId: string;
  }
};

export function ChatPanel({ wsUrl, gameId, currentUserId }: {
  wsUrl: string; 
  gameId: string; 
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // attach userId in query for the simple demo; replace with JWT cookie in prod
    const url = new URL(wsUrl);
    url.searchParams.set("userId", currentUserId);
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      // Fixed: Use JOIN_ROOM with payload structure
      ws.send(JSON.stringify({ 
        type: "JOIN_ROOM", 
        payload: { gameId } 
      }));
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // Fixed: Check for CHAT_MESSAGE and access payload
        if (data.type === "CHAT_MESSAGE" && data.payload?.gameId === gameId) {
          setMessages((prev) => [...prev, data]);
        }
      } catch {}
    };

    ws.onclose = () => { /* optionally show disconnected */ };

    return () => {
      ws.close();
    };
  }, [wsUrl, gameId, currentUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Fixed: Use CHAT_SEND with payload structure
    wsRef.current.send(JSON.stringify({ 
      type: "CHAT_SEND", 
      payload: { gameId, text } 
    }));
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
              {/* Fixed: Access payload.fromUserId */}
              {m.payload.fromUserId === currentUserId ? "Me" : "Opponent"}
            </div>
            <div>{m.payload.text}</div>
            <div style={{ fontSize: "0.7em", color: "#666" }}>
              {new Date(m.payload.ts).toLocaleTimeString()}
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
