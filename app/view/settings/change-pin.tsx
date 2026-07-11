import { PinSetupView } from "@/app/view/login/pin-setup";
import { SecuritySetupView } from "@/app/view/login/security-setup";
import { useAuth } from "@/context/auth";
import {
  getSecurityQuestionByUsername,
  updatePinWithSecurityAnswer,
  verifySecurityAnswer,
} from "@/database/auth-database";
import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";

export default function ChangePinView() {
  const { username } = useAuth();
  const router = useRouter();
  const [securityQuestion, setSecurityQuestion] = React.useState("");
  const [securityAnswer, setSecurityAnswer] = React.useState("");
  const [authenticatedAnswer, setAuthenticatedAnswer] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [validating, setValidating] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function loadQuestion() {
      if (!username) {
        return;
      }

      const question = await getSecurityQuestionByUsername(username);

      if (mounted) {
        setSecurityQuestion(question ?? "No encontramos una pregunta de seguridad.");
      }
    }

    loadQuestion();

    return () => {
      mounted = false;
    };
  }, [username]);

  async function handleValidateSecurityAnswer() {
    if (!username) {
      return;
    }

    if (!securityAnswer.trim()) {
      setError("Escribe la respuesta de seguridad.");
      return;
    }

    setError("");
    setValidating(true);

    try {
      const isValid = await verifySecurityAnswer(username, securityAnswer);

      if (!isValid) {
        setError("Respuesta de seguridad incorrecta.");
        return;
      }

      setAuthenticatedAnswer(securityAnswer);
      setError("");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo validar la respuesta.");
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    if (!username) {
      return;
    }

    if (!authenticatedAnswer || !/^\d{4}$/.test(newPin)) {
      setError("El PIN debe tener exactamente 4 digitos.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await updatePinWithSecurityAnswer(username, authenticatedAnswer, newPin);
      Alert.alert("Listo", "PIN actualizado.");
      router.back();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo cambiar el PIN.");
    } finally {
      setSaving(false);
    }
  }

  if (!authenticatedAnswer) {
    return (
      <SecuritySetupView
        buttonLabel="Validar respuesta"
        error={error}
        readOnlyQuestion
        securityAnswer={securityAnswer}
        securityQuestion={securityQuestion}
        submitting={validating}
        title="Cambiar PIN"
        onBack={() => router.back()}
        onChangeSecurityAnswer={setSecurityAnswer}
        onChangeSecurityQuestion={() => null}
        onSubmit={handleValidateSecurityAnswer}
      />
    );
  }

  return (
    <PinSetupView
      error={error}
      pin={newPin}
      onBack={() => router.back()}
      onChangePin={(value) => {
        setError("");
        setNewPin(value);
      }}
      onContinue={saving ? () => null : handleSave}
    />
  );
}
