import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/hooks/useAuthStore";

const ERROR_MESSAGES: Record<AuthError, string> = {
  EMAIL_EXISTS:        "An account with this email already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_REQUIRED:      "Email is required.",
  PASSWORD_TOO_SHORT:  "Password must be at least 6 characters.",
  NAME_REQUIRED:       "Name is required.",
  UNKNOWN:             "Something went wrong. Please try again.",
};

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await login(email, password);
    if (err) { setError(ERROR_MESSAGES[err]); setLoading(false); }
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">

        <div className="mb-12">
          <span className="font-serif-italic text-[15px] text-foreground tracking-tight">Splitr</span>
        </div>

        <h1 className="heading-serif text-3xl text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to access your saved groups and expenses.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-xs block mb-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full h-10 px-3 bg-card border border-border text-foreground text-sm rounded-md placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-xs block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                className="w-full h-10 px-3 pr-10 bg-card border border-border text-foreground text-sm rounded-md placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                {showPass ? "hide" : "show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-muted-foreground border border-border rounded-md px-3 py-2.5 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-foreground text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity mt-2 flex items-center justify-center gap-2"
          >
            {loading
              ? <span className="w-3.5 h-3.5 border border-background/30 border-t-background rounded-full animate-spin" />
              : "Continue"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-8">
          No account?{" "}
          <Link to="/register" className="text-foreground hover:opacity-70 transition-opacity underline underline-offset-2">
            Create one
          </Link>
          {" · "}
          <button onClick={() => navigate(-1)} className="text-foreground hover:opacity-70 transition-opacity underline underline-offset-2">
            Go back
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
