import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telegram_id")
      .eq("id", data.user.id)
      .single();
    
    if (!profile?.telegram_id) {
      throw redirect({ to: "/auth", search: { mode: "signup" } });
    }
    
    return { user: data.user };
  },
  component: () => <Outlet />,
});
