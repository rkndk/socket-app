// Polyfills must be imported first
import "@/services/polyfills";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1a1a2e",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: "#16213e",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Quiz Game",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="host/lobby"
          options={{
            title: "Host Lobby",
          }}
        />
        <Stack.Screen
          name="host/game"
          options={{
            title: "Quiz",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="host/results"
          options={{
            title: "Results",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="client/join"
          options={{
            title: "Join Game",
          }}
        />
        <Stack.Screen
          name="client/lobby"
          options={{
            title: "Waiting...",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="client/game"
          options={{
            title: "Quiz",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="client/results"
          options={{
            title: "Results",
            headerBackVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
