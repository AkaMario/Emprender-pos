import { AuthShell, BRAND_GREEN, ErrorMessage, FieldLabel, FormInput, PrimaryButton } from "@/components/login/auth-ui";
import React from "react";
import { Pressable, Text, View } from "react-native";

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
  return (
    <AuthShell>
      <FieldLabel>Username</FieldLabel>
      <FormInput autoCapitalize="none" placeholder="Placeholder" value={username} onChangeText={onChangeUsername} />

      <FieldLabel>Password</FieldLabel>
      <FormInput secureTextEntry placeholder="Password" value={password} onChangeText={onChangePassword} />

      <Pressable className="mb-5" onPress={onForgotPassword}>
        <Text className="text-xs font-semibold" style={{ color: BRAND_GREEN }}>
          Forgot your password?
        </Text>
      </Pressable>

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Ingresando..." : "Login"}
      </PrimaryButton>

      <Pressable
        className="mt-4 flex-row items-center gap-2"
        onPress={() => onChangeRememberMe(!rememberMe)}
      >
        <View className="h-3 w-3 items-center justify-center border border-green-700">
          {rememberMe ? <View className="h-2 w-2 bg-green-700" /> : null}
        </View>
        <Text className="text-xs text-green-700">Recuerdame</Text>
      </Pressable>
    </AuthShell>
  );
}

export default ExistingLoginView;
