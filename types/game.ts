// Game Types for Socket Quiz Game

export interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
}

export interface Answer {
  playerId: string;
  questionId: number;
  selectedAnswer: number;
  correct: boolean;
}

export interface GameState {
  status: "waiting" | "playing" | "finished";
  currentQuestionIndex: number;
  players: Player[];
  answers: Map<string, Answer[]>; // playerId -> answers
}

// Socket Message Types
export type MessageType =
  | "PLAYER_JOIN"
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "GAME_START"
  | "QUESTION"
  | "ANSWER"
  | "ANSWER_RECEIVED"
  | "NEXT_QUESTION"
  | "GAME_END";

export interface SocketMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

// Message Payloads
export interface PlayerJoinPayload {
  name: string;
}

export interface PlayerJoinedPayload {
  players: Player[];
}

export interface QuestionPayload {
  question: Question;
  index: number;
  total: number;
}

export interface AnswerPayload {
  playerId: string;
  questionId: number;
  selectedAnswer: number;
}

export interface AnswerReceivedPayload {
  correct: boolean;
  correctAnswer: number;
}

export interface GameEndPayload {
  leaderboard: Player[];
}
