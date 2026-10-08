import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export function Page({ children }: { children: React.ReactNode }) {
  return <ScrollView className="flex-1 bg-slate-50 dark:bg-black" contentContainerClassName="gap-4 p-5 pb-12" keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
export function Card({ children }: { children: React.ReactNode }) { return <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-slate-900">{children}</View>; }
export function Heading({ children }: { children: React.ReactNode }) { return <Text className="text-xl font-black text-slate-950 dark:text-white">{children}</Text>; }
export function Copy({ children }: { children: React.ReactNode }) { return <Text className="text-base text-slate-600 dark:text-slate-300">{children}</Text>; }
export function ErrorText({ message }: { message: string }) { return message ? <Text accessibilityRole="alert" className="rounded-xl bg-red-50 p-3 font-bold text-red-700">{message}</Text> : null; }
export function Button({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className={`rounded-xl px-4 py-3 ${secondary ? "bg-slate-200 dark:bg-slate-700" : "bg-orange-700"}`} style={{ opacity: disabled ? 0.5 : 1 }}><Text className={`text-center font-bold ${secondary ? "text-slate-900 dark:text-white" : "text-white"}`}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View className="gap-2"><Text className="font-bold text-slate-700 dark:text-slate-200">{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#94a3b8" className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white" {...props} /></View>;
}
export function Choices<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <View className="gap-2"><Copy>{label}</Copy><View className="flex-row flex-wrap gap-2">{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: option.value === value }} onPress={() => onChange(option.value)} className={`rounded-xl border px-3 py-2 ${option.value === value ? "border-orange-700 bg-orange-700" : "border-slate-300 bg-white dark:bg-slate-900"}`}><Text className={option.value === value ? "font-bold text-white" : "font-bold text-slate-700 dark:text-slate-200"}>{option.label}</Text></Pressable>)}</View></View>;
}
export function Loading() { return <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-black"><ActivityIndicator size="large" color="#c2410c" /><Copy>Cargando emprendimiento…</Copy></View>; }
export function errorMessage(cause: unknown) { return cause instanceof Error ? cause.message : "No se pudo completar la operación."; }
