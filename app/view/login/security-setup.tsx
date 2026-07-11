import { SECURITY_QUESTIONS } from "@/context/auth";
import { AuthShell, ErrorMessage, FieldLabel, FormInput, PrimaryButton } from "@/components/login/auth-ui";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
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
  buttonLabel = "Continue",
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
        <Ionicons
              name="arrow-back-outline"
              size={20}
              className="text-black dark:text-white"
            />
            {/* <Text
              className="text-lg font-bold text-center"
            >
              Regresar
            </Text> */}
      </Pressable>

      {title ? <Text className="mb-5 text-xl font-black text-slate-900">{title}</Text> : null}

      <FieldLabel>Pregunta de seguridad</FieldLabel>
      {readOnlyQuestion ? (
        <Text className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
          {securityQuestion || "No encontramos una pregunta de seguridad."}
        </Text>
      ) : (
        <View className="mb-4 gap-2">
          {SECURITY_QUESTIONS.map((question) => {
            const selected = securityQuestion === question;

            return (
              <Pressable
                key={question}
                className={`rounded-md border px-3 py-2 ${selected ? "border-green-700 bg-green-50" : "border-slate-200 bg-slate-100"}`}
                onPress={() => onChangeSecurityQuestion(question)}
              >
                <Text className="text-xs text-slate-700">{question}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FieldLabel>Respuesta</FieldLabel>
      <FormInput placeholder="INPUT" value={securityAnswer} onChangeText={onChangeSecurityAnswer} />

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Guardando..." : buttonLabel}
      </PrimaryButton>
    </AuthShell>
  );
}

export default SecuritySetupView;
