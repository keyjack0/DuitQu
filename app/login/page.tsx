"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } =
      await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Email atau password salah"
        : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Logo */}
        <div className="auth-branding">
          <div className="auth-logo">D</div>
          <h1 className="auth-title">DuitQu</h1>
          <p className="auth-subtitle">Masuk untuk melanjutkan</p>
        </div>

        {/* Form */}
        <div className="auth-card">
          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="admin@duitqu.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="form-input"
            />
          </div>

          <div className="form-field form-field--spaced">
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="form-input form-input--trailing"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-suffix-btn"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary">
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <LogIn size={16} />
                Masuk
              </>
            )}
          </button>
        </div>

        <p className="auth-alt">
          Belum punya akun?{" "}
          <a href="/register" className="auth-link">
            Daftar
          </a>
        </p>

        <p className="text-center text-xs text-faint mt-5">
          Aplikasi keuangan pribadi Anda
        </p>
      </div>
    </div>
  );
}
