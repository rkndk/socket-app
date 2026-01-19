/**
 * WebSocket Protocol Implementation over TCP
 *
 * This module implements the WebSocket protocol (RFC 6455) for use with
 * react-native-tcp-socket. It handles:
 * - HTTP Upgrade handshake
 * - Frame encoding/decoding
 * - Ping/Pong for connection health
 *
 * No external dependencies - pure JavaScript implementation.
 */

import { Buffer } from "buffer";

// WebSocket opcodes
export const OPCODE = {
  CONTINUATION: 0x00,
  TEXT: 0x01,
  BINARY: 0x02,
  CLOSE: 0x08,
  PING: 0x09,
  PONG: 0x0a,
} as const;

export type WebSocketOpcode = (typeof OPCODE)[keyof typeof OPCODE];

export interface DecodedFrame {
  fin: boolean;
  opcode: WebSocketOpcode;
  masked: boolean;
  payload: Buffer;
  frameLength: number; // Total bytes consumed
}

/**
 * Check if incoming data is an HTTP upgrade request for WebSocket
 */
export function isWebSocketUpgradeRequest(data: Buffer): boolean {
  const str = data.toString("utf8", 0, Math.min(data.length, 1024));
  return (
    str.startsWith("GET ") && str.toLowerCase().includes("upgrade: websocket")
  );
}

/**
 * Parse the HTTP upgrade request and extract the Sec-WebSocket-Key
 */
export function parseUpgradeRequest(data: Buffer): {
  key: string;
  path: string;
} | null {
  const str = data.toString("utf8");
  const lines = str.split("\r\n");

  if (lines.length === 0) return null;

  // Parse request line: GET /path HTTP/1.1
  const requestLine = lines[0];
  const pathMatch = requestLine.match(/^GET\s+(\S+)\s+HTTP/);
  const path = pathMatch ? pathMatch[1] : "/";

  // Find Sec-WebSocket-Key header
  let key = "";
  for (const line of lines) {
    const keyMatch = line.match(/^Sec-WebSocket-Key:\s*(.+)$/i);
    if (keyMatch) {
      key = keyMatch[1].trim();
      break;
    }
  }

  if (!key) return null;

  return { key, path };
}

/**
 * Generate the Sec-WebSocket-Accept value for the handshake response
 * Uses SHA-1 hash of key + magic GUID, then base64 encode
 */
export function generateAcceptKey(clientKey: string): string {
  // WebSocket magic GUID from RFC 6455
  const MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  const combined = clientKey + MAGIC_GUID;

  // Simple SHA-1 implementation for React Native
  // We'll use a basic approach that works in RN environment
  const hash = sha1(combined);
  return Buffer.from(hash, "hex").toString("base64");
}

/**
 * Create the HTTP 101 Switching Protocols response
 */
export function createUpgradeResponse(acceptKey: string): string {
  return [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "",
    "",
  ].join("\r\n");
}

/**
 * Encode data into a WebSocket frame
 */
export function encodeFrame(
  data: string | Buffer,
  opcode: WebSocketOpcode = OPCODE.TEXT,
): Buffer {
  const payload = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  const payloadLength = payload.length;

  let headerLength: number;
  let extendedPayloadLength: Buffer | null = null;

  if (payloadLength < 126) {
    headerLength = 2;
  } else if (payloadLength < 65536) {
    headerLength = 4;
    extendedPayloadLength = Buffer.alloc(2);
    extendedPayloadLength.writeUInt16BE(payloadLength, 0);
  } else {
    headerLength = 10;
    extendedPayloadLength = Buffer.alloc(8);
    // Write as 64-bit unsigned integer (big-endian)
    extendedPayloadLength.writeUInt32BE(0, 0); // High 32 bits (0 for our use case)
    extendedPayloadLength.writeUInt32BE(payloadLength, 4); // Low 32 bits
  }

  const frame = Buffer.alloc(headerLength + payloadLength);

  // First byte: FIN bit (1) + RSV (000) + opcode (4 bits)
  frame[0] = 0x80 | opcode; // FIN = 1, opcode

  // Second byte: MASK bit (0 for server) + payload length
  if (payloadLength < 126) {
    frame[1] = payloadLength;
  } else if (payloadLength < 65536) {
    frame[1] = 126;
    extendedPayloadLength!.copy(frame, 2);
  } else {
    frame[1] = 127;
    extendedPayloadLength!.copy(frame, 2);
  }

  // Copy payload
  payload.copy(frame, headerLength);

  return frame;
}

/**
 * Decode a WebSocket frame from a buffer
 * Returns null if buffer doesn't contain a complete frame
 */
export function decodeFrame(buffer: Buffer): DecodedFrame | null {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];

  const fin = (firstByte & 0x80) !== 0;
  const opcode = (firstByte & 0x0f) as WebSocketOpcode;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7f;

  let offset = 2;

  // Extended payload length
  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    // Read as 64-bit, but we only use the lower 32 bits
    const high = buffer.readUInt32BE(2);
    const low = buffer.readUInt32BE(6);
    if (high !== 0) {
      throw new Error("Payload too large");
    }
    payloadLength = low;
    offset = 10;
  }

  // Masking key (if masked - client messages are always masked)
  let maskingKey: Buffer | null = null;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    maskingKey = buffer.subarray(offset, offset + 4);
    offset += 4;
  }

  // Check if we have the complete payload
  if (buffer.length < offset + payloadLength) return null;

  // Extract and unmask payload
  let payload = buffer.subarray(offset, offset + payloadLength);

  if (masked && maskingKey) {
    // Unmask the payload
    payload = Buffer.from(payload); // Create a copy
    for (let i = 0; i < payload.length; i++) {
      payload[i] = payload[i] ^ maskingKey[i % 4];
    }
  }

  return {
    fin,
    opcode,
    masked,
    payload,
    frameLength: offset + payloadLength,
  };
}

/**
 * Create a close frame
 */
export function createCloseFrame(
  code: number = 1000,
  reason: string = "",
): Buffer {
  const reasonBuffer = Buffer.from(reason, "utf8");
  const payload = Buffer.alloc(2 + reasonBuffer.length);
  payload.writeUInt16BE(code, 0);
  reasonBuffer.copy(payload, 2);
  return encodeFrame(payload, OPCODE.CLOSE);
}

/**
 * Create a pong frame (response to ping)
 */
export function createPongFrame(pingPayload: Buffer): Buffer {
  return encodeFrame(pingPayload, OPCODE.PONG);
}

// ============================================================
// SHA-1 Implementation (minimal, for WebSocket handshake only)
// ============================================================

function sha1(message: string): string {
  const msgBuffer = Buffer.from(message, "utf8");
  const msgLength = msgBuffer.length;

  // Pre-processing: adding padding bits
  const bitLength = msgLength * 8;
  const paddingLength = (64 - ((msgLength + 9) % 64)) % 64;
  const paddedLength = msgLength + 1 + paddingLength + 8;

  const padded = Buffer.alloc(paddedLength);
  msgBuffer.copy(padded);
  padded[msgLength] = 0x80;

  // Append original length in bits as 64-bit big-endian
  padded.writeUInt32BE(Math.floor(bitLength / 0x100000000), paddedLength - 8);
  padded.writeUInt32BE(bitLength >>> 0, paddedLength - 4);

  // Initialize hash values
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  // Process each 64-byte chunk
  for (let i = 0; i < paddedLength; i += 64) {
    const w: number[] = new Array(80);

    // Break chunk into sixteen 32-bit big-endian words
    for (let j = 0; j < 16; j++) {
      w[j] = padded.readUInt32BE(i + j * 4);
    }

    // Extend the sixteen 32-bit words into eighty 32-bit words
    for (let j = 16; j < 80; j++) {
      const val = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = ((val << 1) | (val >>> 31)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f: number;
      let k: number;

      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  // Produce the final hash value as hex
  const toHex = (n: number) => n.toString(16).padStart(8, "0");
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}
