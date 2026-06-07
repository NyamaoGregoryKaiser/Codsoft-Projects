```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../utils/localStorage';
import { Message, WsMessagePayload } from '../types';

/**
 * A custom React hook for managing WebSocket connections.
 * It handles connection, disconnection, sending messages, and receiving messages.
 *
 * @param url The WebSocket URL to connect to.
 * @param onMessageCallback A callback function to handle incoming messages.
 * @returns An object containing `sendMessage` function, `isConnected` status, and `wsError` status.
 */
const useWebSocket = (url: string, onMessageCallback: (message: Message) => void) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL_MS = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setWsError(null);
    const token = getAccessToken();
    if (!token) {
      setWsError('Authentication token not found. Please log in.');
      return;
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected.');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      // Send auth token immediately after connection is open
      ws.current?.send(JSON.stringify({ auth_token: token }));
    };

    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const message: Message = JSON.parse(event.data);
        onMessageCallback(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e, event.data);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      if (event.code === 1008 || event.code === 1000) { // 1008: Policy Violation (auth/authz failure), 1000: Normal Closure
        setWsError(event.reason || 'WebSocket closed due to policy violation or normal closure.');
      } else {
        // Attempt to reconnect only if it's not a normal or policy-related closure
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(connect, RECONNECT_INTERVAL_MS);
        } else {
          setWsError('WebSocket disconnected. Max reconnect attempts reached.');
          console.error('WebSocket disconnected. Max reconnect attempts reached.');
        }
      }
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setWsError('WebSocket connection error.');
      ws.current?.close(); // Force close to trigger onclose for reconnect logic
    };
  }, [url, onMessageCallback]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Component unmounted'); // 1000 is normal closure
      ws.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendMessage = useCallback((payload: WsMessagePayload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', payload);
      setWsError('WebSocket not connected. Please try again.');
    }
  }, []);

  return { sendMessage, isConnected, wsError };
};

export default useWebSocket;
```