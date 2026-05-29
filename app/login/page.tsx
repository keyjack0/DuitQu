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
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
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
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "#000",
              margin: "0 auto 16px",
            }}
          >
            D
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f5f5f5", marginBottom: "6px" }}>
            DuitQu
          </h1>
          <p style={{ fontSize: "14px", color: "#666666" }}>
            Masuk untuk melanjutkan
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #2a2a2a",
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
                color: "#ef4444",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="admin@duitqu.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%",
                background: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f5f5f5",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%",
                  background: "#161616",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  padding: "10px 14px 10px 14px",
                  paddingRight: "40px",
                  color: "#f5f5f5",
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
                  color: "#666666",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#2a2a2a" : "#22c55e",
              color: loading ? "#666666" : "#000",
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
                <LogIn size={16} />
                Masuk
              </>
            )}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#444444", marginTop: "20px" }}>
          Aplikasi keuangan pribadi Anda
        </p>
      </div>
    </div>
  );
}
