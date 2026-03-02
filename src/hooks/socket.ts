// src/hooks/socket.ts → теперь это не модуль-сокет, а функция-фабрика

import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function createSocket(accessToken: string | null): Socket | null {
  if (!accessToken) {
    console.warn("Нет accessToken → сокет не создан");
    return null;
  }

  const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    extraHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return socket;
}
