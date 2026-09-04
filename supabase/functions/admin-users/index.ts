// Supabase Edge Function: admin-users
//
// The ONLY reason this exists: creating and deleting Supabase Auth users
// requires the service_role key, which must never be shipped to the browser
// (see js/config.js). This function holds that key server-side (Supabase
// injects SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY automatically at runtime)
// and only performs an action after verifying the caller is an active admin.
//
// Deploy:  supabase functions deploy admin-users
// Call from the browser via: supabase.functions.invoke('admin-users', { body: {...} })

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Identify the caller from their own JWT (still using the service key
    // client so we can also read their profile role in the same call).
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { action, payload } = await req.json();

    if (action === "create") {
      const { email, password, full_name, role } = payload ?? {};
      if (!email || !password || !full_name) {
        return json({ error: "email, password, dan full_name wajib diisi" }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: role === "admin" ? "admin" : "editor" },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (action === "delete") {
      const { user_id } = payload ?? {};
      if (!user_id) return json({ error: "user_id wajib diisi" }, 400);
      if (user_id === user.id) {
        return json({ error: "Tidak dapat menghapus akun sendiri" }, 400);
      }

      const { data: target } = await admin
        .from("profiles")
        .select("role, is_active")
        .eq("id", user_id)
        .single();

      if (target?.role === "admin" && target?.is_active) {
        const { count } = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("is_active", true);
        if ((count ?? 0) <= 1) {
          return json({ error: "Tidak dapat menghapus admin aktif terakhir" }, 400);
        }
      }

      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});
