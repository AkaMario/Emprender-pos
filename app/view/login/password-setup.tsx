import { AuthShell, ErrorMessage, FieldLabel, FormInput, PrimaryButton } from "@/components/login/auth-ui";
import React from "react";
import { Pressable, Text } from "react-native";

type PasswordSetupViewProps = {
  buttonLabel?: string;
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
  buttonLabel = "Continue",
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
      <Pressable className="mb-6" onPress={onBack}>
        <Text className="text-2xl text-slate-700">‹</Text>
      </Pressable>

      {title ? <Text className="mb-5 text-xl font-black text-slate-900">{title}</Text> : null}

      <FieldLabel>New password</FieldLabel>
      <FormInput secureTextEntry placeholder="**************" value={password} onChangeText={onChangePassword} />

      <FieldLabel>Verify password</FieldLabel>
      <FormInput secureTextEntry placeholder="**************" value={verifyPassword} onChangeText={onChangeVerifyPassword} />

      <ErrorMessage message={error} />
      <PrimaryButton onPress={onContinue}>{buttonLabel}</PrimaryButton>
    </AuthShell>
  );
}

export default PasswordSetupView;
