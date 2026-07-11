import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

type PinAuthViewProps = {
  title?: string;
  description?: string;
  onBack: () => void;
  onValidate: (pin: string) => Promise<boolean>;
};

export function PinAuthView({
  title = "Ingresa tu PIN",
  description = "Valida tu identidad para continuar.",
  onBack,
  onValidate,
}: PinAuthViewProps) {
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [validating, setValidating] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function validatePin() {
      if (pin.length !== 4 || validating) {
        return;
      }

      setError("");
      setValidating(true);

      try {
        const isValid = await onValidate(pin);

        if (!active) {
          return;
        }

        if (!isValid) {
          setError("PIN incorrecto.");
          setPin("");
        }
      } catch (currentError) {
        if (!active) {
          return;
        }

        setError(currentError instanceof Error ? currentError.message : "PIN incorrecto.");
        setPin("");
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }

    validatePin();

    return () => {
      active = false;
    };
  }, [onValidate, pin, validating]);

  function addDigit(value: string) {
    if (!validating && pin.length < 4) {
      setPin(`${pin}${value}`);
    }
  }

  function removeDigit() {
    if (!validating) {
      setPin(pin.slice(0, -1));
    }
  }

  return (
    <View className="flex-1 bg-orange-800">
      <View className="px-6 pt-12">
        <Pressable className="mb-8 flex-row items-center gap-3" onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
          <Text className="text-lg font-bold text-white">Regresar</Text>
        </Pressable>

        <Text className="text-xl font-black text-white">{title}</Text>
        <Text className="mt-1 max-w-64 text-base font-semibold leading-5 text-white">
          {validating ? "Validando..." : description}
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

        {error ? <Text className="mt-4 text-sm font-bold text-white">{error}</Text> : null}
      </View>

      <View className="mt-auto rounded-t-3xl bg-white px-10 py-8">
        <View className="flex-row flex-wrap justify-between">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Pressable key={digit} className="mb-7 w-1/3 items-center" onPress={() => addDigit(digit)}>
              <Text className="text-2xl font-bold text-slate-600">{digit}</Text>
            </Pressable>
          ))}
          <Pressable className="w-1/3 items-center" onPress={() => setPin("")}> 
            <Text className="text-3xl text-slate-600">×</Text>
          </Pressable>
          <Pressable className="w-1/3 items-center" onPress={() => addDigit("0")}> 
            <Text className="text-2xl font-bold text-slate-600">0</Text>
          </Pressable>
          <Pressable className="w-1/3 items-center" onPress={removeDigit}> 
            <Text className="text-2xl text-slate-600">⌫</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
