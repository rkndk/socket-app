import { Player, SocketMessage } from "@/types/game";
import { Buffer } from "buffer";
import { NetworkInfo } from "react-native-network-info";
import TcpSocket from "react-native-tcp-socket";
import {
  createCloseFrame,
  createPongFrame,
  createUpgradeResponse,
  decodeFrame,
  encodeFrame,
  generateAcceptKey,
  isWebSocketUpgradeRequest,
  OPCODE,
  parseUpgradeRequest,
} from "./websocket-protocol";

const PORT = 3000;

type MessageHandler = (clientId: string, message: SocketMessage) => void;
type ConnectionHandler = (clientId: string) => void;

interface ClientSocket {
  id: string;
  socket: TcpSocket.Socket;
  player?: Player;
  handshakeComplete: boolean;
  buffer: Buffer;
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

          const client: ClientSocket = {
            id: clientId,
            socket,
            handshakeComplete: false,
            buffer: Buffer.alloc(0),
          };
          this.clients.set(clientId, client);
          console.log(`[WebSocket] Client connected: ${clientId}`);

          socket.on("data", (data) => {
            this.handleData(clientId, data);
          });

          socket.on("close", () => {
            console.log(`[WebSocket] Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
            if (this.disconnectHandler) {
              this.disconnectHandler(clientId);
            }
          });

          socket.on("error", (error) => {
            console.error(`[WebSocket] Client error (${clientId}):`, error);
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
          console.log(`[WebSocket] Server started on port ${PORT}`);
          resolve();
        });

        this.server.on("error", (error) => {
          console.error("[WebSocket] Server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleData(clientId: string, data: Buffer | string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Convert string to Buffer if needed
    const dataBuffer = typeof data === "string" ? Buffer.from(data) : data;

    if (!client.handshakeComplete) {
      // Handle WebSocket upgrade handshake
      if (isWebSocketUpgradeRequest(dataBuffer)) {
        const upgrade = parseUpgradeRequest(dataBuffer);
        if (upgrade) {
          const acceptKey = generateAcceptKey(upgrade.key);
          const response = createUpgradeResponse(acceptKey);
          client.socket.write(response);
          client.handshakeComplete = true;
          console.log(`[WebSocket] Handshake complete for ${clientId}`);

          // Notify connect handler after handshake
          if (this.connectHandler) {
            this.connectHandler(clientId);
          }
        } else {
          console.error(`[WebSocket] Invalid upgrade request from ${clientId}`);
          client.socket.destroy();
          this.clients.delete(clientId);
        }
      } else {
        console.error(`[WebSocket] Non-WebSocket connection from ${clientId}`);
        client.socket.destroy();
        this.clients.delete(clientId);
      }
      return;
    }

    // Append new data to buffer
    client.buffer = Buffer.concat([client.buffer, dataBuffer]);

    // Process all complete frames in buffer
    while (client.buffer.length > 0) {
      const frame = decodeFrame(client.buffer);
      if (!frame) break; // Incomplete frame, wait for more data

      // Remove processed bytes from buffer
      client.buffer = client.buffer.subarray(frame.frameLength);

      this.handleFrame(clientId, frame);
    }
  }

  private handleFrame(
    clientId: string,
    frame: { opcode: number; payload: Buffer },
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (frame.opcode) {
      case OPCODE.TEXT:
        // Parse JSON message
        try {
          const text = frame.payload.toString("utf8");
          const message = JSON.parse(text) as SocketMessage;
          if (this.messageHandler) {
            this.messageHandler(clientId, message);
          }
        } catch (e) {
          console.error(
            `[WebSocket] Failed to parse message from ${clientId}:`,
            e,
          );
        }
        break;

      case OPCODE.BINARY:
        // We don't use binary, but log it
        console.log(`[WebSocket] Received binary frame from ${clientId}`);
        break;

      case OPCODE.CLOSE:
        // Client requested close
        console.log(`[WebSocket] Close frame from ${clientId}`);
        client.socket.write(createCloseFrame(1000));
        client.socket.destroy();
        this.clients.delete(clientId);
        if (this.disconnectHandler) {
          this.disconnectHandler(clientId);
        }
        break;

      case OPCODE.PING:
        // Respond with pong
        client.socket.write(createPongFrame(frame.payload));
        break;

      case OPCODE.PONG:
        // Client responded to our ping (if we sent one)
        break;
    }
  }

  stop(): void {
    // Send close frame to all clients
    for (const client of this.clients.values()) {
      try {
        if (client.handshakeComplete) {
          client.socket.write(createCloseFrame(1001, "Server shutting down"));
        }
        client.socket.destroy();
      } catch {
        // Ignore errors during cleanup
      }
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
    if (client && client.handshakeComplete) {
      const data = JSON.stringify(message);
      const frame = encodeFrame(data, OPCODE.TEXT);
      client.socket.write(frame);
    }
  }

  broadcast(message: SocketMessage): void {
    const data = JSON.stringify(message);
    const frame = encodeFrame(data, OPCODE.TEXT);
    for (const client of this.clients.values()) {
      if (client.handshakeComplete) {
        client.socket.write(frame);
      }
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
