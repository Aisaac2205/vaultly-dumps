import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/shared/lib/auth-client";
import logoSidebar from "@/shared/assets/logo_sidebar.png";
import { Button } from "@/shared/ui/button";
import { FadeIn } from "@/shared/ui/motion/FadeIn";

function LoginBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden rounded-xl border border-white/10 bg-black lg:flex flex-col justify-between p-8 lg:p-12 xl:p-14">
      {/* Subtle monochrome ambient light and dot matrix texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl pointer-events-none"
      />
      <div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none"
      />

      {/* Top Tagline Pill */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1 text-xs font-mono font-medium text-white/70 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
          <span>Database Backups & Cloud Storage</span>
        </div>
      </div>

      {/* Bottom Editorial Statement */}
      <div className="relative z-10 flex flex-col gap-4">
        <h2 className="max-w-[500px] text-3xl font-medium tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl leading-[1.12]">
          Control y resguardo inteligente para tus bases de datos
        </h2>
        <p className="max-w-[420px] text-sm sm:text-base text-white/50 leading-relaxed font-normal">
          Automatización de dumps, restauración point-in-time y auditoría centralizada con la máxima seguridad.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation("auth");
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
      setError(authError.message ?? t("error.invalidCredentials"));
      return;
    }

    navigate("/");
  }

  return (
    <section className="min-h-svh bg-background p-3 sm:p-4 text-foreground antialiased selection:bg-foreground selection:text-background">
      <div className="grid min-h-[calc(100svh-1.5rem)] gap-4 sm:gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left column — Form Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[560px] lg:px-14 xl:px-20 shadow-xs">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-2.5 self-start">
            <img src={logoSidebar} alt="Vaultly" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Vaultly
            </span>
          </div>

          {/* Form Content */}
          <FadeIn className="my-auto py-8">
            <div className="mx-auto w-full max-w-[420px]">
              <h1 className="text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
                {t("page.title")}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
                {t("page.subtitle")}
              </p>

              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="mt-8 space-y-4.5 sm:mt-10"
                aria-live="polite"
              >
                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("label.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder={t("placeholder.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-12 w-full rounded-[10px] border border-border bg-background px-4 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("label.password")}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={t("placeholder.password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error" : undefined}
                      className="h-12 w-full rounded-[10px] border border-border bg-background px-4 pr-12 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                  className="h-12 w-full rounded-[10px] bg-foreground text-background text-base font-medium transition-all hover:bg-foreground/90 disabled:opacity-50 mt-2"
                >
                  {loading ? t("action.submitting") : t("action.submit")}
                </Button>
              </form>
            </div>
          </FadeIn>

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vaultly. {t("footer")}
          </p>
        </div>

        {/* Right column — Minimalist Black & White Brand Panel */}
        <LoginBrandPanel />
      </div>
    </section>
  );
}
