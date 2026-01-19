import { socketClient } from "@/services/socket-client";
import { Player, PlayerJoinedPayload, SocketMessage } from "@/types/game";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ClientLobby() {
  const [name, setName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const isNavigatingToGame = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      isNavigatingToGame.current = false;

      socketClient.onMessage((message: SocketMessage) => {
        switch (message.type) {
          case "PLAYER_JOINED": {
            const payload = message.payload as PlayerJoinedPayload;
            setPlayers(payload.players);
            break;
          }
          case "QUESTION": {
            // Game started - navigate to game screen
            isNavigatingToGame.current = true;
            router.replace({
              pathname: "/client/game",
              params: { initialMessage: JSON.stringify(message) },
            });
            break;
          }
        }
      });

      socketClient.onDisconnect(() => {
        router.replace("/client/join");
      });

      // Cleanup when screen loses focus (back navigation)
      return () => {
        socketClient.onMessage(() => {});
        // Only disconnect if NOT navigating to game
        if (!isNavigatingToGame.current) {
          socketClient.disconnect();
        }
      };
    }, []),
  );

  const handleReady = () => {
    if (!name.trim()) return;

    socketClient.send({
      type: "PLAYER_JOIN",
      payload: { name: name.trim() },
    });
    setIsReady(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {!isReady ? (
        <>
          <View style={styles.header}>
            <Text style={styles.emoji}>✏️</Text>
            <Text style={styles.title}>Enter Your Name</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#666"
              autoCapitalize="words"
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [
                styles.readyButton,
                !name.trim() && styles.buttonDisabled,
                pressed && name.trim() && styles.buttonPressed,
              ]}
              onPress={handleReady}
              disabled={!name.trim()}
            >
              <Text style={styles.readyButtonText}>Ready!</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>Ready, {name}!</Text>
            <Text style={styles.waitingSubtitle}>
              Waiting for host to start the game...
            </Text>

            {players.length > 0 && (
              <View style={styles.playersBox}>
                <Text style={styles.playersLabel}>
                  Players ({players.length}):
                </Text>
                {players.map((player, index) => (
                  <Text key={player.id} style={styles.playerName}>
                    {index + 1}. {player.name}
                    {player.name === name ? " (you)" : ""}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.pulseContainer}>
            <View style={styles.pulseOuter}>
              <View style={styles.pulseInner} />
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 18,
    fontSize: 20,
    color: "#fff",
    borderWidth: 2,
    borderColor: "#252a4a",
    textAlign: "center",
  },
  readyButton: {
    backgroundColor: "#00b894",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#333",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  waitingContainer: {
    alignItems: "center",
  },
  waitingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  waitingTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  waitingSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 30,
  },
  playersBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginTop: 20,
  },
  playersLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    paddingVertical: 6,
  },
  pulseContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pulseOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00b89444",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00b894",
  },
});
