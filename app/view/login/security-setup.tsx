import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { SECURITY_QUESTIONS } from "@/context/auth";
import {
  AuthShell,
  ErrorMessage,
  FieldLabel,
  FormInput,
  PrimaryButton,
} from "@/components/login/auth-ui";
import React from "react";
import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

type SecuritySetupViewProps = {
  buttonLabel?: string;
  error: string;
  readOnlyQuestion?: boolean;
  securityAnswer: string;
  securityQuestion: string;
  submitting: boolean;
  title?: string;
  onBack: () => void;
  onChangeSecurityAnswer: (value: string) => void;
  onChangeSecurityQuestion: (value: string) => void;
  onSubmit: () => void;
};

export function SecuritySetupView({
  buttonLabel = "Continuar",
  error,
  readOnlyQuestion = false,
  securityAnswer,
  securityQuestion,
  submitting,
  title,
  onBack,
  onChangeSecurityAnswer,
  onChangeSecurityQuestion,
  onSubmit,
}: SecuritySetupViewProps) {
  return (
    <AuthShell>
      <Pressable className="mb-6" onPress={() => router.push("/settings")}>
        <Ionicons name="arrow-back-outline" size={20} className="text-text " />
        {/* <Text
              className="text-lg font-bold text-center"
            >
              Regresar
            </Text> */}
      </Pressable>

      {title ? (
        <Text className="mb-5 text-xl font-black text-text ">{title}</Text>
      ) : null}

      <FieldLabel>Pregunta de seguridad</FieldLabel>
      {readOnlyQuestion ? (
        <Text className="mb-4 rounded-md bg-primaryContainer px-3 py-2 text-xs font-semibold text-link">
          {securityQuestion || "No encontramos una pregunta de seguridad."}
        </Text>
      ) : (
        <View className="mb-4 gap-2">
          {SECURITY_QUESTIONS.map((question) => {
            const selected = securityQuestion === question;

            return (
              <Pressable
                key={question}
                className={`rounded-md border px-3 py-2 ${selected ? "border-primary bg-primaryContainer" : "border-separator bg-surfaceElevated"}`}
                onPress={() => onChangeSecurityQuestion(question)}
              >
                <Text className="text-xs text-text ">{question}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FieldLabel>Respuesta</FieldLabel>
      <FormInput
        placeholder="Tu respuesta de seguridad"
        value={securityAnswer}
        onChangeText={onChangeSecurityAnswer}
      />

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Guardando..." : buttonLabel}
      </PrimaryButton>
    </AuthShell>
  );
}

export default SecuritySetupView;
