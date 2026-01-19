import { SocketMessage } from "@/types/game";
import TcpSocket from "react-native-tcp-socket";

const MESSAGE_DELIMITER = "\n";

type MessageHandler = (message: SocketMessage) => void;
type ConnectionHandler = () => void;

class SocketClient {
  private socket: TcpSocket.Socket | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectHandler: ConnectionHandler | null = null;
  private disconnectHandler: ConnectionHandler | null = null;
  private errorHandler: ((error: Error) => void) | null = null;
  private buffer = "";

  connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = TcpSocket.createConnection({ host, port }, () => {
          console.log(`Connected to ${host}:${port}`);
          if (this.connectHandler) {
            this.connectHandler();
          }
          resolve();
        });

        this.socket.on("data", (data) => {
          this.buffer += data.toString();
          const messages = this.buffer.split(MESSAGE_DELIMITER);
          this.buffer = messages.pop() || "";

          for (const msg of messages) {
            if (msg.trim()) {
              try {
                const parsed = JSON.parse(msg) as SocketMessage;
                if (this.messageHandler) {
                  this.messageHandler(parsed);
                }
              } catch (e) {
                console.error("Failed to parse message:", e);
              }
            }
          }
        });

        this.socket.on("close", () => {
          console.log("Connection closed");
          if (this.disconnectHandler) {
            this.disconnectHandler();
          }
        });

        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
          if (this.errorHandler) {
            this.errorHandler(error);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  send(message: SocketMessage): void {
    if (this.socket) {
      const data = JSON.stringify(message) + MESSAGE_DELIMITER;
      this.socket.write(data);
    }
  }

  isConnected(): boolean {
    return this.socket !== null;
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
