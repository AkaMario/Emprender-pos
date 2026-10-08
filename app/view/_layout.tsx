import { Redirect, Stack, usePathname } from "expo-router";
import { useBusiness } from "@/context/business";

// Guard direct links as well as menu navigation into restaurant-only flows.
export default function ViewLayout() {
  const { isRestaurant } = useBusiness();
  const path = usePathname();
  if (path.startsWith("/view/login/")) return <Redirect href="/" />;
  const restaurantOnly = /\/view\/(menu|inventory|category)\//.test(path) || /\/view\/dashboard\/(supply-entry|stock-out|new-dish|alerts)$/.test(path);
  if (!isRestaurant && restaurantOnly) return <Redirect href="/" />;
  if (isRestaurant && path.startsWith("/view/business/")) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
