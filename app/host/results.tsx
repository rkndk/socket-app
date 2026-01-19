import { socketServer } from "@/services/socket-server";
import { Player } from "@/types/game";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function HostResults() {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 600;
  const isTV = width > 1000;

  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  useEffect(() => {
    const players = socketServer.getPlayers().sort((a, b) => b.score - a.score);
    setLeaderboard(players);
  }, []);

  const handlePlayAgain = () => {
    socketServer.stop();
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

  // Dynamic styles
  const dynamicStyles = {
    container: {
      padding: isTV ? 60 : isWideScreen ? 40 : 20,
    },
    trophy: {
      fontSize: isTV ? 120 : isWideScreen ? 100 : 80,
    },
    title: {
      fontSize: isTV ? 48 : isWideScreen ? 40 : 32,
    },
    subtitle: {
      fontSize: isTV ? 28 : isWideScreen ? 22 : 18,
    },
    rank: {
      fontSize: isTV ? 44 : isWideScreen ? 36 : 28,
    },
    playerName: {
      fontSize: isTV ? 32 : isWideScreen ? 26 : 20,
    },
    score: {
      fontSize: isTV ? 44 : isWideScreen ? 36 : 28,
    },
    playerRow: {
      padding: isTV ? 28 : isWideScreen ? 24 : 20,
      marginBottom: isTV ? 16 : 12,
    },
    button: {
      padding: isTV ? 28 : 20,
    },
    buttonText: {
      fontSize: isTV ? 28 : 20,
    },
    listWidth: {
      maxWidth: isTV ? 900 : isWideScreen ? 700 : "100%",
      alignSelf: "center",
      width: "100%",
    } as const,
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text
          style={[styles.trophy, { fontSize: dynamicStyles.trophy.fontSize }]}
        >
          🏆
        </Text>
        <Text
          style={[styles.title, { fontSize: dynamicStyles.title.fontSize }]}
        >
          Game Over!
        </Text>
        <Text
          style={[
            styles.subtitle,
            { fontSize: dynamicStyles.subtitle.fontSize },
          ]}
        >
          Final Results
        </Text>
      </View>

      <View style={[styles.leaderboardContainer, dynamicStyles.listWidth]}>
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.playerRow,
                {
                  padding: dynamicStyles.playerRow.padding,
                  marginBottom: dynamicStyles.playerRow.marginBottom,
                },
                index === 0 && styles.firstPlace,
              ]}
            >
              <Text
                style={[styles.rank, { fontSize: dynamicStyles.rank.fontSize }]}
              >
                {getMedal(index)}
              </Text>
              <Text
                style={[
                  styles.playerName,
                  { fontSize: dynamicStyles.playerName.fontSize },
                ]}
              >
                {item.name}
              </Text>
              <View style={styles.scoreContainer}>
                <Text
                  style={[
                    styles.score,
                    { fontSize: dynamicStyles.score.fontSize },
                  ]}
                >
                  {item.score}
                </Text>
                <Text style={[styles.scoreLabel, isTV && { fontSize: 18 }]}>
                  pts
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      <View style={dynamicStyles.listWidth}>
        <Pressable
          style={({ pressed }) => [
            styles.playAgainButton,
            { padding: dynamicStyles.button.padding },
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePlayAgain}
        >
          <Text
            style={[
              styles.playAgainText,
              { fontSize: dynamicStyles.buttonText.fontSize },
            ]}
          >
            Play Again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  trophy: {
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
  },
  leaderboardContainer: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
  },
  firstPlace: {
    backgroundColor: "#4a00e033",
    borderColor: "#4a00e0",
    borderWidth: 2,
  },
  rank: {
    marginRight: 20,
    minWidth: 50,
    textAlign: "center",
  },
  playerName: {
    color: "#fff",
    fontWeight: "bold",
    flex: 1,
  },
  scoreContainer: {
    alignItems: "center",
  },
  score: {
    color: "#00b894",
    fontWeight: "bold",
  },
  scoreLabel: {
    color: "#888",
    fontSize: 14,
  },
  playAgainButton: {
    backgroundColor: "#4a00e0",
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  playAgainText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
