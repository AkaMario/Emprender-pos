import { PosScreen } from "@/components/sales/pos-screen";
import { useBusiness } from "@/context/business";
import { BusinessPos } from "@/components/business/pos";

export default function Sales() {
  return useBusiness().isRestaurant ? <PosScreen /> : <BusinessPos />;
}
