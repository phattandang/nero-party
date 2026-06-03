import { io } from "socket.io-client";

// Connect to the same origin — works in both dev (Vite proxy) and prod (served from Express).
export const socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  path: "/socket.io",
});
