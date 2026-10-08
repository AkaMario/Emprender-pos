import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { useBusiness } from "@/context/business";
import { BusinessOverview } from "@/components/business/overview";

export default function Dashboard() {
  return useBusiness().isRestaurant ? <HomeDashboard /> : <BusinessOverview />;
}
