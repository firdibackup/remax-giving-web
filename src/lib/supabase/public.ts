import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
  // Keep donation data request-time without reading the visitor's auth cookies.
  await connection();

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Fail promptly; the error page provides an explicit user-triggered retry.
      db: { timeout: 8000, retry: false },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
