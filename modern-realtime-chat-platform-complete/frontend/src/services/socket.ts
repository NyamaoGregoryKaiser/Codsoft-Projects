import { io, Socket } from 'socket.io-client';

const CHAT_NAMESPACE = '/chat';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Base URL of your NestJS backend

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  /**
   * Establishes a WebSocket connection.
   * @param token The JWT token for authentication.
   */
  public connect(token: string): void {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected.');
      return;
    }

    this.token = token;

    this.socket = io(`${SOCKET_URL}${CHAT_NAMESPACE}`, {
      transports: ['websocket'], // Prefer WebSocket transport
      auth: {
        token: this.token, // Pass token in auth payload for WsJwtAuthGuard
      },
      query: {
        token: this.token, // Also pass token as query param for robustness
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      extraHeaders: {
        Authorization: `Bearer ${this.token}`, // Also pass token in extraHeaders
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      // Handle specific connection errors, e.g., invalid token
      if (err.message === 'Unauthorized: Invalid token' || err.message === 'Unauthorized: No access token') {
        console.error('Authentication failed during socket connection. Clearing token.');
        // This might trigger a global logout in a larger app
        // localStorage.removeItem('accessToken');
        // Cookies.remove('accessToken');
      }
    });
  }

  /**
   * Disconnects the WebSocket connection.
   */
  public disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
      console.log('Socket disconnected.');
    }
  }

  /**
   * Returns the current Socket.IO instance.
   * @throws Error if the socket is not connected.
   */
  public getSocket(): Socket {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket not connected. Call connect() first.');
    }
    return this.socket;
  }

  /**
   * Helper to emit events.
   * @param event The event name.
   * @param data The data to send with the event.
   * @param callback Optional callback for acknowledgements.
   */
  public emit(event: string, data: any, callback?: (response: any) => void): void {
    if (this.socket && this.socket.connected) {
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    } else {
      console.warn(`Attempted to emit '${event}' but socket is not connected.`);
    }
  }

  /**
   * Helper to listen to events.
   * @param event The event name.
   * @param handler The event handler function.
   */
  public on(event: string, handler: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    } else {
      console.warn(`Attempted to listen to '${event}' but socket is not initialized.`);
    }
  }

  /**
   * Helper to remove event listeners.
   * @param event The event name.
   * @param handler The event handler function to remove.
   */
  public off(event: string, handler?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

export const socketService = new SocketService();