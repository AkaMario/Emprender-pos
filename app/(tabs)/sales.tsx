import { TutorialScreen } from "@/context/tutorial";
import { PosScreen } from "@/components/sales/pos-screen";
import { useBusiness } from "@/context/business";
import { BusinessPos } from "@/components/business/pos";

export default function Sales() {
  return <TutorialScreen id="sales">{useBusiness().isRestaurant ? <PosScreen /> : <BusinessPos />}</TutorialScreen>;
}
