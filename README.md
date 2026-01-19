# Local Quiz Game 🎮

A real-time multiplayer quiz game designed for local WiFi networks using **WebSocket over TCP**.

- **Host**: Runs on Android TV or Android Phone
- **Clients**: Connect via React Native App or Web Browser
- **Network**: Local WiFi coverage (Zero internet required)

## Features

- **Cross-Platform**: React Native (iOS/Android) & Web Clients work together seamlessly
- **No Internet Needed**: Entirely local communication
- **TV Optimized**: UI scales for large screens and supports remote control D-pad navigation
- **WebSocket Protocol**: Custom implementation over raw TCP sockets for maximum compatibility without native dependencies

## Architecture

The project uses a custom dual-protocol server running on the Host device:

1. **Underlying Layer**: `react-native-tcp-socket` provides raw TCP access
2. **Protocol Layer**: Custom TypeScript implementation handles WebSocket handshakes and framing
3. **Clients**:
   - **App**: Uses React Native's built-in `WebSocket`
   - **Web**: Uses Browser's native `WebSocket` API

## Tech Stack

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **Networking**: `react-native-tcp-socket` + Custom WebSocket Protocol
- **Styling**: StyleSheet (Responsive for TV/Mobile)

## getting Started

### Prerequisites

- Node.js & npm/bun
- Android Emulator or Physical Device (Phone/TV)
- Devices must be on the **SAME WiFi network**

### Installation

```bash
bun install
```

### Running the App (Host & Client)

You can run the same app on multiple devices. One acts as Host, others as Clients.

```bash
# Build and run on Android
npx expo run:android

# Build and run on iOS
npx expo run:ios
```

### Running the Web Client

For testing or browser-based players:

1. Open `web-client.html` in any modern web browser
2. Enter the Host's IP Address and Port (default: 3000)
3. Enter your Name and Connect!

## How to Play

1. **Start Host**: Open app, select "Host Game". Note the IP Address displayed.
2. **Join Players**:
   - **App**: Open app, select "Join Game", enter Host IP.
   - **Web**: Open html file, enter Host IP.
3. **Start Quiz**: Once everyone joins, the Host clicks "Start Game".
4. **Play**: Answer questions on your device. Results are shown live on the Host screen.

## Troubleshooting

- **Server Error: "Property 'Buffer' doesn't exist"**:
  - Restart the app. We added a polyfill in `services/polyfills.ts` that loads on startup.
- **Connection Failed**:
  - Ensure devices are on the **same WiFi**.
  - Check if Host IP is correct.
  - Some public WiFi networks block peer-to-peer communication. Use a personal hotspot or home router.
