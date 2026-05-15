import { useState, useEffect, useRef, useCallback } from "react";

interface UseSseReturn<T> {
  data: T | null;
  events: T[];
  error: Error | null;
  isConnected: boolean;
}

export function useSse<T = unknown>(url: string | null): UseSseReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [events, setEvents] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventsRef = useRef<T[]>([]);

  const addEvent = useCallback((event: T) => {
    eventsRef.current = [...eventsRef.current, event];
    setEvents([...eventsRef.current]);
    setData(event);
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }

    // Reset state when URL changes
    eventsRef.current = [];
    setEvents([]);
    setData(null);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        addEvent(parsed);
      } catch {
        setError(new Error("Failed to parse SSE message"));
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // Don't set error on normal close, only on actual errors
      if (eventSource.readyState === EventSource.CLOSED) {
        // Connection closed normally, don't reconnect
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url, addEvent]);

  return { data, events, error, isConnected };
}
