"use client";

/** Menyediakan navigasi utama bawah dengan penanda rute aktif. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive, mobileNavigationItems } from "./navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama mobile">
      {mobileNavigationItems.map(({ href, icon: Icon, label }) => {
        const isActive = isNavigationItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={isActive ? "page" : undefined}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <Icon aria-hidden="true" size={24} strokeWidth={isActive ? 2 : 1.5} />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
