import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { AuthProvider } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="view/settings/change-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/settings/change-pin"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/settings/change-security-question"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/alerts"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/sale-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/new-sale"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/supply-entry"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/stock-out"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/dashboard/new-dish"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/menu/create"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/menu/edit"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/inventory/create"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/inventory/history"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="view/qr/select-qr"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
