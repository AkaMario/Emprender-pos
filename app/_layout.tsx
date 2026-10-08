import { AlertHost } from "@/components/ui/alerts";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeRoot } from "@/components/layout/theme-root";
import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";
import { AuthProvider, useAuth } from "@/context/auth";
import { BusinessProvider, useBusiness } from "@/context/business";
import { Button, ErrorText, Loading, Page } from "@/components/business/ui";

export const unstable_settings = { anchor: "(tabs)" };
function RootNavigator() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { profile, isLoading, error, reload } = useBusiness();
  if (authLoading || isLoading) return <Loading />;
  if (error)
    return (
      <Page>
        <ErrorText message={error} />
        <Button
          title="Reintentar"
          onPress={() => {
            void reload();
          }}
        />
        <Button
          title="Cerrar sesión"
          secondary
          onPress={() => {
            void logout();
          }}
        />
      </Page>
    );
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && !profile}>
          <Stack.Screen name="business-setup" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && Boolean(profile)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="view" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "transparentModal", title: "Información" }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeRoot>
        <AuthProvider>
          <BusinessProvider>
            <RootNavigator />
            <AlertHost />
          </BusinessProvider>
        </AuthProvider>
      </ThemeRoot>
    </SafeAreaProvider>
  );
}
