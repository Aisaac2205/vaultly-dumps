import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Clock, Cloud, Monitor, Mail, Eye, EyeOff, Lock, Database, HardDrive, RefreshCw, Key, Server, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/shared/lib/auth-client";
import logoSidebar from "@/shared/assets/logo_sidebar.png";
import { Button } from "@/shared/ui/button";
import { FadeIn } from "@/shared/ui/motion/FadeIn";

function ShowcasePanel() {
  const { t } = useTranslation('auth')
  return (
    <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-[#111] p-12 lg:flex">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating icons */}
      <div className="absolute left-[8%] top-[10%] flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-slow_8s_ease-in-out_infinite]">
        <Shield className="h-5 w-5 text-white/40" />
      </div>
      <div className="absolute right-[12%] top-[8%] flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-medium_6s_ease-in-out_1s_infinite]">
        <Clock className="h-4 w-4 text-white/40" />
      </div>
      <div className="absolute left-[45%] top-[5%] flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[drift_10s_ease-in-out_0.5s_infinite]">
        <Database className="h-4 w-4 text-white/30" />
      </div>
      <div className="absolute left-[5%] top-[45%] flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-fast_5s_ease-in-out_2s_infinite]">
        <Key className="h-3.5 w-3.5 text-white/30" />
      </div>
      <div className="absolute right-[6%] top-[42%] flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-slow_9s_ease-in-out_3s_infinite]">
        <Server className="h-4 w-4 text-white/35" />
      </div>
      <div className="absolute bottom-[22%] left-[10%] flex h-[50px] w-[50px] items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-fast_5s_ease-in-out_0.5s_infinite]">
        <Cloud className="h-[18px] w-[18px] text-white/40" />
      </div>
      <div className="absolute bottom-[32%] right-[8%] flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[drift_10s_ease-in-out_2s_infinite]">
        <Monitor className="h-3.5 w-3.5 text-white/40" />
      </div>
      <div className="absolute bottom-[8%] left-[40%] flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-medium_7s_ease-in-out_1.5s_infinite]">
        <HardDrive className="h-4 w-4 text-white/30" />
      </div>
      <div className="absolute bottom-[12%] right-[15%] flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[float-slow_10s_ease-in-out_4s_infinite]">
        <RefreshCw className="h-3.5 w-3.5 text-white/25" />
      </div>
      <div className="absolute bottom-[5%] left-[12%] flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm animate-[drift_12s_ease-in-out_1s_infinite]">
        <Wifi className="h-3.5 w-3.5 text-white/25" />
      </div>

      {/* Showcase card */}
      <div className="relative z-10 w-full max-w-[480px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-[10px]">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
            {t('showcase.controlPanel')}
          </p>

          <ShowcaseItem
            icon={<Shield className="h-5 w-5 text-white/70" />}
            title={t('showcase.backups.title')}
            subtitle={t('showcase.backups.subtitle')}
          />
          <ShowcaseItem
            icon={<Clock className="h-5 w-5 text-white/70" />}
            title={t('showcase.cronjobs.title')}
            subtitle={t('showcase.cronjobs.subtitle')}
          />
          <ShowcaseItem
            icon={<Cloud className="h-5 w-5 text-white/70" />}
            title={t('showcase.storage.title')}
            subtitle={t('showcase.storage.subtitle')}
            last
          />
        </div>

        {/* Security badge */}
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
            <Lock className="h-5 w-5 text-white/50" />
          </div>
          <p className="text-sm font-semibold text-white">{t('showcase.security.title')}</p>
          <p className="mt-1 max-w-[280px] text-xs text-white/45">
            {t('showcase.security.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}

function ShowcaseItem({
  icon,
  title,
  subtitle,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-4 ${last ? "" : "border-b border-white/[0.06]"}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08]">
        {icon}
      </div>
      <div>
        <p className="text-[0.9375rem] font-semibold text-white">{title}</p>
        <p className="mt-1 text-[0.8125rem] text-white/45">{subtitle}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isPending && session?.user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? t('error.invalidCredentials'));
      return;
    }

    navigate("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full flex-col justify-between bg-white px-8 py-10 sm:px-16 lg:w-[55%] lg:px-20">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logoSidebar} alt="Vaultly" className="h-14 w-14 invert" />
          <span className="text-2xl font-bold tracking-tight text-[#111]">
            Vaultly
          </span>
        </div>

        {/* Form — nudged up to align with showcase card */}
        <FadeIn className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center pb-32">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-[#111]">
            {t('page.title')}
          </h1>
          <p className="mb-10 text-base text-[#666]">
            {t('page.subtitle')}
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} aria-live="polite">
            {error && (
              <div id="login-error" role="alert" className="mb-6 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#444]"
              >
                {t('label.email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={t('placeholder.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full rounded-lg border border-[#d0d0d0] bg-[#fafafa] px-4 py-3.5 pr-12 text-base text-[#111] outline-none transition-all placeholder:text-[#999] focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                  autoComplete="email"
                  autoFocus
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <Mail className="h-5 w-5 text-[#999]" />
                </span>
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#444]"
              >
                {t('label.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t('placeholder.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full rounded-lg border border-[#d0d0d0] bg-[#fafafa] px-4 py-3.5 pr-12 text-base text-[#111] outline-none transition-all placeholder:text-[#999] focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#999] transition-colors hover:text-[#444]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#111] text-base font-semibold text-white hover:bg-[#111]/90"
            >
              {loading ? t('action.submitting') : t('action.submit')}
            </Button>
          </form>
        </FadeIn>

        {/* Footer */}
        <p className="text-sm text-[#999]">
          &copy; {new Date().getFullYear()} Vaultly. {t('footer')}
        </p>
      </div>

      {/* Right panel — showcase */}
      <ShowcasePanel />
    </div>
  );
}
