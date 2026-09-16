"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  message: string;
  errors?: {
    email?: string;
    password?: string;
  };
};

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const errors: LoginState["errors"] = {};

  if (!email || !email.includes("@")) {
    errors.email = "Masukkan alamat email yang valid.";
  }

  if (!password) {
    errors.password = "Masukkan kata sandi Anda.";
  }

  if (Object.keys(errors).length > 0) {
    return { message: "Periksa kembali data masuk Anda.", errors };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      message: "Email atau kata sandi tidak sesuai.",
    };
  }

  const { data, error: adminError } = await supabase.rpc("hog_admin_whoami");
  const identity = data?.[0];

  if (adminError || !identity?.is_admin) {
    await supabase.auth.signOut();
    return {
      message: "Akun ini tidak memiliki akses Super Admin.",
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
