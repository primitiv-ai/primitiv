"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function LiveReloadClient() {
  const router = useRouter();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/__primitiv_live`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.addEventListener("open", () => {
        attemptRef.current = 0;
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "refresh") {
            router.refresh();
          }
        } catch {
          // ignore malformed messages
        }
      });

      const scheduleReconnect = () => {
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** attemptRef.current, 10_000);
        attemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.addEventListener("close", scheduleReconnect);
      ws.addEventListener("error", () => {
        ws.close();
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [router]);

  return null;
}
