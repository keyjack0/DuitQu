"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needConfirm, setNeedConfirm] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Semua kolom harus diisi");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: authError } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      setError(
        authError.message === "User already registered"
          ? "Email sudah terdaftar. Silakan masuk."
          : authError.message
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setNeedConfirm(true);
    setLoading(false);
  };

  if (needConfirm) {
    return (
      <div className="auth-page">
        <div className="auth-confirm-card">
          <h1 className="auth-confirm-title">Cek Email Anda 📬</h1>
          <p className="auth-confirm-desc">
            Kami telah mengirim link verifikasi ke <b>{email}</b>.
            Klik link tersebut, lalu kembali masuk ke aplikasi.
          </p>
          <a href="/login" className="auth-confirm-link">
            Ke Halaman Masuk
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Logo */}
        <div className="auth-branding">
          <div className="auth-logo">D</div>
          <h1 className="auth-title">DuitQu</h1>
          <p className="auth-subtitle">Buat akun untuk mulai mencatat keuangan</p>
        </div>

        {/* Form */}
        <div className="auth-card">
          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="form-field">
            <label className="form-label">Nama</label>
            <input
              type="text"
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="admin@duitqu.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field form-field--spaced">
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
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

          <button onClick={handleRegister} disabled={loading} className="btn-primary">
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <UserPlus size={16} />
                Daftar
              </>
            )}
          </button>
        </div>

        <p className="auth-alt">
          Sudah punya akun?{" "}
          <a href="/login" className="auth-link">
            Masuk
          </a>
        </p>
      </div>
    </div>
  );
}
