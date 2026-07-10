import React from "react";
import {Text, View} from "react-native";
export const unstable_settings = {
  initialRouteName: "index",
};

export default function Settings() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text>Settings</Text>
    </View>

  );
}
