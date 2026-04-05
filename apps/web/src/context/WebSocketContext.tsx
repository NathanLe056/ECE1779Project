import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

interface WebSocketContextValue {
  /** The most-recently received message, or null if none yet. */
  lastMessage: WebSocketMessage | null;
  /** Current connection state — useful for showing a "live" indicator. */
  connected: boolean;
}

const configuredApiBase =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/";
const isFlyHost = window.location.hostname.endsWith(".fly.dev");

const WS_URL: string = import.meta.env.DEV
  ? configuredApiBase.replace(/\/api\/?$/, "").replace(/^http/, "ws") + "/ws"
  : isFlyHost
    ? configuredApiBase.replace(/\/api\/?$/, "").replace(/^http/, "ws") + "/ws"
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

const RECONNECT_DELAY_MS = 3_000;
const PING_INTERVAL_MS = 15_000;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WebSocketContext = createContext<WebSocketContextValue>({
  lastMessage: null,
  connected: false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);

  const clearPingTimer = () => {
    if (pingTimerRef.current !== null) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const connect = useCallback(() => {
    // Don't try to connect if the component is being torn down.
    if (unmountedRef.current) return;

    // Don't open a second socket if one is already open/connecting.
    if (
      wsRef.current &&
      wsRef.current.readyState !== WebSocket.CLOSED &&
      wsRef.current.readyState !== WebSocket.CLOSING
    ) {
      return;
    }

    console.log(`[WS] Connecting to ${WS_URL}…`);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close();
        return;
      }
      console.log("[WS] Connected");
      setConnected(true);
      clearReconnectTimer();

      // Start a keep-alive ping so proxies/load-balancers don't close
      // idle connections. The server ignores these text frames.
      clearPingTimer();
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data as string);
        // Ignore server-sent pong / ping frames
        if (msg.type === "PONG" || msg.type === "PING") return;
        setLastMessage(msg);
      } catch {
        console.error("[WS] Failed to parse message:", event.data);
      }
    };

    ws.onclose = () => {
      clearPingTimer();
      setConnected(false);
      if (unmountedRef.current) return;
      console.log(
        `[WS] Disconnected. Reconnecting in ${RECONNECT_DELAY_MS}ms…`,
      );
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = (err) => {
      // onclose fires after onerror, so reconnect logic lives there.
      console.error("[WS] Error:", err);
    };
  }, []); // stable — no deps change after mount

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearReconnectTimer();
      clearPingTimer();
      if (wsRef.current) {
        // Prevent the onclose handler from scheduling another reconnect.
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Consume the nearest WebSocketProvider's latest message and status. */
export function useWebSocketContext(): WebSocketContextValue {
  return useContext(WebSocketContext);
}
