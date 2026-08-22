import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { fetchMyStores, fetchProgram } from "@/lib/api";

const ACTIVE_STORE_KEY = "fello.active_store";

/**
 * Merchant store context: the list of stores owned by the signed-in merchant,
 * the currently selected one, and its loyalty program.
 */
export function useMerchantStore() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  const stores = useQuery({
    queryKey: ["my-stores", user?.id],
    queryFn: () => fetchMyStores(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (activeId || !stores.data?.length) return;
    const saved =
      typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_STORE_KEY);
    const match = stores.data.find((store) => store.id === saved);
    setActiveId(match?.id ?? stores.data[0]!.id);
  }, [stores.data, activeId]);

  const store = stores.data?.find((item) => item.id === activeId) ?? null;

  const program = useQuery({
    queryKey: ["program", store?.id],
    queryFn: () => fetchProgram(store!.id),
    enabled: Boolean(store?.id),
  });

  const selectStore = (id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_STORE_KEY, id);
  };

  return {
    stores: stores.data ?? [],
    store,
    program: program.data ?? null,
    loading: stores.isLoading || (Boolean(store) && program.isLoading),
    selectStore,
  };
}
