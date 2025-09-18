"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WsMessage = {
  type: string;
  payload?: any;
};

export type ChatEventHandlers = {
  onPresenceChanged?: (p: { userId: string; isOnline: boolean }) => void;
  onTyping?: (p: { userId: string; conversationId: string; isTyping: boolean }) => void;
  onMessageReceived?: (msg: any) => void;
  onDelivered?: (p: any) => void;
  onRead?: (p: any) => void;
  onHistory?: (items: any[]) => void;
  onEdited?: (p: any) => void;
  onDeleted?: (p: any) => void;
};

export function useChatWs(currentUserId: string | null | undefined, handlers: ChatEventHandlers = {}) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:5000";
    return base.replace("http", "ws") + "/ws/chat";
  }, []);

  const safeSend = useCallback((msg: WsMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(msg));
    return true;
  }, []);

  const connect = useCallback(() => {
    if (!currentUserId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      safeSend({ type: "register", payload: { userId: currentUserId } });
    };
    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // attempt simple reconnect
      setTimeout(() => connect(), 1500);
    };
    ws.onerror = () => {
      // let onclose handle retry
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "presenceChanged":
            handlers.onPresenceChanged?.(msg.payload);
            break;
          case "typing":
            handlers.onTyping?.(msg.payload);
            break;
          case "messageReceived":
            handlers.onMessageReceived?.(msg.payload);
            break;
          case "deliveredReceipts":
            handlers.onDelivered?.(msg.payload);
            break;
          case "readReceipts":
            handlers.onRead?.(msg.payload);
            break;
          case "historyResult":
            handlers.onHistory?.(msg.payload?.items ?? []);
            break;
          case "messageEdited":
            handlers.onEdited?.(msg.payload);
            break;
          case "messageDeleted":
            handlers.onDeleted?.(msg.payload);
            break;
        }
      } catch {}
    };
  }, [currentUserId, handlers, safeSend, wsUrl]);

  useEffect(() => {
    if (!currentUserId) return;
    connect();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [currentUserId, connect]);

  const joinDirect = useCallback((otherUserId: string) => {
    return safeSend({ type: "joinDirect", payload: { currentUserId, otherUserId } });
  }, [currentUserId, safeSend]);

  const sendDirect = useCallback((toUserId: string, text: string, clientMessageId?: string) => {
    return safeSend({ type: "sendDirect", payload: { fromUserId: currentUserId, toUserId, text, clientMessageId } });
  }, [currentUserId, safeSend]);

  const typing = useCallback((otherUserId: string, isTyping: boolean) => {
    return safeSend({ type: "typing", payload: { userId: currentUserId, otherUserId, isTyping } });
  }, [currentUserId, safeSend]);

  const delivered = useCallback((otherUserId: string, messageIds: string[]) => {
    return safeSend({ type: "delivered", payload: { userId: currentUserId, otherUserId, messageIds } });
  }, [currentUserId, safeSend]);

  const read = useCallback((otherUserId: string, messageIds: string[]) => {
    return safeSend({ type: "read", payload: { userId: currentUserId, otherUserId, messageIds } });
  }, [currentUserId, safeSend]);

  const history = useCallback((userA: string, userB: string, page = 0, pageSize = 20) => {
    return safeSend({ type: "history", payload: { userA, userB, page, pageSize } });
  }, [safeSend]);

  return {
    connected,
    joinDirect,
    sendDirect,
    typing,
    delivered,
    read,
    history,
  };
}


