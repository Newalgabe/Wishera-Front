"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalRChat(currentUserId?: string | null, token?: string) {
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const hubUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CHAT_HUB_URL || "http://localhost:5162/chat";
    const uid = currentUserId && currentUserId !== "" ? `userId=${encodeURIComponent(currentUserId)}` : "";
    return uid ? `${base}${base.includes("?") ? "&" : "?"}${uid}` : base;
  }, [currentUserId]);

  useEffect(() => {
    if (!hubUrl) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || localStorage.getItem("token") || "",
        // Let SignalR negotiate the best available transport (WebSockets/ServerSentEvents/LongPolling)
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.onclose(() => setConnected(false));
    connection.onreconnected(() => setConnected(true));

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
      } catch {
        if (!cancelled) {
          setConnected(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      // Avoid stopping while the connection is still starting to prevent race error
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
      connectionRef.current = null;
    };
  }, [hubUrl, token]);

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


