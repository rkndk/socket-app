import { socketServer } from "@/services/socket-server";
import { Player, PlayerJoinPayload, SocketMessage } from "@/types/game";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function HostLobby() {
  const { width, height } = useWindowDimensions();
  const isWideScreen = width > 600;
  const isTV = width > 1000;

  const [ipAddress, setIpAddress] = useState("Loading...");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isServerRunning, setIsServerRunning] = useState(false);

  const startServer = useCallback(async () => {
    try {
      const ip = await socketServer.getLocalIP();
      setIpAddress(ip);

      await socketServer.start();
      setIsServerRunning(true);

      socketServer.onConnect((clientId) => {
        console.log("Client connected:", clientId);
      });

      socketServer.onDisconnect((clientId) => {
        setPlayers((prev) => prev.filter((p) => p.id !== clientId));
        socketServer.broadcast({
          type: "PLAYER_LEFT",
          payload: { players: socketServer.getPlayers() },
        });
      });

      socketServer.onMessage((clientId, message) => {
        handleMessage(clientId, message);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
    }
  }, []);

  const handleMessage = (clientId: string, message: SocketMessage) => {
    switch (message.type) {
      case "PLAYER_JOIN": {
        const payload = message.payload as PlayerJoinPayload;
        const newPlayer: Player = {
          id: clientId,
          name: payload.name,
          score: 0,
          connected: true,
        };
        socketServer.setPlayer(clientId, newPlayer);

        const updatedPlayers = socketServer.getPlayers();
        setPlayers(updatedPlayers);

        socketServer.broadcast({
          type: "PLAYER_JOINED",
          payload: { players: updatedPlayers },
        });
        break;
      }
    }
  };

  const isNavigatingToGame = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      isNavigatingToGame.current = false;
      startServer();

      return () => {
        if (!isNavigatingToGame.current) {
          socketServer.stop();
        }
      };
    }, [startServer]),
  );

  const handleStartGame = () => {
    isNavigatingToGame.current = true;
    const question = require("@/data/questions").questions[0];
    socketServer.broadcast({
      type: "QUESTION",
      payload: {
        question,
        index: 0,
        total: require("@/data/questions").questions.length,
      },
    });
    router.replace("/host/game");
  };

  const port = socketServer.getPort();

  // Dynamic styles based on screen size
  const dynamicStyles = {
    container: {
      padding: isTV ? 40 : isWideScreen ? 30 : 20,
    },
    mainContent: {
      flexDirection: isWideScreen ? "row" : "column",
      gap: isWideScreen ? 30 : 0,
    } as const,
    leftPanel: {
      width: isWideScreen ? (isTV ? 400 : 300) : "100%",
    } as const,
    rightPanel: {
      flex: isWideScreen ? 1 : undefined,
    } as const,
    infoValue: {
      fontSize: isTV ? 36 : isWideScreen ? 28 : 24,
    },
    infoLabel: {
      fontSize: isTV ? 18 : 14,
    },
    emptyEmoji: {
      fontSize: isTV ? 100 : 60,
    },
    emptyText: {
      fontSize: isTV ? 28 : 18,
    },
    playerItem: {
      padding: isTV ? 24 : 16,
    },
    playerName: {
      fontSize: isTV ? 24 : 18,
    },
    startButton: {
      padding: isTV ? 28 : 20,
    },
    startButtonText: {
      fontSize: isTV ? 28 : 20,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={dynamicStyles.mainContent}>
        {/* Left Panel - Connection Info */}
        <View style={dynamicStyles.leftPanel}>
          <View style={styles.connectionInfo}>
            <Text
              style={[
                styles.infoLabel,
                { fontSize: dynamicStyles.infoLabel.fontSize },
              ]}
            >
              IP Address
            </Text>
            <Text
              style={[
                styles.infoValue,
                { fontSize: dynamicStyles.infoValue.fontSize },
              ]}
            >
              {ipAddress}
            </Text>
            <Text
              style={[
                styles.infoLabel,
                { fontSize: dynamicStyles.infoLabel.fontSize },
              ]}
            >
              Port
            </Text>
            <Text
              style={[
                styles.infoValue,
                { fontSize: dynamicStyles.infoValue.fontSize, marginBottom: 0 },
              ]}
            >
              {port}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                isServerRunning && styles.statusDotActive,
              ]}
            />
            <Text style={styles.statusText}>
              {isServerRunning ? "Server Running" : "Starting..."}
            </Text>
          </View>

          {/* Start Button for wide screens - shown here */}
          {isWideScreen && (
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                { padding: dynamicStyles.startButton.padding },
                players.length === 0 && styles.startButtonDisabled,
                pressed && players.length > 0 && styles.startButtonPressed,
              ]}
              onPress={handleStartGame}
              disabled={players.length === 0}
            >
              <Text
                style={[
                  styles.startButtonText,
                  { fontSize: dynamicStyles.startButtonText.fontSize },
                ]}
              >
                {players.length === 0 ? "Waiting for Players..." : "Start Game"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Right Panel - Players List */}
        <View style={[styles.playersSection, dynamicStyles.rightPanel]}>
          <Text style={[styles.sectionTitle, isTV && { fontSize: 28 }]}>
            Players ({players.length})
          </Text>

          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyEmoji,
                  { fontSize: dynamicStyles.emptyEmoji.fontSize },
                ]}
              >
                👥
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { fontSize: dynamicStyles.emptyText.fontSize },
                ]}
              >
                Waiting for players to join...
              </Text>
              <Text style={styles.emptySubtext}>
                Share the IP and Port with players
              </Text>
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              numColumns={isTV ? 2 : 1}
              key={isTV ? "tv" : "phone"}
              contentContainerStyle={isTV && { gap: 12 }}
              columnWrapperStyle={isTV && { gap: 12 }}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.playerItem,
                    { padding: dynamicStyles.playerItem.padding },
                    isTV && { flex: 1 },
                  ]}
                >
                  <Text style={[styles.playerIndex, isTV && { fontSize: 24 }]}>
                    {index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.playerName,
                      { fontSize: dynamicStyles.playerName.fontSize },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <View style={styles.connectedBadge}>
                    <Text
                      style={[styles.connectedText, isTV && { fontSize: 16 }]}
                    >
                      Connected
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* Start Button for narrow screens - shown at bottom */}
      {!isWideScreen && (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            players.length === 0 && styles.startButtonDisabled,
            pressed && players.length > 0 && styles.startButtonPressed,
          ]}
          onPress={handleStartGame}
          disabled={players.length === 0}
        >
          <Text style={styles.startButtonText}>
            {players.length === 0 ? "Waiting for Players..." : "Start Game"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
  },
  connectionInfo: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoLabel: {
    color: "#888",
    marginBottom: 4,
  },
  infoValue: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff6b6b",
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: "#00ff88",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
  },
  playersSection: {
    flex: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    opacity: 0.7,
  },
  emptyEmoji: {
    marginBottom: 16,
  },
  emptyText: {
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    marginBottom: 10,
  },
  playerIndex: {
    color: "#4a00e0",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 16,
  },
  playerName: {
    color: "#fff",
    flex: 1,
  },
  connectedBadge: {
    backgroundColor: "#00b89433",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  connectedText: {
    color: "#00b894",
    fontSize: 14,
  },
  startButton: {
    backgroundColor: "#4a00e0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 16,
  },
  startButtonDisabled: {
    backgroundColor: "#333",
  },
  startButtonPressed: {
    opacity: 0.8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
