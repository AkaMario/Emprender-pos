import { SECURITY_QUESTIONS, useAuth } from "@/context/auth";
import {
  exportDatabaseFile,
  updatePasswordWithRecovery,
  updatePinWithSecurityAnswer,
  updateSecurityQuestionWithPin,
} from "@/database/auth-database";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export const unstable_settings = {
  initialRouteName: "index",
};

type CredentialMode = "password" | "pin" | "security" | null;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1 text-xs font-bold uppercase text-slate-600">
      {children}
    </Text>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      className="mb-3 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900"
      placeholderTextColor="#94a3b8"
    />
  );
}

function Button({
  children,
  color = "bg-slate-700",
  disabled,
  onPress,
}: {
  children: React.ReactNode;
  color?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`${color} rounded-md px-4 py-3`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.65 : 1 },
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Text className="text-center font-bold text-white">{children}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const { logout, username } = useAuth();
  const [exporting, setExporting] = React.useState(false);
  const [mode, setMode] = React.useState<CredentialMode>(null);
  const [saving, setSaving] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [securityAnswer, setSecurityAnswer] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [verifyPassword, setVerifyPassword] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [newSecurityQuestion, setNewSecurityQuestion] = React.useState(
    SECURITY_QUESTIONS[0],
  );
  const [newSecurityAnswer, setNewSecurityAnswer] = React.useState("");

  function resetCredentialForm(nextMode: CredentialMode = null) {
    setMode(nextMode);
    setPin("");
    setSecurityAnswer("");
    setNewPassword("");
    setVerifyPassword("");
    setNewPin("");
    setNewSecurityQuestion(SECURITY_QUESTIONS[0]);
    setNewSecurityAnswer("");
  }

  async function handleExportDatabase() {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "La exportacion de archivos locales no esta disponible en web.",
      );
      return;
    }

    setExporting(true);

    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          "No disponible",
          "Este dispositivo no puede compartir archivos.",
        );
        return;
      }

      const fileUri = await exportDatabaseFile();

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Exportar base de datos POS",
        mimeType: "application/vnd.sqlite3",
        UTI: "public.database",
      });
    } catch (error) {
      Alert.alert(
        "Error al exportar",
        error instanceof Error
          ? error.message
          : "No se pudo exportar la base de datos.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleChangePassword() {
    if (!username) {
      return;
    }

    if (!/^\d{4}$/.test(pin) || !securityAnswer.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Escribe el PIN de 4 digitos y la respuesta de seguridad.",
      );
      return;
    }

    if (!newPassword || newPassword !== verifyPassword) {
      Alert.alert(
        "Contrasena invalida",
        "La nueva contrasena y su verificacion deben coincidir.",
      );
      return;
    }

    setSaving(true);

    try {
      await updatePasswordWithRecovery(
        username,
        pin,
        securityAnswer,
        newPassword,
      );
      resetCredentialForm();
      Alert.alert("Listo", "Contrasena actualizada.");
    } catch (error) {
      Alert.alert(
        "No se pudo cambiar",
        error instanceof Error ? error.message : "Intentalo nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePin() {
    if (!username) {
      return;
    }

    if (!securityAnswer.trim() || !/^\d{4}$/.test(newPin)) {
      Alert.alert(
        "Datos incompletos",
        "Escribe la respuesta de seguridad y un PIN nuevo de 4 digitos.",
      );
      return;
    }

    setSaving(true);

    try {
      await updatePinWithSecurityAnswer(username, securityAnswer, newPin);
      resetCredentialForm();
      Alert.alert("Listo", "PIN actualizado.");
    } catch (error) {
      Alert.alert(
        "No se pudo cambiar",
        error instanceof Error ? error.message : "Intentalo nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeSecurityQuestion() {
    if (!username) {
      return;
    }

    if (!/^\d{4}$/.test(pin) || !newSecurityAnswer.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Escribe el PIN actual y la nueva respuesta.",
      );
      return;
    }

    setSaving(true);

    try {
      await updateSecurityQuestionWithPin(
        username,
        pin,
        newSecurityQuestion,
        newSecurityAnswer,
      );
      resetCredentialForm();
      Alert.alert("Listo", "Pregunta de seguridad actualizada.");
    } catch (error) {
      Alert.alert(
        "No se pudo cambiar",
        error instanceof Error ? error.message : "Intentalo nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="px-6 py-8"
    >
      <View className="mb-8 items-center">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </Text>
        {username ? (
          <Text className="mt-2 text-gray-500">Sesion: {username}</Text>
        ) : null}
      </View>

      <View className="mb-6 gap-3">
        <Pressable
          className="px-4 py-2 rounded-md"
          onPress={() =>
            resetCredentialForm(mode === "password" ? null : "password")
          }
        >
          <Text className="text-black">Cambiar contrasena</Text>
        </Pressable>
        <Pressable
          className="px-4 py-2 rounded-md"
          onPress={() => resetCredentialForm(mode === "pin" ? null : "pin")}
        >
          <Text className="text-black">Cambiar PIN</Text>
        </Pressable>
        <Pressable
          className="px-4 py-2 rounded-md"
          onPress={() =>
            resetCredentialForm(mode === "security" ? null : "security")
          }
        >
          <Text className="text-black">Cambiar pregunta de seguridad</Text>
        </Pressable>
      </View>

      {mode === "password" ? (
        <View className="mb-6 rounded-xl border border-slate-200 p-4">
          <Text className="mb-4 text-lg font-bold text-slate-900">
            Cambiar contrasena
          </Text>
          <Label>PIN actual</Label>
          <Input
            keyboardType="number-pad"
            maxLength={4}
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, ""))}
          />
          <Label>Respuesta de seguridad</Label>
          <Input value={securityAnswer} onChangeText={setSecurityAnswer} />
          <Label>Nueva contrasena</Label>
          <Input
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Label>Verificar contrasena</Label>
          <Input
            secureTextEntry
            value={verifyPassword}
            onChangeText={setVerifyPassword}
          />
          <Button disabled={saving} onPress={handleChangePassword}>
            {saving ? "Guardando..." : "Guardar contrasena"}
          </Button>
        </View>
      ) : null}

      {mode === "pin" ? (
        <View className="mb-6 rounded-xl border border-slate-200 p-4">
          <Text className="mb-4 text-lg font-bold text-slate-900">
            Cambiar PIN
          </Text>
          <Label>Respuesta de seguridad</Label>
          <Input value={securityAnswer} onChangeText={setSecurityAnswer} />
          <Label>Nuevo PIN</Label>
          <Input
            keyboardType="number-pad"
            maxLength={4}
            value={newPin}
            onChangeText={(value) => setNewPin(value.replace(/\D/g, ""))}
          />
          <Button disabled={saving} onPress={handleChangePin}>
            {saving ? "Guardando..." : "Guardar PIN"}
          </Button>
        </View>
      ) : null}

      {mode === "security" ? (
        <View className="mb-6 rounded-xl border border-slate-200 p-4">
          <Text className="mb-4 text-lg font-bold text-slate-900">
            Cambiar pregunta
          </Text>
          <Label>PIN actual</Label>
          <Input
            keyboardType="number-pad"
            maxLength={4}
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, ""))}
          />
          <Label>Nueva pregunta</Label>
          <View className="mb-3 gap-2">
            {SECURITY_QUESTIONS.map((question) => {
              const selected = question === newSecurityQuestion;

              return (
                <Pressable
                  key={question}
                  className={`rounded-md border px-3 py-2 ${selected ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-slate-100"}`}
                  onPress={() => setNewSecurityQuestion(question)}
                >
                  <Text className="text-xs text-slate-700">{question}</Text>
                </Pressable>
              );
            })}
          </View>
          <Label>Nueva respuesta</Label>
          <Input
            value={newSecurityAnswer}
            onChangeText={setNewSecurityAnswer}
          />
          <Button disabled={saving} onPress={handleChangeSecurityQuestion}>
            {saving ? "Guardando..." : "Guardar pregunta"}
          </Button>
        </View>
      ) : null}

      <View className="gap-3">
        <Button
          color="bg-emerald-600"
          disabled={exporting}
          onPress={handleExportDatabase}
        >
          {exporting ? "Exportando..." : "Exportar base de datos"}
        </Button>

        <Button color="bg-rose-500" onPress={logout}>
          Cerrar sesion
        </Button>
      </View>
    </ScrollView>
  );
}
