"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalRChat(currentUserId?: string | null, token?: string) {
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const hubUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CHAT_HUB_URL || "http://localhost:5210/chat";
    const uid = currentUserId && currentUserId !== "" ? `userId=${encodeURIComponent(currentUserId)}` : "";
    return uid ? `${base}${base.includes("?") ? "&" : "?"}${uid}` : base;
  }, [currentUserId]);

  useEffect(() => {
    if (!hubUrl) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || localStorage.getItem("token") || "",
        withCredentials: true,
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

  const onReceiveMessage = useCallback((handler: (payload: any, username?: string) => void) => {
    connectionRef.current?.on("ReceiveMessage", handler);
    return () => connectionRef.current?.off("ReceiveMessage", handler);
  }, []);

  const onReceiveActiveUsers = useCallback((handler: (ids: string[]) => void) => {
    connectionRef.current?.on("ReceiveActiveUsers", handler);
    return () => connectionRef.current?.off("ReceiveActiveUsers", handler);
  }, []);

  return {
    connected,
    getConnectionId,
    addUser,
    sendToAll,
    sendToUser,
    onReceiveMessage,
    onReceiveActiveUsers,
  };
}


