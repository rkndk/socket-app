import { socketClient } from "@/services/socket-client";
import { Player } from "@/types/game";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function ClientResults() {
  const { leaderboard: leaderboardParam } = useLocalSearchParams<{
    leaderboard?: string;
  }>();
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  useEffect(() => {
    if (leaderboardParam) {
      try {
        const parsed = JSON.parse(leaderboardParam) as Player[];
        setLeaderboard(parsed);
      } catch (e) {
        console.error("Failed to parse leaderboard:", e);
      }
    }
  }, [leaderboardParam]);

  const handlePlayAgain = () => {
    socketClient.disconnect();
    router.replace("/");
  };

  const getMedal = (index: number): string => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `${index + 1}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.subtitle}>Final Results</Text>
      </View>

      <View style={styles.leaderboardContainer}>
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={[styles.playerRow, index === 0 && styles.firstPlace]}>
              <Text style={styles.rank}>{getMedal(index)}</Text>
              <Text style={styles.playerName}>{item.name}</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{item.score}</Text>
                <Text style={styles.scoreLabel}>pts</Text>
              </View>
            </View>
          )}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.playAgainButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handlePlayAgain}
      >
        <Text style={styles.playAgainText}>Play Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  trophy: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 18,
  },
  leaderboardContainer: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  firstPlace: {
    backgroundColor: "#4a00e033",
    borderColor: "#4a00e0",
    borderWidth: 2,
  },
  rank: {
    fontSize: 28,
    marginRight: 16,
    minWidth: 40,
    textAlign: "center",
  },
  playerName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  scoreContainer: {
    alignItems: "center",
  },
  score: {
    color: "#00b894",
    fontSize: 28,
    fontWeight: "bold",
  },
  scoreLabel: {
    color: "#888",
    fontSize: 12,
  },
  playAgainButton: {
    backgroundColor: "#4a00e0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  playAgainText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
