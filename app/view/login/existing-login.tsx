import { useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import {
  AuthShell,
  ErrorMessage,
  FieldLabel,
  FormInput,
  PrimaryButton,
} from "@/components/login/auth-ui";
import React from "react";
import { Text, View } from "react-native";

type ExistingLoginViewProps = {
  error: string;
  password: string;
  rememberMe: boolean;
  submitting: boolean;
  username: string;
  onChangePassword: (value: string) => void;
  onChangeRememberMe: (value: boolean) => void;
  onChangeUsername: (value: string) => void;
  onForgotPassword: () => void;
  onSubmit: () => void;
};

export function ExistingLoginView({
  error,
  password,
  rememberMe,
  submitting,
  username,
  onChangePassword,
  onChangeRememberMe,
  onChangeUsername,
  onForgotPassword,
  onSubmit,
}: ExistingLoginViewProps) {
  const c = useDesignColors();
  return (
    <AuthShell>
      <FieldLabel>Usuario</FieldLabel>
      <FormInput
        autoCapitalize="none"
        placeholder="Tu usuario"
        autoComplete="username"
        value={username}
        onChangeText={onChangeUsername}
      />

      <FieldLabel>Contraseña</FieldLabel>
      <FormInput
        secureTextEntry
        placeholder="Tu contraseña"
        autoComplete="current-password"
        value={password}
        onChangeText={onChangePassword}
      />

      <Pressable
        accessibilityRole="button"
        style={{ minHeight: 48, justifyContent: "center" }}
        className="mb-5"
        onPress={onForgotPassword}
      >
        <Text className="text-xs font-semibold" style={{ color: c.link }}>
          ¿Olvidaste tu contraseña?
        </Text>
      </Pressable>

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Ingresando..." : "Iniciar sesión"}
      </PrimaryButton>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
        accessibilityLabel="Recordarme"
        style={{ minHeight: 48 }}
        className="mt-4 flex-row items-center gap-2"
        onPress={() => onChangeRememberMe(!rememberMe)}
      >
        <View className="h-3 w-3 items-center justify-center border border-primary">
          {rememberMe ? <View className="h-2 w-2 bg-primary" /> : null}
        </View>
        <Text className="text-xs text-link">Recordarme</Text>
      </Pressable>
    </AuthShell>
  );
}

export default ExistingLoginView;
