import {
  AuthShell,
  ErrorMessage,
  FieldLabel,
  FormInput,
  PrimaryButton,
} from "@/components/login/auth-ui";
import React from "react";

type UsernameSetupViewProps = {
  error: string;
  username: string;
  onChangeUsername: (value: string) => void;
  onContinue: () => void;
};

export function UsernameSetupView({
  error,
  username,
  onChangeUsername,
  onContinue,
}: UsernameSetupViewProps) {
  return (
    <AuthShell>
      <FieldLabel>Usuario</FieldLabel>
      <FormInput
        autoCapitalize="none"
        placeholder="Elige un usuario"
        autoComplete="username"
        value={username}
        onChangeText={onChangeUsername}
      />
      <ErrorMessage message={error} />
      <PrimaryButton onPress={onContinue}>Continuar</PrimaryButton>
    </AuthShell>
  );
}

export default UsernameSetupView;
