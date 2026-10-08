import { useBusiness } from "@/context/business";
import { BusinessOperations } from "@/components/business/operations";
import { PreparationScreen } from "@/components/business/preparation";
export default function Operations() {
  return useBusiness().isRestaurant ? (
    <PreparationScreen />
  ) : (
    <BusinessOperations />
  );
}
