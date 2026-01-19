import { socketClient } from "@/services/socket-client";
import {
  AnswerReceivedPayload,
  GameEndPayload,
  Question,
  QuestionPayload,
  SocketMessage,
} from "@/types/game";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ClientGame() {
  const { initialMessage } = useLocalSearchParams<{
    initialMessage?: string;
  }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    correctAnswer: number;
  } | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    // Handle initial question from navigation params
    if (initialMessage) {
      try {
        const message = JSON.parse(initialMessage) as SocketMessage;
        if (message.type === "QUESTION") {
          const payload = message.payload as QuestionPayload;
          setQuestion(payload.question);
          setQuestionIndex(payload.index);
          setTotalQuestions(payload.total);
        }
      } catch (e) {
        console.error("Failed to parse initial message:", e);
      }
    }

    socketClient.onMessage((message: SocketMessage) => {
      switch (message.type) {
        case "QUESTION": {
          const payload = message.payload as QuestionPayload;
          setQuestion(payload.question);
          setQuestionIndex(payload.index);
          setTotalQuestions(payload.total);
          setSelectedAnswer(null);
          setAnswerResult(null);
          setIsWaiting(false);
          break;
        }
        case "ANSWER_RECEIVED": {
          const payload = message.payload as AnswerReceivedPayload;
          setAnswerResult(payload);
          setIsWaiting(true);
          break;
        }
        case "GAME_END": {
          const payload = message.payload as GameEndPayload;
          router.replace({
            pathname: "/client/results",
            params: { leaderboard: JSON.stringify(payload.leaderboard) },
          });
          break;
        }
      }
    });

    return () => {
      socketClient.onMessage(() => {});
    };
  }, [initialMessage]);

  const handleSelectAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !question) return;

    setSelectedAnswer(answerIndex);
    socketClient.send({
      type: "ANSWER",
      payload: {
        playerId: "", // Server will use connection ID
        questionId: question.id,
        selectedAnswer: answerIndex,
      },
    });
  };

  const getOptionStyle = (index: number) => {
    if (answerResult) {
      if (index === answerResult.correctAnswer) {
        return styles.optionCorrect;
      }
      if (index === selectedAnswer && !answerResult.correct) {
        return styles.optionWrong;
      }
    } else if (index === selectedAnswer) {
      return styles.optionSelected;
    }
    return null;
  };

  if (!question) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {questionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.optionButton,
              getOptionStyle(index),
              pressed && selectedAnswer === null && styles.optionPressed,
            ]}
            onPress={() => handleSelectAnswer(index)}
            disabled={selectedAnswer !== null}
          >
            <Text style={styles.optionLabel}>
              {String.fromCharCode(65 + index)}
            </Text>
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {isWaiting && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>
            {answerResult?.correct ? "✅ Correct!" : "❌ Wrong!"}
          </Text>
          <Text style={styles.waitingSubtext}>
            Waiting for next question...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: 18,
  },
  header: {
    marginBottom: 20,
  },
  questionNumber: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  questionText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionPressed: {
    backgroundColor: "#252a4a",
  },
  optionSelected: {
    borderColor: "#4a00e0",
    backgroundColor: "#4a00e022",
  },
  optionCorrect: {
    borderColor: "#00b894",
    backgroundColor: "#00b89422",
  },
  optionWrong: {
    borderColor: "#ff6b6b",
    backgroundColor: "#ff6b6b22",
  },
  optionLabel: {
    color: "#4a00e0",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 14,
    width: 30,
  },
  optionText: {
    color: "#fff",
    fontSize: 18,
    flex: 1,
  },
  waitingBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a2e",
    padding: 24,
    alignItems: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  waitingText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  waitingSubtext: {
    color: "#888",
    fontSize: 14,
  },
});
