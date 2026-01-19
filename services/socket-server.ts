import { Player, SocketMessage } from "@/types/game";
import { NetworkInfo } from "react-native-network-info";
import TcpSocket from "react-native-tcp-socket";

const PORT = 3000;
const MESSAGE_DELIMITER = "\n";

type MessageHandler = (clientId: string, message: SocketMessage) => void;
type ConnectionHandler = (clientId: string) => void;

interface ClientSocket {
  id: string;
  socket: TcpSocket.Socket;
  player?: Player;
}

class SocketServer {
  private server: TcpSocket.Server | null = null;
  private clients: Map<string, ClientSocket> = new Map();
  private messageHandler: MessageHandler | null = null;
  private connectHandler: ConnectionHandler | null = null;
  private disconnectHandler: ConnectionHandler | null = null;
  private clientCounter = 0;

  async getLocalIP(): Promise<string> {
    try {
      const ip = await NetworkInfo.getIPV4Address();
      return ip || "0.0.0.0";
    } catch {
      return "0.0.0.0";
    }
  }

  getPort(): number {
    return PORT;
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  start(): Promise<void> {
    // If server is already running, just resolve
    if (this.server) {
      console.log("Server already running on port", PORT);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const server = TcpSocket.createServer((socket) => {
          const clientId = `client_${++this.clientCounter}`;

          this.clients.set(clientId, { id: clientId, socket });
          console.log(`Client connected: ${clientId}`);

          if (this.connectHandler) {
            this.connectHandler(clientId);
          }

          let buffer = "";

          socket.on("data", (data) => {
            buffer += data.toString();
            const messages = buffer.split(MESSAGE_DELIMITER);
            buffer = messages.pop() || "";

            for (const msg of messages) {
              if (msg.trim()) {
                try {
                  const parsed = JSON.parse(msg) as SocketMessage;
                  if (this.messageHandler) {
                    this.messageHandler(clientId, parsed);
                  }
                } catch (e) {
                  console.error("Failed to parse message:", e);
                }
              }
            }
          });

          socket.on("close", () => {
            console.log(`Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
            if (this.disconnectHandler) {
              this.disconnectHandler(clientId);
            }
          });

          socket.on("error", (error) => {
            console.error(`Client error (${clientId}):`, error);
            this.clients.delete(clientId);
            if (this.disconnectHandler) {
              this.disconnectHandler(clientId);
            }
          });
        });

        if (!server) {
          reject(
            new Error(
              "Failed to create TCP server. Make sure you are using a development build, not Expo Go.",
            ),
          );
          return;
        }

        this.server = server;

        this.server.listen({ port: PORT, host: "0.0.0.0" }, () => {
          console.log(`Server started on port ${PORT}`);
          resolve();
        });

        this.server.on("error", (error) => {
          console.error("Server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): void {
    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.destroy();
    }
    this.clients.clear();

    // Close server
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  sendToClient(clientId: string, message: SocketMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      const data = JSON.stringify(message) + MESSAGE_DELIMITER;
      client.socket.write(data);
    }
  }

  broadcast(message: SocketMessage): void {
    const data = JSON.stringify(message) + MESSAGE_DELIMITER;
    for (const client of this.clients.values()) {
      client.socket.write(data);
    }
  }

  setPlayer(clientId: string, player: Player): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.player = player;
    }
  }

  getPlayer(clientId: string): Player | undefined {
    return this.clients.get(clientId)?.player;
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getPlayers(): Player[] {
    return Array.from(this.clients.values())
      .filter((c) => c.player)
      .map((c) => c.player!);
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
}

export const socketServer = new SocketServer();
