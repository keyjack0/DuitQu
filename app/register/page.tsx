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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "360px",
            width: "100%",
            margin: "0 auto",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
            Cek Email Anda 📬
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Kami telah mengirim link verifikasi ke <b style={{ color: "var(--text-primary)" }}>{email}</b>.
            Klik link tersebut, lalu kembali masuk ke aplikasi.
          </p>
          <a
            href="/login"
            style={{
              display: "block",
              padding: "12px",
              background: "var(--green)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14px",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Ke Halaman Masuk
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, var(--green), var(--green-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--on-accent)",
              margin: "0 auto 16px",
            }}
          >
            D
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
            DuitQu
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Buat akun untuk mulai mencatat keuangan
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "var(--red)",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Nama
            </label>
            <input
              type="text"
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="admin@duitqu.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                style={{
                  width: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  paddingRight: "40px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "var(--border)" : "var(--green)",
              color: loading ? "var(--text-muted)" : "var(--on-accent)",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
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

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
          Sudah punya akun?{" "}
          <a href="/login" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
            Masuk
          </a>
        </p>
      </div>
    </div>
  );
}