import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { getBusinessProfile, selectBusiness } from "@/database/business-database";
import { BUSINESS_MODELS, type BusinessProfile } from "@/domain/business";

type BusinessContextValue = {
  profile: BusinessProfile | null; isLoading: boolean; error: string;
  choose: (profile: BusinessProfile) => Promise<void>; reload: () => Promise<void>;
};
const BusinessContext = createContext<BusinessContextValue | null>(null);
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setError(""); setLoading(true);
    try { setProfile(await getBusinessProfile()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el negocio."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    if (!isAuthenticated) { setProfile(null); setError(""); setLoading(false); return; }
    setLoading(true);
    getBusinessProfile().then((value) => { if (mounted) { setProfile(value); setError(""); } })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el negocio."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [authLoading, isAuthenticated]);
  async function choose(value: BusinessProfile) {
    await selectBusiness(value);
    await reload();
  }
  return <BusinessContext.Provider value={{ profile, isLoading: authLoading || isLoading, error, choose, reload }}>{children}</BusinessContext.Provider>;
}
export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("useBusiness requiere BusinessProvider.");
  return { ...value, definition: value.profile ? BUSINESS_MODELS[value.profile.model] : null, isRestaurant: value.profile?.model === "restaurant" };
}
