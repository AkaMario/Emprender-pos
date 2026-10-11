import { TutorialScreen } from "@/context/tutorial";
import { MenuScreen } from "@/components/menu/menu-screen";
import { useBusiness } from "@/context/business";
import { BusinessCatalog } from "@/components/business/catalog";

export default function Menu() {
  return <TutorialScreen id="menu">{useBusiness().isRestaurant ? <MenuScreen /> : <BusinessCatalog />}</TutorialScreen>;
}
