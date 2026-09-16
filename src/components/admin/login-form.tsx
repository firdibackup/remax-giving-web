"use client";

import { useActionState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = { message: "" };

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-brand-navy">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-text-body" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@remax.co.id"
            className="h-12 pl-10"
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            required
          />
        </div>
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-brand-red">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-brand-navy">
          Kata sandi
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-text-body" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="h-12 px-10"
            aria-invalid={Boolean(state.errors?.password)}
            aria-describedby={state.errors?.password ? "password-error" : undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-brand-text-body transition-colors hover:bg-brand-bg-soft hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.errors?.password && (
          <p id="password-error" className="text-sm text-brand-red">
            {state.errors.password}
          </p>
        )}
      </div>

      {state.message && (
        <div
          className="rounded-lg border border-brand-red/20 bg-brand-tint-red px-4 py-3 text-sm font-medium text-brand-red"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
      >
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {pending ? "Memeriksa akses..." : "Masuk ke dashboard"}
      </Button>
    </form>
  );
}

export { LoginForm };
