import { questions } from "@/data/questions";
import { socketServer } from "@/services/socket-server";
import { AnswerPayload, Player } from "@/types/game";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

interface PlayerAnswer {
  playerId: string;
  playerName: string;
  answer: number;
  correct: boolean;
}

export default function HostGame() {
  const { width, height } = useWindowDimensions();
  const isWideScreen = width > 600;
  const isTV = width > 1000;
  const isLandscape = width > height;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [players, setPlayers] = useState<Player[]>(socketServer.getPlayers());
  const [showCorrect, setShowCorrect] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const sendQuestion = useCallback((index: number) => {
    const question = questions[index];
    socketServer.broadcast({
      type: "QUESTION",
      payload: {
        question,
        index,
        total: questions.length,
      },
    });
  }, []);

  useEffect(() => {
    socketServer.onMessage((clientId, message) => {
      if (message.type === "ANSWER") {
        const payload = message.payload as AnswerPayload;
        const player = socketServer.getPlayer(clientId);
        if (!player) return;

        const correct =
          payload.selectedAnswer === currentQuestion.correctAnswer;

        if (correct) {
          player.score += 1;
          socketServer.setPlayer(clientId, player);
        }

        setPlayerAnswers((prev) => {
          if (prev.find((a) => a.playerId === clientId)) {
            return prev;
          }
          return [
            ...prev,
            {
              playerId: clientId,
              playerName: player.name,
              answer: payload.selectedAnswer,
              correct,
            },
          ];
        });

        socketServer.sendToClient(clientId, {
          type: "ANSWER_RECEIVED",
          payload: { correct, correctAnswer: currentQuestion.correctAnswer },
        });
      }
    });

    return () => {
      socketServer.onMessage(() => {});
    };
  }, [currentIndex, currentQuestion]);

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      const leaderboard = socketServer
        .getPlayers()
        .sort((a, b) => b.score - a.score);
      socketServer.broadcast({
        type: "GAME_END",
        payload: { leaderboard },
      });
      router.replace("/host/results");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPlayerAnswers([]);
      setShowCorrect(false);
      sendQuestion(currentIndex + 1);
    }
  };

  const handleShowAnswer = () => {
    setShowCorrect(true);
  };

  const answeredCount = playerAnswers.length;
  const totalPlayers = players.length;

  // Dynamic styles
  const dynamicStyles = {
    container: {
      padding: isTV ? 32 : isWideScreen ? 24 : 16,
    },
    questionNumber: {
      fontSize: isTV ? 24 : 16,
    },
    answeredCount: {
      fontSize: isTV ? 20 : 14,
    },
    questionText: {
      fontSize: isTV ? 28 : isWideScreen ? 22 : 18,
      lineHeight: isTV ? 38 : isWideScreen ? 30 : 26,
    },
    optionItem: {
      padding: isTV ? 16 : 12,
    },
    optionLabel: {
      fontSize: isTV ? 20 : 14,
    },
    optionText: {
      fontSize: isTV ? 20 : 14,
    },
    button: {
      padding: isTV ? 20 : 14,
    },
    buttonText: {
      fontSize: isTV ? 20 : 14,
    },
    sectionTitle: {
      fontSize: isTV ? 16 : 12,
    },
  };

  // Render buttons
  const renderButtons = () => (
    <View style={styles.buttonRow}>
      {!showCorrect && (
        <Pressable
          style={[
            styles.button,
            styles.showAnswerButton,
            { padding: dynamicStyles.button.padding },
          ]}
          onPress={handleShowAnswer}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize: dynamicStyles.buttonText.fontSize },
            ]}
          >
            Show Answer
          </Text>
        </Pressable>
      )}
      <Pressable
        style={[
          styles.button,
          styles.nextButton,
          { padding: dynamicStyles.button.padding },
        ]}
        onPress={handleNextQuestion}
      >
        <Text
          style={[
            styles.buttonText,
            { fontSize: dynamicStyles.buttonText.fontSize },
          ]}
        >
          {isLastQuestion ? "End Game" : "Next Question"}
        </Text>
      </Pressable>
    </View>
  );

  // Wide screen / TV layout - side by side
  if (isWideScreen) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.questionNumber,
              { fontSize: dynamicStyles.questionNumber.fontSize },
            ]}
          >
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <Text
            style={[
              styles.answeredCount,
              { fontSize: dynamicStyles.answeredCount.fontSize },
            ]}
          >
            Answered: {answeredCount}/{totalPlayers}
          </Text>
        </View>

        {/* Main Content - Side by Side */}
        <View style={styles.wideContent}>
          {/* Left - Question */}
          <View style={styles.leftPanel}>
            <ScrollView
              style={styles.questionScroll}
              contentContainerStyle={styles.questionScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.questionCard}>
                <Text
                  style={[
                    styles.questionText,
                    {
                      fontSize: dynamicStyles.questionText.fontSize,
                      lineHeight: dynamicStyles.questionText.lineHeight,
                    },
                  ]}
                >
                  {currentQuestion.question}
                </Text>

                <View style={[styles.optionsContainer, { gap: isTV ? 12 : 8 }]}>
                  {currentQuestion.options.map((option, index) => (
                    <View
                      key={index}
                      style={[
                        styles.optionItem,
                        { padding: dynamicStyles.optionItem.padding },
                        showCorrect &&
                          index === currentQuestion.correctAnswer &&
                          styles.optionCorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          { fontSize: dynamicStyles.optionLabel.fontSize },
                        ]}
                      >
                        {String.fromCharCode(65 + index)})
                      </Text>
                      <Text
                        style={[
                          styles.optionText,
                          { fontSize: dynamicStyles.optionText.fontSize },
                        ]}
                      >
                        {option}
                      </Text>
                      {showCorrect &&
                        index === currentQuestion.correctAnswer && (
                          <Text
                            style={[
                              styles.correctBadge,
                              isTV && { fontSize: 24 },
                            ]}
                          >
                            ✓
                          </Text>
                        )}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Buttons always visible at bottom of left panel */}
            {renderButtons()}
          </View>

          {/* Right - Player Answers */}
          <View style={styles.rightPanel}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: dynamicStyles.sectionTitle.fontSize },
              ]}
            >
              Player Answers
            </Text>
            <FlatList
              data={playerAnswers}
              keyExtractor={(item) => item.playerId}
              renderItem={({ item }) => (
                <View style={[styles.answerItem, isTV && { padding: 14 }]}>
                  <Text
                    style={[styles.playerNameSmall, isTV && { fontSize: 18 }]}
                  >
                    {item.playerName}
                  </Text>
                  <Text
                    style={[
                      styles.answerBadge,
                      item.correct ? styles.answerCorrect : styles.answerWrong,
                      isTV && { fontSize: 16 },
                    ]}
                  >
                    {String.fromCharCode(65 + item.answer)}{" "}
                    {showCorrect && (item.correct ? "✓" : "✗")}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyAnswers, isTV && { fontSize: 16 }]}>
                  Waiting for answers...
                </Text>
              }
            />
          </View>
        </View>
      </View>
    );
  }

  // Phone layout - stacked with scroll
  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.questionNumber,
            { fontSize: dynamicStyles.questionNumber.fontSize },
          ]}
        >
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <Text
          style={[
            styles.answeredCount,
            { fontSize: dynamicStyles.answeredCount.fontSize },
          ]}
        >
          Answered: {answeredCount}/{totalPlayers}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View style={styles.questionCard}>
          <Text
            style={[
              styles.questionText,
              {
                fontSize: dynamicStyles.questionText.fontSize,
                lineHeight: dynamicStyles.questionText.lineHeight,
              },
            ]}
          >
            {currentQuestion.question}
          </Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <View
                key={index}
                style={[
                  styles.optionItem,
                  { padding: dynamicStyles.optionItem.padding },
                  showCorrect &&
                    index === currentQuestion.correctAnswer &&
                    styles.optionCorrect,
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { fontSize: dynamicStyles.optionLabel.fontSize },
                  ]}
                >
                  {String.fromCharCode(65 + index)})
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    { fontSize: dynamicStyles.optionText.fontSize },
                  ]}
                >
                  {option}
                </Text>
                {showCorrect && index === currentQuestion.correctAnswer && (
                  <Text style={styles.correctBadge}>✓</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Player Answers */}
        <View style={styles.answersSection}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: dynamicStyles.sectionTitle.fontSize },
            ]}
          >
            Player Answers
          </Text>
          {playerAnswers.length === 0 ? (
            <Text style={styles.emptyAnswers}>Waiting for answers...</Text>
          ) : (
            playerAnswers.map((item) => (
              <View key={item.playerId} style={styles.answerItem}>
                <Text style={styles.playerNameSmall}>{item.playerName}</Text>
                <Text
                  style={[
                    styles.answerBadge,
                    item.correct ? styles.answerCorrect : styles.answerWrong,
                  ]}
                >
                  {String.fromCharCode(65 + item.answer)}{" "}
                  {showCorrect && (item.correct ? "✓" : "✗")}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Buttons - Fixed at bottom */}
      {renderButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: {
    color: "#fff",
    fontWeight: "bold",
  },
  answeredCount: {
    color: "#00b894",
  },
  // Wide screen layout
  wideContent: {
    flex: 1,
    flexDirection: "row",
    gap: 24,
  },
  leftPanel: {
    flex: 2,
  },
  rightPanel: {
    flex: 1,
    minWidth: 250,
  },
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    flexGrow: 1,
  },
  // Phone layout
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  // Shared styles
  questionCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionText: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252a4a",
    borderRadius: 10,
  },
  optionCorrect: {
    backgroundColor: "#00b89433",
    borderColor: "#00b894",
    borderWidth: 2,
  },
  optionLabel: {
    color: "#888",
    fontWeight: "bold",
    marginRight: 10,
    width: 28,
  },
  optionText: {
    color: "#fff",
    flex: 1,
  },
  correctBadge: {
    color: "#00b894",
    fontSize: 20,
    fontWeight: "bold",
  },
  answersSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  answerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  playerNameSmall: {
    color: "#fff",
    fontSize: 14,
  },
  answerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },
  answerCorrect: {
    backgroundColor: "#00b89433",
    color: "#00b894",
  },
  answerWrong: {
    backgroundColor: "#ff6b6b33",
    color: "#ff6b6b",
  },
  emptyAnswers: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  showAnswerButton: {
    backgroundColor: "#333",
  },
  nextButton: {
    backgroundColor: "#4a00e0",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
