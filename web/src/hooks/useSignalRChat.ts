"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalRChat(currentUserId?: string | null, token?: string) {
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const hubUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CHAT_HUB_URL || "http://localhost:5162/chat";
    const uid = currentUserId && currentUserId !== "" ? `userId=${encodeURIComponent(currentUserId)}` : "";
    return uid ? `${base}${base.includes("?") ? "&" : "?"}${uid}` : base;
  }, [currentUserId]);

  // Heartbeat mechanism to keep connection alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(async () => {
      const connection = connectionRef.current;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Send a simple method to keep the connection alive
          // Use a method that exists on the server or just check connection state
          await connection.invoke("GetConnectionId");
        } catch (error) {
          console.warn('Heartbeat check failed:', error);
          // If heartbeat fails, the connection might be dead, trigger reconnection
          setConnected(false);
          setConnectionState('Reconnecting');
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Enhanced reconnection logic with exponential backoff
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      setConnectionState('Failed');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current++;
    
    setConnectionState('Reconnecting');
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        const connection = connectionRef.current;
        if (connection) {
          await connection.start();
          setConnected(true);
          setConnectionState('Connected');
          reconnectAttemptsRef.current = 0;
          startHeartbeat();
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
        attemptReconnect();
      }
    }, delay);
  }, [startHeartbeat]);

  const createConnection = useCallback(() => {
    if (!hubUrl) return null;
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || localStorage.getItem("token") || "",
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Custom retry logic with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          console.log(`Auto-reconnect attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`);
          return delay;
        }
      })
      .configureLogging(signalR.LogLevel.Warning) // Reduce log noise
      .build();

    // Enhanced connection event handlers
    connection.onclose((error) => {
      console.log('Connection closed:', error);
      setConnected(false);
      setConnectionState('Disconnected');
      stopHeartbeat();
      
      if (error) {
        console.error('Connection closed with error:', error);
        // Only attempt manual reconnect if auto-reconnect fails
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          attemptReconnect();
        }
      }
    });

    connection.onreconnecting((error) => {
      console.log('Connection reconnecting:', error);
      setConnectionState('Reconnecting');
      stopHeartbeat();
    });

    connection.onreconnected((connectionId) => {
      console.log('Connection reconnected:', connectionId);
      setConnected(true);
      setConnectionState('Connected');
      reconnectAttemptsRef.current = 0;
      startHeartbeat();
    });

    return connection;
  }, [hubUrl, token, startHeartbeat, stopHeartbeat, attemptReconnect]);

  useEffect(() => {
    if (!hubUrl) return;
    
    const connection = createConnection();
    if (!connection) return;
    
    connectionRef.current = connection;

    let cancelled = false;
    (async () => {
      try {
        await connection.start();
        if (cancelled) {
          // If the effect was cleaned up while starting, stop the connection safely
          await connection.stop().catch(() => {});
          return;
        }
        setConnected(true);
        setConnectionState('Connected');
        startHeartbeat();
      } catch (error) {
        console.error('Failed to start connection:', error);
        if (!cancelled) {
          setConnected(false);
          setConnectionState('Failed');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopHeartbeat();
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Avoid stopping while the connection is still starting to prevent race error
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
      connectionRef.current = null;
    };
  }, [hubUrl, token, createConnection, startHeartbeat, stopHeartbeat]);

  const getConnectionId = useCallback(async () => {
    return connectionRef.current?.invoke<string>("GetConnectionId");
  }, []);

  const addUser = useCallback(async (userId: string, connectionId: string) => {
    return connectionRef.current?.invoke("AddUser", userId, connectionId);
  }, []);

  const sendToAll = useCallback(async (userId: string, message: string) => {
    return connectionRef.current?.invoke("SendMessageToAll", userId, message);
  }, []);

  const sendToUser = useCallback(async (userId: string, message: string) => {
    return connectionRef.current?.invoke("SendMessageToUser", userId, message);
  }, []);

  const sendToUserWithMeta = useCallback(async (userId: string, message: string, replyToMessageId?: string | null, clientMessageId?: string | null) => {
    return connectionRef.current?.invoke("SendMessageToUserWithMeta", userId, message, replyToMessageId ?? null, clientMessageId ?? null);
  }, []);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    return connectionRef.current?.invoke<boolean>("EditMessage", messageId, newText);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    return connectionRef.current?.invoke<boolean>("DeleteMessage", messageId);
  }, []);

  const onReceiveMessage = useCallback((handler: (payload: any, username?: string) => void) => {
    connectionRef.current?.on("ReceiveMessage", handler);
    return () => connectionRef.current?.off("ReceiveMessage", handler);
  }, []);

  const onReceiveActiveUsers = useCallback((handler: (ids: string[]) => void) => {
    connectionRef.current?.on("ReceiveActiveUsers", handler);
    return () => connectionRef.current?.off("ReceiveActiveUsers", handler);
  }, []);

  const onTyping = useCallback((handler: (data: { userId: string; isTyping: boolean }) => void) => {
    connectionRef.current?.on("Typing", handler as any);
    return () => connectionRef.current?.off("Typing", handler as any);
  }, []);

  const onMessageReactionUpdated = useCallback((handler: (data: { id: string; userId: string; emoji: string; removed?: boolean }) => void) => {
    connectionRef.current?.on("MessageReactionUpdated", handler as any);
    return () => connectionRef.current?.off("MessageReactionUpdated", handler as any);
  }, []);

  const onMessagesRead = useCallback((handler: (data: { byUserId: string; messageIds: string[] }) => void) => {
    connectionRef.current?.on("MessagesRead", handler as any);
    return () => connectionRef.current?.off("MessagesRead", handler as any);
  }, []);

  const startTyping = useCallback(async (targetUserId: string) => {
    return connectionRef.current?.invoke("StartTyping", targetUserId);
  }, []);

  const stopTyping = useCallback(async (targetUserId: string) => {
    return connectionRef.current?.invoke("StopTyping", targetUserId);
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    return connectionRef.current?.invoke<boolean>("ReactToMessage", messageId, emoji);
  }, []);

  const unreactToMessage = useCallback(async (messageId: string, emoji: string) => {
    return connectionRef.current?.invoke<boolean>("UnreactToMessage", messageId, emoji);
  }, []);

  const markMessagesRead = useCallback(async (peerUserId: string, messageIds: string[]) => {
    return connectionRef.current?.invoke<number>("MarkMessagesRead", peerUserId, messageIds);
  }, []);

  return {
    connected,
    connectionState,
    getConnectionId,
    addUser,
    sendToAll,
    sendToUser,
    sendToUserWithMeta,
    editMessage,
    deleteMessage,
    onTyping,
    onMessageReactionUpdated,
    onMessagesRead,
    startTyping,
    stopTyping,
    reactToMessage,
    unreactToMessage,
    markMessagesRead,
    onReceiveMessage,
    onReceiveActiveUsers,
  };
}


