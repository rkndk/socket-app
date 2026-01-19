import { socketClient } from "@/services/socket-client";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ClientJoin() {
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("3000");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!ipAddress.trim()) {
      setError("Please enter an IP address");
      return;
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError("Please enter a valid port number");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      await socketClient.connect(ipAddress.trim(), portNum);
      router.replace("/client/lobby");
    } catch (err) {
      console.error("Connection failed:", err);
      setError("Failed to connect. Check the IP and port.");
      setIsConnecting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Join a Game</Text>
        <Text style={styles.subtitle}>Enter the host's connection info</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>IP Address</Text>
          <TextInput
            style={styles.input}
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="e.g. 192.168.1.10"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="3000"
            placeholderTextColor="#666"
            keyboardType="number-pad"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.connectButton,
            isConnecting && styles.connectButtonDisabled,
            pressed && !isConnecting && styles.connectButtonPressed,
          ]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? "Connecting..." : "Connect"}
          </Text>
        </Pressable>
      </View>
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
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 16,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#fff",
    borderWidth: 2,
    borderColor: "#252a4a",
  },
  errorBox: {
    backgroundColor: "#ff6b6b22",
    borderColor: "#ff6b6b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
  },
  connectButton: {
    backgroundColor: "#00b894",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  connectButtonDisabled: {
    backgroundColor: "#333",
  },
  connectButtonPressed: {
    opacity: 0.8,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
