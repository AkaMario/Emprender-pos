import { AuthShell, ErrorMessage, FieldLabel, FormInput, PrimaryButton } from "@/components/login/auth-ui";
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
      <FieldLabel>Username</FieldLabel>
      <FormInput autoCapitalize="none" placeholder="Placeholder" value={username} onChangeText={onChangeUsername} />
      <ErrorMessage message={error} />
      <PrimaryButton onPress={onContinue}>Continue</PrimaryButton>
    </AuthShell>
  );
}

export default UsernameSetupView;
