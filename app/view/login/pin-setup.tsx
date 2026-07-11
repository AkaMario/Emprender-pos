import { ErrorMessage } from "@/components/login/auth-ui";
import React from "react";
import { Pressable, Text, View } from "react-native";

type PinSetupViewProps = {
  error: string;
  pin: string;
  onBack: () => void;
  onChangePin: (value: string) => void;
  onContinue: () => void;
};

export function PinSetupView({
  error,
  pin,
  onBack,
  onChangePin,
  onContinue,
}: PinSetupViewProps) {
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

export default PinSetupView;
