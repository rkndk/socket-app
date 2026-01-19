import { socketClient } from "@/services/socket-client";
import { socketServer } from "@/services/socket-server";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function RoleSelection() {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 600;
  const isTV = width > 1000;

  // Cleanup any stale connections when returning to home screen
  useEffect(() => {
    socketServer.stop();
    socketClient.disconnect();
  }, []);

  // Dynamic styles
  const dynamicStyles = {
    container: {
      padding: isTV ? 60 : isWideScreen ? 40 : 24,
    },
    emoji: {
      fontSize: isTV ? 120 : isWideScreen ? 100 : 80,
    },
    title: {
      fontSize: isTV ? 64 : isWideScreen ? 52 : 40,
    },
    subtitle: {
      fontSize: isTV ? 28 : isWideScreen ? 22 : 18,
    },
    buttonContainer: {
      flexDirection: isWideScreen ? "row" : "column",
      maxWidth: isTV ? 1000 : isWideScreen ? 800 : "100%",
      alignSelf: "center",
      width: "100%",
    } as const,
    button: {
      flex: isWideScreen ? 1 : undefined,
      padding: isTV ? 40 : isWideScreen ? 32 : 24,
    },
    buttonEmoji: {
      fontSize: isTV ? 80 : isWideScreen ? 64 : 48,
    },
    buttonTitle: {
      fontSize: isTV ? 44 : isWideScreen ? 36 : 28,
    },
    buttonSubtitle: {
      fontSize: isTV ? 20 : isWideScreen ? 16 : 14,
    },
    footer: {
      fontSize: isTV ? 20 : 14,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text
          style={[styles.emoji, { fontSize: dynamicStyles.emoji.fontSize }]}
        >
          🎯
        </Text>
        <Text
          style={[styles.title, { fontSize: dynamicStyles.title.fontSize }]}
        >
          Quiz Battle
        </Text>
        <Text
          style={[
            styles.subtitle,
            { fontSize: dynamicStyles.subtitle.fontSize },
          ]}
        >
          Multiplayer Quiz Game
        </Text>
      </View>

      <View style={[styles.buttonContainer, dynamicStyles.buttonContainer]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.hostButton,
            { padding: dynamicStyles.button.padding },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/host/lobby")}
        >
          <Text
            style={[
              styles.buttonEmoji,
              { fontSize: dynamicStyles.buttonEmoji.fontSize },
            ]}
          >
            👨‍🏫
          </Text>
          <Text
            style={[
              styles.buttonTitle,
              { fontSize: dynamicStyles.buttonTitle.fontSize },
            ]}
          >
            HOST
          </Text>
          <Text
            style={[
              styles.buttonSubtitle,
              { fontSize: dynamicStyles.buttonSubtitle.fontSize },
            ]}
          >
            Create a game and invite players
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.clientButton,
            { padding: dynamicStyles.button.padding },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/client/join")}
        >
          <Text
            style={[
              styles.buttonEmoji,
              { fontSize: dynamicStyles.buttonEmoji.fontSize },
            ]}
          >
            👨‍🎓
          </Text>
          <Text
            style={[
              styles.buttonTitle,
              { fontSize: dynamicStyles.buttonTitle.fontSize },
            ]}
          >
            JOIN
          </Text>
          <Text
            style={[
              styles.buttonSubtitle,
              { fontSize: dynamicStyles.buttonSubtitle.fontSize },
            ]}
          >
            Connect to a host and play
          </Text>
        </Pressable>
      </View>

      <Text
        style={[styles.footer, { fontSize: dynamicStyles.footer.fontSize }]}
      >
        Connect devices on the same WiFi network
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  emoji: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    color: "#a0a0a0",
  },
  buttonContainer: {
    gap: 20,
  },
  button: {
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hostButton: {
    backgroundColor: "#4a00e0",
  },
  clientButton: {
    backgroundColor: "#00b894",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonEmoji: {
    marginBottom: 12,
  },
  buttonTitle: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  buttonSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  footer: {
    textAlign: "center",
    color: "#666",
    marginTop: 48,
  },
});
