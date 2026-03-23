import { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import AuthService from '../auth/AuthService'; // To get JWT token

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:8080/websocket'; // Must match backend endpoint

const useWebSocket = () => {
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('jwtToken');
      if (!token || !AuthService.checkTokenValidity()) {
        console.log("No valid JWT token found for WebSocket. Skipping connection.");
        setIsConnected(false);
        setStompClient(null);
        setError("Authentication required for WebSocket.");
        return;
      }

      console.log("Attempting to connect to WebSocket...");
      const socket = new SockJS(WEBSOCKET_URL);
      const client = Stomp.over(socket);

      // Disable debug logs for production
      client.debug = (str) => {
        // console.log(str); // Uncomment for full STOMP debug logs
      };

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      client.connect(headers,
        () => {
          setIsConnected(true);
          setStompClient(client);
          console.log('WebSocket Connected!');
          setError(null);
        },
        (err) => {
          setIsConnected(false);
          setStompClient(null);
          setError("WebSocket connection failed.");
          console.error('WebSocket connection error:', err);
          // Attempt to reconnect after a delay
          setTimeout(connect, 5000);
        }
      );

      return () => {
        if (client && client.connected) {
          console.log('Disconnecting WebSocket...');
          client.disconnect(() => {
            console.log('WebSocket Disconnected!');
            setIsConnected(false);
          });
        }
      };
    };

    connect(); // Initial connection attempt

    // Reconnect on token refresh or other auth changes (optional, depends on auth strategy)
    // For simplicity, this hook manages its own connection lifecycle.
    // A token expiration check could trigger a reconnect, but that's handled by AuthContext redirecting to login.

  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return { stompClient, isConnected, error };
};

export default useWebSocket;