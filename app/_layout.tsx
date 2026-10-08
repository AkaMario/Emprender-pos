import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import { AuthProvider, useAuth } from "@/context/auth";
import { BusinessProvider, useBusiness } from "@/context/business";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button, ErrorText, Loading, Page } from "@/components/business/ui";

export const unstable_settings = { anchor: "(tabs)" };
function RootNavigator() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { profile, isLoading, error, reload } = useBusiness();
  if (authLoading || isLoading) return <Loading />;
  if (error) return <Page><ErrorText message={error} /><Button title="Reintentar" onPress={() => { void reload(); }} /><Button title="Cerrar sesión" secondary onPress={() => { void logout(); }} /></Page>;
  return <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}><Stack.Screen name="login" /></Stack.Protected>
      <Stack.Protected guard={isAuthenticated && !profile}><Stack.Screen name="business-setup" /></Stack.Protected>
      <Stack.Protected guard={isAuthenticated && Boolean(profile)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="view" />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack.Protected>
    </Stack>
    <StatusBar style="auto" />
  </>;
}
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
    <AuthProvider><BusinessProvider><RootNavigator /></BusinessProvider></AuthProvider>
  </ThemeProvider>;
}
