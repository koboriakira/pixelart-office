import { useEffect, useRef, useState, useCallback } from "react";
import type { WsMessage } from "../types";

type ConnectionStatus = "connected" | "disconnected";

const WS_URL = "ws://localhost:5173/ws";
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export function useWebSocket(
  onMessage: (msg: WsMessage) => void,
): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wsRef = useRef<WebSocket>();
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      setStatus("connected");
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const parsed: WsMessage = JSON.parse(ev.data as string);
        onMessageRef.current(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      if (unmountedRef.current) return;

      const delay = Math.min(
        BASE_DELAY_MS * 2 ** retryCountRef.current,
        MAX_DELAY_MS,
      );
      retryCountRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
