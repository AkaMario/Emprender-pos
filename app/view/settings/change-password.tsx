import { useFormProtection } from "@/hooks/use-form-protection";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { useAuth } from "@/context/auth";
import {
  getSecurityQuestionByUsername,
  updatePasswordWithRecovery,
  verifySecurityAnswer,
  verifyUserPin,
} from "@/database/auth-database";
import { PasswordSetupView } from "@/app/view/login/password-setup";
import { SecuritySetupView } from "@/app/view/login/security-setup";
import { PinAuthView } from "@/components/settings/pin-auth-view";
import { useRouter } from "expo-router";
import React from "react";

type ChangePasswordStep = "pin" | "security" | "password";

export default function ChangePasswordView() {
  const { username } = useAuth();
  const router = useRouter();
  const [step, setStep] = React.useState<ChangePasswordStep>("pin");
  const [authenticatedPin, setAuthenticatedPin] = React.useState("");
  const [securityQuestion, setSecurityQuestion] = React.useState("");
  const [securityAnswer, setSecurityAnswer] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [verifyPassword, setVerifyPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const { dialog, markSaved } = useFormProtection(
    [securityAnswer, newPassword, verifyPassword],
    submitting,
  );

  React.useEffect(() => {
    let mounted = true;

    async function loadQuestion() {
      if (!username) {
        return;
      }

      const question = await getSecurityQuestionByUsername(username);

      if (mounted) {
        setSecurityQuestion(
          question ?? "No encontramos una pregunta de seguridad.",
        );
      }
    }

    loadQuestion();

    return () => {
      mounted = false;
    };
  }, [username]);

  const handleValidatePin = React.useCallback(
    async (currentPin: string) => {
      if (!username) {
        return false;
      }

      const isValid = await verifyUserPin(username, currentPin);

      if (isValid) {
        setAuthenticatedPin(currentPin);
        setStep("security");
      }

      return isValid;
    },
    [username],
  );

  async function handleValidateSecurityAnswer() {
    if (submitting) return;
    if (!username) {
      return;
    }

    if (!securityAnswer.trim()) {
      setError("Escribe la respuesta de seguridad.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const isValid = await verifySecurityAnswer(username, securityAnswer);

      if (!isValid) {
        setError("Respuesta de seguridad incorrecta.");
        return;
      }

      setStep("password");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo validar la respuesta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSavePassword() {
    if (submitting) return;
    if (!username) {
      return;
    }

    if (!newPassword || !verifyPassword) {
      setError("Escribe y confirma la nueva contraseña.");
      return;
    }

    if (newPassword !== verifyPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await updatePasswordWithRecovery(
        username,
        authenticatedPin,
        securityAnswer,
        newPassword,
      );
      markSaved();
      Alert.alert("Listo", "Contraseña actualizada.");
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "pin") {
    return (
      <>
        {dialog}
        <PinAuthView
          title="Ingresa tu PIN"
          description="Valida tu PIN para cambiar la contraseña."
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          onValidate={handleValidatePin}
        />
      </>
    );
  }

  if (step === "security") {
    return (
      <>
        {dialog}
        <SecuritySetupView
          buttonLabel="Validar respuesta"
          error={error}
          readOnlyQuestion
          securityAnswer={securityAnswer}
          securityQuestion={securityQuestion}
          submitting={submitting}
          title="Cambiar contraseña"
          onBack={() => {
            setError("");
            setAuthenticatedPin("");
            setStep("pin");
          }}
          onChangeSecurityAnswer={setSecurityAnswer}
          onChangeSecurityQuestion={() => null}
          onSubmit={handleValidateSecurityAnswer}
        />
      </>
    );
  }

  return (
    <>
      {dialog}
      <PasswordSetupView
        submitting={submitting}
        buttonLabel={submitting ? "Guardando..." : "Guardar contraseña"}
        error={error}
        password={newPassword}
        title="Nueva contraseña"
        verifyPassword={verifyPassword}
        onBack={() => {
          setError("");
          setStep("security");
        }}
        onChangePassword={setNewPassword}
        onChangeVerifyPassword={setVerifyPassword}
        onContinue={handleSavePassword}
      />
    </>
  );
}
