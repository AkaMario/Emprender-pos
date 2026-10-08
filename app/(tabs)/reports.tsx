import { ReportsScreen } from "@/components/reports/reports-screen";
import { useBusiness } from "@/context/business";
import { BusinessOverview } from "@/components/business/overview";

export default function Reports() {
  return useBusiness().isRestaurant ? (
    <ReportsScreen />
  ) : (
    <BusinessOverview reports />
  );
}
