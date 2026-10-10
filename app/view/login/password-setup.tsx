import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import {
  AuthShell,
  ErrorMessage,
  FieldLabel,
  FormInput,
  PrimaryButton,
} from "@/components/login/auth-ui";
import React from "react";
import { Text } from "react-native";

type PasswordSetupViewProps = {
  buttonLabel?: string;
  submitting?: boolean;
  error: string;
  password: string;
  title?: string;
  verifyPassword: string;
  onBack: () => void;
  onChangePassword: (value: string) => void;
  onChangeVerifyPassword: (value: string) => void;
  onContinue: () => void;
};

export function PasswordSetupView({
  buttonLabel = "Continuar",
  submitting = false,
  error,
  password,
  title,
  verifyPassword,
  onBack,
  onChangePassword,
  onChangeVerifyPassword,
  onContinue,
}: PasswordSetupViewProps) {
  return (
    <AuthShell>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Regresar al paso anterior"
        style={{ minHeight: 48, minWidth: 48, justifyContent: "center" }}
        className="mb-6"
        onPress={onBack}
      >
        <Text className="text-2xl text-text ">‹</Text>
      </Pressable>

      {title ? (
        <Text className="mb-5 text-xl font-semibold text-text ">{title}</Text>
      ) : null}

      <FieldLabel>Nueva contraseña</FieldLabel>
      <FormInput
        autoComplete="new-password"
        secureTextEntry
        placeholder="**************"
        value={password}
        onChangeText={onChangePassword}
      />

      <FieldLabel>Confirmar contraseña</FieldLabel>
      <FormInput
        autoComplete="new-password"
        secureTextEntry
        placeholder="**************"
        value={verifyPassword}
        onChangeText={onChangeVerifyPassword}
      />

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onContinue}>
        {buttonLabel}
      </PrimaryButton>
    </AuthShell>
  );
}

export default PasswordSetupView;
