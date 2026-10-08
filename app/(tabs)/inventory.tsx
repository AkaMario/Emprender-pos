import { InventoryScreen } from "@/components/inventory/inventory-screen";
import { useBusiness } from "@/context/business";
import { BusinessCatalog } from "@/components/business/catalog";
import { BusinessOperations } from "@/components/business/operations";

export default function Inventory() {
  const { isRestaurant, profile } = useBusiness();
  return isRestaurant ? <InventoryScreen /> : profile?.model === "services" ? <BusinessOperations /> : <BusinessCatalog inventory />;
}
