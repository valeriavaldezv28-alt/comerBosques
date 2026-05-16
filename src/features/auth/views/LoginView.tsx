import { type FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { ROUTE_PATHS } from "@/config/routePaths";
import { APP_CONFIG } from "@/shared/config/appConfig";
import { AppFooter } from "@/shared/layouts/AppFooter";
import { claseBotonPrimario } from "@/shared/ui/estilosDashboard";

const contieneDetalleTecnico = (mensaje: string): boolean =>
  [
    "axios",
    "backend",
    "authentication server",
    "configuracion",
    "configuración",
    "error al iniciar sesion",
    "error al iniciar sesión",
    "failed to fetch",
    "network error",
    "request timeout",
    "server error",
    "servidor de autenticación",
    "sign in error",
    "stack",
    "token",
    "undefined",
    "url",
  ].some((detalle) => mensaje.toLowerCase().includes(detalle));

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signIn, sesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estaCargando, setEstaCargando] = useState(false);

  useEffect(() => {
    if (sesion) {
      navigate(ROUTE_PATHS.dashboard, { replace: true });
    }
  }, [sesion, navigate]);

  useEffect(() => {
    if (sesion || i18n.resolvedLanguage?.startsWith(APP_CONFIG.DEFAULT_LANGUAGE)) {
      return;
    }

    const forzarInglesEnLogin = async () => {
      try {
        await i18n.changeLanguage(APP_CONFIG.DEFAULT_LANGUAGE);
      } catch {
        // El login puede continuar aunque i18n no acepte el cambio.
      }

      try {
        window.localStorage.setItem(APP_CONFIG.LANGUAGE_STORAGE_KEY, APP_CONFIG.DEFAULT_LANGUAGE);
      } catch {
        // La pantalla sigue renderizando aunque storage no este disponible.
      }
    };

    void forzarInglesEnLogin();
  }, [sesion, i18n]);

  const manejarEnvio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstaCargando(true);
    setError(null);

    try {
      await signIn({ email, password });
      navigate(ROUTE_PATHS.dashboard, { replace: true });
    } catch (errorCapturado) {
      const mensajeGenerico = t("login.errors.default");
      const mensaje =
        errorCapturado instanceof Error &&
        errorCapturado.message &&
        !contieneDetalleTecnico(errorCapturado.message)
          ? errorCapturado.message
          : mensajeGenerico && !contieneDetalleTecnico(mensajeGenerico)
            ? mensajeGenerico
            : t("login.errors.fallback");
      setError(mensaje);
      setEstaCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-6">
      <div className="w-full max-w-[32rem] animate-fade-up">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-lg bg-primary shadow-xl shadow-primary/20">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">{t("brand.short")}</h1>
          <p className="text-base text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-7 shadow-xl shadow-foreground/5 sm:p-8">
          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">
                {t("login.fields.email")}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("login.placeholders.email")}
                  className="h-12 w-full rounded-lg border border-input bg-muted/20 pl-12 pr-4 text-base text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">
                {t("login.fields.password")}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("login.placeholders.password")}
                  className="h-12 w-full rounded-lg border border-input bg-muted/20 pl-12 pr-14 text-base text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((valorActual) => !valorActual)}
                  aria-label={mostrarPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-primary transition hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex w-fit items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="sr-only"
              />
              <span className={`flex h-6 w-6 items-center justify-center rounded-md transition ${rememberMe ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted text-transparent"}`}>
                <Check className="h-4 w-4" />
              </span>
              {t("login.rememberMe")}
            </label>

            {error ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={estaCargando}
              className={claseBotonPrimario("group h-12 w-full gap-3 rounded-lg text-base font-bold shadow-xl shadow-success/20 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60")}
            >
              {estaCargando ? t("login.actions.loading") : t("login.actions.submit")}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>

        <AppFooter className="mt-7" withDivider={false} />
      </div>
    </main>
  );
};

export default Login;
