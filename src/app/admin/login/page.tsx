import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-brand-bg-soft lg:grid lg:grid-cols-[minmax(360px,0.82fr)_1.18fr]">
      <section className="relative hidden overflow-hidden bg-brand-navy px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -top-28 -right-24 size-80 rounded-full border-[56px] border-white/5" />
        <div className="absolute -bottom-40 -left-32 size-[420px] rounded-full border-[72px] border-brand-blue/55" />
        <Image
          src="/logo.svg"
          alt="REMAX Home of Giving"
          width={180}
          height={84}
          className="relative h-16 w-auto brightness-0 invert"
          priority
        />
        <div className="relative max-w-lg">
          <ShieldCheck className="mb-8 size-12 text-white" strokeWidth={1.5} />
          <h1 className="max-w-md text-4xl leading-[1.15] font-extrabold tracking-[-0.035em] text-balance xl:text-5xl">
            Kelola kebaikan dengan data yang dapat dipercaya.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
            Satu ruang kerja untuk mencatat donasi, mengelola program, dan
            menjaga laporan tetap transparan.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-blue-100">
          <BadgeCheck className="size-5" />
          Akses khusus Super Admin
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Image
              src="/logo.svg"
              alt="REMAX Home of Giving"
              width={150}
              height={70}
              className="h-14 w-auto"
              priority
            />
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-brand-navy"
            >
              <ArrowLeft className="size-4" />
              Website
            </Link>
          </div>

          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-[0_16px_44px_rgba(6,46,97,0.08)] sm:p-9">
            <h2 className="text-3xl font-extrabold tracking-[-0.035em] text-brand-navy mb-4">
              Selamat datang Cantik
            </h2>

            {error === "akses" && (
              <div
                className="mb-5 rounded-lg border border-brand-red/20 bg-brand-tint-red px-4 py-3 text-sm font-medium text-brand-red"
                role="alert"
              >
                Sesi Anda tidak memiliki akses Super Admin. Silakan masuk dengan
                akun yang sesuai.
              </div>
            )}

            <LoginForm />
          </div>

          <Link
            href="/"
            className="mt-7 hidden items-center justify-center gap-2 text-sm font-semibold text-brand-text-body transition-colors hover:text-brand-blue lg:flex"
          >
            <ArrowLeft className="size-4" />
            Kembali ke website
          </Link>
        </div>
      </section>
    </main>
  );
}
