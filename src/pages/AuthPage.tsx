import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup" | "forgot";

const AuthPage = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) {
        toast({ title: "Could not send reset link", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Check your email", description: "We sent you a link to set a new password." });
      setMode("signin");
      return;
    }

    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password);
    setSubmitting(false);

    if (error) {
      toast({ title: mode === "signin" ? "Sign in failed" : "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    if (mode === "signup") {
      // With email confirmation disabled, the user is signed in immediately.
      toast({ title: "Welcome to Focus Forge", description: "Your account is ready." });
    }
    navigate("/", { replace: true });
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    setSubmitting(false);
    if (error) {
      toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
    }
    // On success the browser redirects to Google — nothing else to do.
  };

  return (
    <div className="relative min-h-screen w-full grid place-items-center bg-background px-5 py-10">
      <div className="absolute inset-0 -z-0 opacity-60">
        <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/15 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-ember shadow-ember grid place-items-center">
            <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold tracking-tight">Focus Forge</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Discipline OS</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-elev p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin"
                ? "Sign in to continue forging focus."
                : mode === "signup"
                  ? "Start building your discipline streak today."
                  : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-95 font-semibold"
            >
              {submitting
                ? "Please wait…"
                : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={handleGoogle}
                className="w-full font-medium"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
