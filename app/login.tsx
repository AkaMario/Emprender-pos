import { SECURITY_QUESTIONS, useAuth } from "@/context/auth";
import {
  getSecurityQuestionByUsername,
  updatePasswordWithSecurityAnswer,
  verifySecurityAnswer,
} from "@/database/auth-database";
import { useDesignColors } from "@/constants/design";
import { ExistingLoginView } from "@/app/view/login/existing-login";
import { PasswordSetupView } from "@/app/view/login/password-setup";
import { PinSetupView } from "@/app/view/login/pin-setup";
import { SecuritySetupView } from "@/app/view/login/security-setup";
import { UsernameSetupView } from "@/app/view/login/username-setup";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";

type SetupStep = "username" | "password" | "pin" | "security";
type LoginMode = "login" | "resetSecurity" | "resetPassword";

export default function LoginScreen() {
  const c = useDesignColors();
  const { hasUser, isAuthenticated, isLoading, login, register } = useAuth();
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>("login");
  const [step, setStep] = useState<SetupStep>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [pin, setPin] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(
    SECURITY_QUESTIONS[0],
  );
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetSecurityQuestion, setResetSecurityQuestion] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  function goTo(nextStep: SetupStep) {
    setError("");
    setStep(nextStep);
  }

  async function handleExistingLogin() {
    if (submitting) return;
    setError("");

    if (!username.trim() || !password) {
      setError("Escribe usuario y contrasena.");
      return;
    }

    setSubmitting(true);

    try {
      await login(username.trim(), password, rememberMe);
      router.replace("/");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo iniciar sesion.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetUsernameChange(value: string) {
    setUsername(value);

    const cleanUsername = value.trim();

    if (!cleanUsername) {
      setResetSecurityQuestion("");
      return;
    }

    const question = await getSecurityQuestionByUsername(cleanUsername);
    setResetSecurityQuestion(question ?? "No encontramos ese usuario.");
  }

  async function handleResetSecurityAnswer() {
    if (submitting) return;
    setError("");

    if (!username.trim() || !securityAnswer.trim()) {
      setError("Escribe username y respuesta de seguridad.");
      return;
    }

    setSubmitting(true);

    try {
      const isValid = await verifySecurityAnswer(
        username.trim(),
        securityAnswer,
      );

      if (!isValid) {
        setError("Respuesta de seguridad incorrecta.");
        return;
      }

      setPassword("");
      setVerifyPassword("");
      setLoginMode("resetPassword");
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

  async function handleResetPassword() {
    if (submitting) return;
    setError("");

    if (!password || !verifyPassword) {
      setError("Escribe y confirma la nueva contrasena.");
      return;
    }

    if (password !== verifyPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      await updatePasswordWithSecurityAnswer(
        username.trim(),
        securityAnswer,
        password,
      );
      setLoginMode("login");
      setPassword("");
      setVerifyPassword("");
      setPin("");
      setSecurityAnswer("");
      setError("");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo cambiar la contrasena.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleUsernameContinue() {
    if (!username.trim()) {
      setError("Escribe el username.");
      return;
    }

    goTo("password");
  }

  function handlePasswordContinue() {
    if (!password || !verifyPassword) {
      setError("Escribe y confirma la contrasena.");
      return;
    }

    if (password !== verifyPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    goTo("pin");
  }

  function handlePinContinue() {
    if (!/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener exactamente 4 digitos.");
      return;
    }

    goTo("security");
  }

  async function handleSetupSubmit() {
    if (submitting) return;
    setError("");

    if (!securityAnswer.trim()) {
      setError("Escribe la respuesta de seguridad.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        username: username.trim(),
        password,
        pin,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
      });
      router.replace("/");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo completar el registro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (hasUser) {
    if (loginMode === "resetSecurity") {
      return (
        <SecuritySetupView
          buttonLabel="Validar respuesta"
          error={error}
          securityAnswer={securityAnswer}
          securityQuestion={resetSecurityQuestion}
          submitting={submitting}
          readOnlyQuestion
          title="Recuperar contrasena"
          onBack={() => {
            setLoginMode("login");
            setError("");
          }}
          onChangeSecurityAnswer={setSecurityAnswer}
          onChangeSecurityQuestion={() => null}
          onSubmit={handleResetSecurityAnswer}
        />
      );
    }

    if (loginMode === "resetPassword") {
      return (
        <PasswordSetupView
          submitting={submitting}
          buttonLabel="Cambiar contrasena"
          error={error}
          password={password}
          title="Nueva contrasena"
          verifyPassword={verifyPassword}
          onBack={() => {
            setLoginMode("resetSecurity");
            setError("");
          }}
          onChangePassword={setPassword}
          onChangeVerifyPassword={setVerifyPassword}
          onContinue={handleResetPassword}
        />
      );
    }

    return (
      <ExistingLoginView
        error={error}
        password={password}
        rememberMe={rememberMe}
        submitting={submitting}
        username={username}
        onChangePassword={setPassword}
        onChangeRememberMe={setRememberMe}
        onChangeUsername={setUsername}
        onForgotPassword={() => {
          if (!username.trim()) {
            setError("Escribe tu username para recuperar la contrasena.");
            return;
          }

          setError("");
          setLoginMode("resetSecurity");
          setPassword("");
          setVerifyPassword("");
          setPin("");
          setSecurityAnswer("");
          handleResetUsernameChange(username);
        }}
        onSubmit={handleExistingLogin}
      />
    );
  }

  if (step === "username") {
    return (
      <UsernameSetupView
        error={error}
        username={username}
        onChangeUsername={setUsername}
        onContinue={handleUsernameContinue}
      />
    );
  }

  if (step === "password") {
    return (
      <PasswordSetupView
        submitting={submitting}
        error={error}
        password={password}
        verifyPassword={verifyPassword}
        onBack={() => goTo("username")}
        onChangePassword={setPassword}
        onChangeVerifyPassword={setVerifyPassword}
        onContinue={handlePasswordContinue}
      />
    );
  }

  if (step === "pin") {
    return (
      <PinSetupView
        error={error}
        pin={pin}
        onBack={() => goTo("password")}
        onChangePin={setPin}
        onContinue={handlePinContinue}
      />
    );
  }

  return (
    <SecuritySetupView
      error={error}
      securityAnswer={securityAnswer}
      securityQuestion={securityQuestion}
      submitting={submitting}
      onBack={() => goTo("pin")}
      onChangeSecurityAnswer={setSecurityAnswer}
      onChangeSecurityQuestion={setSecurityQuestion}
      onSubmit={handleSetupSubmit}
    />
  );
}
