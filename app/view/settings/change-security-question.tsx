import { SecuritySetupView } from "@/app/view/login/security-setup";
import { SECURITY_QUESTIONS, useAuth } from "@/context/auth";
import { updateSecurityQuestionWithPin, verifyUserPin } from "@/database/auth-database";
import { PinAuthView } from "@/components/settings/pin-auth-view";
import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";

export default function ChangeSecurityQuestionView() {
  const { username } = useAuth();
  const router = useRouter();
  const [authenticatedPin, setAuthenticatedPin] = React.useState("");
  const [newSecurityQuestion, setNewSecurityQuestion] = React.useState(SECURITY_QUESTIONS[0]);
  const [newSecurityAnswer, setNewSecurityAnswer] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const handleValidatePin = React.useCallback(
    async (currentPin: string) => {
      if (!username) {
        return false;
      }

      const isValid = await verifyUserPin(username, currentPin);

      if (isValid) {
        setAuthenticatedPin(currentPin);
      }

      return isValid;
    },
    [username],
  );

  async function handleSave() {
    if (!username) {
      return;
    }

    if (!authenticatedPin || !newSecurityAnswer.trim()) {
      setError("Escribe la nueva respuesta.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await updateSecurityQuestionWithPin(username, authenticatedPin, newSecurityQuestion, newSecurityAnswer);
      Alert.alert("Listo", "Pregunta de seguridad actualizada.");
      router.back();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo cambiar la pregunta.");
    } finally {
      setSaving(false);
    }
  }

  if (!authenticatedPin) {
    return (
      <PinAuthView
        title="Ingresa tu PIN"
        description="Valida tu PIN para cambiar la pregunta de seguridad."
        onBack={() => router.back()}
        onValidate={handleValidatePin}
      />
    );
  }

  return (
    <SecuritySetupView
      buttonLabel="Guardar pregunta"
      error={error}
      securityAnswer={newSecurityAnswer}
      securityQuestion={newSecurityQuestion}
      submitting={saving}
      title="Cambiar pregunta"
      onBack={() => router.back()}
      onChangeSecurityAnswer={(value) => {
        setError("");
        setNewSecurityAnswer(value);
      }}
      onChangeSecurityQuestion={setNewSecurityQuestion}
      onSubmit={handleSave}
    />
  );
}
