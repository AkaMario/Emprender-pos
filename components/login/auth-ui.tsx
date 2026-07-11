import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const Logo = require("@/assets/images/Logo.png");

export const BRAND_RED = "#c2411f";
export const BRAND_GREEN = "#2f7d3b";

export function BrandLogo() {
  return (
    <View className="items-center">
      <Image source={Logo} className="" resizeMode="contain" />
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 text-[10px] font-bold uppercase text-slate-700">
      {children}
    </Text>
  );
}

export function FormInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      className="mb-4 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900"
      placeholderTextColor="#9ca3af"
    />
  );
}

export function PrimaryButton({
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
      <Text className="text-center text-xs font-black uppercase text-white">
        {children}
      </Text>
    </Pressable>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-10 py-10"
        contentContainerStyle={{ paddingBottom: keyboardVisible ? 360 : 40 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-10">
          <BrandLogo />
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <Text className="mb-4 text-xs font-semibold text-rose-600">{message}</Text>
  );
}
