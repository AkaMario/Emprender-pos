import { SECURITY_QUESTIONS, useAuth } from "@/context/auth";
import {
  getSecurityQuestionByUsername,
  updatePasswordWithRecovery,
} from "@/database/auth-database";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type SetupStep = "username" | "password" | "pin" | "security";
type LoginMode = "login" | "resetPassword";

const BRAND_RED = "#c2411f";
const BRAND_GREEN = "#2f7d3b";

function BrandLogo() {
  return (
    <View className="items-center">
      <Text className="text-center text-4xl font-black uppercase" style={{ color: BRAND_RED }}>
        COCTELERIA
      </Text>
      <Text className="-mt-2 text-center text-3xl font-black uppercase" style={{ color: BRAND_GREEN }}>
        ISLA PUNTARENA
      </Text>
      <Text className="-mt-1 text-center text-xl font-black uppercase text-slate-500">
        DESDE 1998
      </Text>
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 text-[10px] font-bold uppercase text-slate-700">{children}</Text>;
}

function FormInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      className="mb-4 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900"
      placeholderTextColor="#9ca3af"
    />
  );
}

function PrimaryButton({
  children,
  disabled,
  onPress,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded-lg px-4 py-3 ${disabled ? "bg-orange-800" : "bg-orange-700"}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Text className="text-center text-xs font-black uppercase text-white">{children}</Text>
    </Pressable>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-10 py-10">
        <View className="mb-10">
          <BrandLogo />
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorMessage({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return <Text className="mb-4 text-xs font-semibold text-rose-600">{message}</Text>;
}

function ExistingLoginView({
  error,
  password,
  submitting,
  username,
  onChangePassword,
  onChangeUsername,
  onForgotPassword,
  onSubmit,
}: {
  error: string;
  password: string;
  submitting: boolean;
  username: string;
  onChangePassword: (value: string) => void;
  onChangeUsername: (value: string) => void;
  onForgotPassword: () => void;
  onSubmit: () => void;
}) {
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

      <View className="mt-4 flex-row items-center gap-2">
        <View className="h-3 w-3 border border-green-700" />
        <Text className="text-xs text-green-700">Recuerdame</Text>
      </View>
    </AuthShell>
  );
}

function ResetPasswordView({
  error,
  newPassword,
  pin,
  securityAnswer,
  securityQuestion,
  submitting,
  username,
  verifyPassword,
  onBack,
  onChangeNewPassword,
  onChangePin,
  onChangeSecurityAnswer,
  onChangeUsername,
  onChangeVerifyPassword,
  onSubmit,
}: {
  error: string;
  newPassword: string;
  pin: string;
  securityAnswer: string;
  securityQuestion: string;
  submitting: boolean;
  username: string;
  verifyPassword: string;
  onBack: () => void;
  onChangeNewPassword: (value: string) => void;
  onChangePin: (value: string) => void;
  onChangeSecurityAnswer: (value: string) => void;
  onChangeUsername: (value: string) => void;
  onChangeVerifyPassword: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <AuthShell>
      <Pressable className="mb-6" onPress={onBack}>
        <Text className="text-2xl text-slate-700">‹</Text>
      </Pressable>

      <FieldLabel>Username</FieldLabel>
      <FormInput autoCapitalize="none" placeholder="Placeholder" value={username} onChangeText={onChangeUsername} />

      <FieldLabel>PIN</FieldLabel>
      <FormInput
        keyboardType="number-pad"
        maxLength={4}
        placeholder="0000"
        value={pin}
        onChangeText={(value) => onChangePin(value.replace(/\D/g, ""))}
      />

      <FieldLabel>Pregunta de seguridad</FieldLabel>
      <Text className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
        {securityQuestion || "Escribe tu username para ver la pregunta."}
      </Text>

      <FieldLabel>Respuesta</FieldLabel>
      <FormInput placeholder="INPUT" value={securityAnswer} onChangeText={onChangeSecurityAnswer} />

      <FieldLabel>Nueva contrasena</FieldLabel>
      <FormInput secureTextEntry placeholder="********" value={newPassword} onChangeText={onChangeNewPassword} />

      <FieldLabel>Verificar contrasena</FieldLabel>
      <FormInput secureTextEntry placeholder="********" value={verifyPassword} onChangeText={onChangeVerifyPassword} />

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Guardando..." : "Cambiar contrasena"}
      </PrimaryButton>
    </AuthShell>
  );
}

function UsernameSetupView({
  error,
  username,
  onChangeUsername,
  onContinue,
}: {
  error: string;
  username: string;
  onChangeUsername: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <AuthShell>
      <FieldLabel>Username</FieldLabel>
      <FormInput autoCapitalize="none" placeholder="Placeholder" value={username} onChangeText={onChangeUsername} />
      <ErrorMessage message={error} />
      <PrimaryButton onPress={onContinue}>Continue</PrimaryButton>
    </AuthShell>
  );
}

function PasswordSetupView({
  error,
  password,
  verifyPassword,
  onBack,
  onChangePassword,
  onChangeVerifyPassword,
  onContinue,
}: {
  error: string;
  password: string;
  verifyPassword: string;
  onBack: () => void;
  onChangePassword: (value: string) => void;
  onChangeVerifyPassword: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <AuthShell>
      <Pressable className="mb-6" onPress={onBack}>
        <Text className="text-2xl text-slate-700">‹</Text>
      </Pressable>

      <FieldLabel>New password</FieldLabel>
      <FormInput secureTextEntry placeholder="**************" value={password} onChangeText={onChangePassword} />

      <FieldLabel>Verify password</FieldLabel>
      <FormInput secureTextEntry placeholder="**************" value={verifyPassword} onChangeText={onChangeVerifyPassword} />

      <ErrorMessage message={error} />
      <PrimaryButton onPress={onContinue}>Continue</PrimaryButton>
    </AuthShell>
  );
}

function PinSetupView({
  error,
  pin,
  onBack,
  onChangePin,
  onContinue,
}: {
  error: string;
  pin: string;
  onBack: () => void;
  onChangePin: (value: string) => void;
  onContinue: () => void;
}) {
  function addDigit(value: string) {
    if (pin.length < 4) {
      onChangePin(`${pin}${value}`);
    }
  }

  function removeDigit() {
    onChangePin(pin.slice(0, -1));
  }

  return (
    <View className="flex-1 bg-orange-800">
      <View className="px-6 pt-12">
        <Pressable className="mb-8" onPress={onBack}>
          <Text className="text-4xl text-white">‹</Text>
        </Pressable>

        <Text className="text-xl font-black text-white">Enter you new PIN</Text>
        <Text className="mt-1 max-w-48 text-base font-semibold leading-5 text-white">
          Para confirmar cosas importantes
        </Text>

        <View className="mt-24 flex-row justify-between">
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              className={`h-12 w-16 items-center justify-center border-b-2 ${
                pin.length > index ? "border-white" : "border-orange-300"
              }`}
            >
              <Text className="text-2xl font-bold text-white">{pin[index] ?? ""}</Text>
            </View>
          ))}
        </View>
        <ErrorMessage message={error} />
      </View>

      <View className="mt-auto rounded-t-3xl bg-white px-10 py-8">
        <View className="flex-row flex-wrap justify-between">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Pressable key={digit} className="mb-7 w-1/3 items-center" onPress={() => addDigit(digit)}>
              <Text className="text-2xl font-bold text-slate-600">{digit}</Text>
            </Pressable>
          ))}
          <Pressable className="w-1/3 items-center" onPress={() => onChangePin("")}> 
            <Text className="text-3xl text-slate-600">×</Text>
          </Pressable>
          <Pressable className="w-1/3 items-center" onPress={() => addDigit("0")}> 
            <Text className="text-2xl font-bold text-slate-600">0</Text>
          </Pressable>
          <Pressable className="w-1/3 items-center" onPress={removeDigit}> 
            <Text className="text-2xl text-slate-600">⌫</Text>
          </Pressable>
        </View>

        <Pressable className="mt-8" onPress={onContinue}>
          <Text className="text-center text-xs font-black uppercase text-orange-800">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SecuritySetupView({
  error,
  securityAnswer,
  securityQuestion,
  submitting,
  onBack,
  onChangeSecurityAnswer,
  onChangeSecurityQuestion,
  onSubmit,
}: {
  error: string;
  securityAnswer: string;
  securityQuestion: string;
  submitting: boolean;
  onBack: () => void;
  onChangeSecurityAnswer: (value: string) => void;
  onChangeSecurityQuestion: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <AuthShell>
      <Pressable className="mb-6" onPress={onBack}>
        <Text className="text-2xl text-slate-700">‹</Text>
      </Pressable>

      <FieldLabel>Pregunta de seguridad</FieldLabel>
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

      <FieldLabel>Respuesta</FieldLabel>
      <FormInput placeholder="INPUT" value={securityAnswer} onChangeText={onChangeSecurityAnswer} />

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting} onPress={onSubmit}>
        {submitting ? "Guardando..." : "Continue"}
      </PrimaryButton>
    </AuthShell>
  );
}

export default function LoginScreen() {
  const { hasUser, isLoading, login, register } = useAuth();
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>("login");
  const [step, setStep] = useState<SetupStep>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [pin, setPin] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetSecurityQuestion, setResetSecurityQuestion] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function goTo(nextStep: SetupStep) {
    setError("");
    setStep(nextStep);
  }

  async function handleExistingLogin() {
    setError("");

    if (!username.trim() || !password) {
      setError("Escribe usuario y contrasena.");
      return;
    }

    setSubmitting(true);

    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo iniciar sesion.");
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

  async function handleResetPassword() {
    setError("");

    if (!username.trim() || !/^\d{4}$/.test(pin) || !securityAnswer.trim()) {
      setError("Escribe username, PIN de 4 digitos y respuesta.");
      return;
    }

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
      await updatePasswordWithRecovery(username.trim(), pin, securityAnswer, password);
      setLoginMode("login");
      setPassword("");
      setVerifyPassword("");
      setPin("");
      setSecurityAnswer("");
      setError("");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo cambiar la contrasena.");
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
      setError(currentError instanceof Error ? currentError.message : "No se pudo completar el registro.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={BRAND_RED} />
      </View>
    );
  }

  if (hasUser) {
    if (loginMode === "resetPassword") {
      return (
        <ResetPasswordView
          error={error}
          newPassword={password}
          pin={pin}
          securityAnswer={securityAnswer}
          securityQuestion={resetSecurityQuestion}
          submitting={submitting}
          username={username}
          verifyPassword={verifyPassword}
          onBack={() => {
            setLoginMode("login");
            setError("");
          }}
          onChangeNewPassword={setPassword}
          onChangePin={setPin}
          onChangeSecurityAnswer={setSecurityAnswer}
          onChangeUsername={handleResetUsernameChange}
          onChangeVerifyPassword={setVerifyPassword}
          onSubmit={handleResetPassword}
        />
      );
    }

    return (
      <ExistingLoginView
        error={error}
        password={password}
        submitting={submitting}
        username={username}
        onChangePassword={setPassword}
        onChangeUsername={setUsername}
        onForgotPassword={() => {
          setError("");
          setLoginMode("resetPassword");
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
