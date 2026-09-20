"use client";

/**
 * Menampilkan identitas akun utama dan menjadi pintu masuk untuk mengubah
 * nama profil tanpa membuat halaman selalu berada dalam mode edit.
 */
import { CalendarDays, Pencil } from "lucide-react";
import type { User } from "@/types";

export function ProfileCard({ user, onEdit }: { user: User; onEdit: () => void }) {
  const joinedAt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.created_at));
  return (
    <section className="profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card-top">
        <div className="profile-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase() || "U"}</div>
        <button type="button" className="profile-edit-button" onClick={onEdit}>
          <Pencil size={15} aria-hidden="true" /> Edit profil
        </button>
      </div>
      <div className="profile-identity">
        <h2 id="profile-card-title">{user.name}</h2>
        <p>{user.email}</p>
      </div>
      <div className="profile-joined">
        <CalendarDays size={15} aria-hidden="true" />
        <span>Bergabung {joinedAt}</span>
      </div>
    </section>
  );
}
