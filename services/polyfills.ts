/**
 * Polyfills for React Native
 * Import this file at the very start of your app entry
 */

import { Buffer } from "buffer";

// Make Buffer available globally
if (typeof global !== "undefined") {
  (global as any).Buffer = Buffer;
}

export { Buffer };
