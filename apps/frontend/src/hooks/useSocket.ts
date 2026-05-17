import { useEffect, useState } from 'react';
import { useUser } from '@repo/store/src/hooks/useUser';

const WS_URL = import.meta.env.VITE_APP_WS_URL ?? 'ws://localhost:8080';

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const user = useUser();

  useEffect(() => {
    if (!user?.token) return;

    const ws = new WebSocket(`${WS_URL}?token=${user.token}`);
    ws.onopen = () => setSocket(ws);
    ws.onclose = () => setSocket(null);
    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => {
      ws.close();
    };
  }, [user?.token]);

  return socket;
};
