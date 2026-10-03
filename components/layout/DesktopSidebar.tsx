"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive, navigationGroups } from "./navigation";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="desktop-sidebar">
      <Link
        className="desktop-sidebar-brand"
        href="/dashboard"
        aria-label="DuitQu, ke Dashboard"
      >
        <span className="desktop-sidebar-logo" aria-hidden="true">
          DQ
        </span>
        <span className="desktop-sidebar-brand-copy">
          <strong>DuitQu</strong>
          <small>Keuangan lebih tertata</small>
        </span>
      </Link>

      <nav className="desktop-sidebar-nav" aria-label="Navigasi utama">
        {navigationGroups.map((group) => (
          <div className="desktop-sidebar-group" key={group.label}>
            <p className="desktop-sidebar-group-label">{group.label}</p>
            <div className="desktop-sidebar-links">
              {group.items.map(({ href, icon: Icon, label }) => {
                const isActive = isNavigationItemActive(pathname, href);

                return (
                  <Link
                    className={`desktop-sidebar-link ${isActive ? "desktop-sidebar-link--active" : ""}`}
                    href={href}
                    key={href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" size={19} strokeWidth={isActive ? 2 : 1.6} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
