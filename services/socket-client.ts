import { SocketMessage } from "@/types/game";

type MessageHandler = (message: SocketMessage) => void;
type ConnectionHandler = () => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectHandler: ConnectionHandler | null = null;
  private disconnectHandler: ConnectionHandler | null = null;
  private errorHandler: ((error: Error) => void) | null = null;

  connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use WebSocket protocol
        const url = `ws://${host}:${port}`;
        console.log(`[WebSocket] Connecting to ${url}`);

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log(`[WebSocket] Connected to ${host}:${port}`);
          if (this.connectHandler) {
            this.connectHandler();
          }
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SocketMessage;
            if (this.messageHandler) {
              this.messageHandler(message);
            }
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", e);
          }
        };

        this.socket.onclose = (event) => {
          console.log(
            `[WebSocket] Connection closed: ${event.code} ${event.reason}`,
          );
          if (this.disconnectHandler) {
            this.disconnectHandler();
          }
        };

        this.socket.onerror = (event) => {
          console.error("[WebSocket] Error:", event);
          const error = new Error("WebSocket connection failed");
          if (this.errorHandler) {
            this.errorHandler(error);
          }
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      // Close with normal closure code
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, "Client disconnecting");
      }
      this.socket = null;
    }
  }

  send(message: SocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  onConnect(handler: ConnectionHandler): void {
    this.connectHandler = handler;
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandler = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }
}

export const socketClient = new SocketClient();
