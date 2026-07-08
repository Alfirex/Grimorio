"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.scss";

const NAV_LINKS = [
  { href: "/dashboard", label: "Mi Mesa" },
  { href: "/map-generator", label: "Mapas" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <Link href={user ? "/dashboard" : "/"} className={styles.brand}>
        <span className={styles.brandIcon}>⚔</span> Grimorio
      </Link>

      {user && (
        <nav className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? styles.linkActive : styles.link}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      {user && (
        <div className={styles.user}>
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? "Avatar"}
              width={32}
              height={32}
              className={styles.avatar}
            />
          )}
          <span className={styles.userName}>{user.displayName}</span>
          <button type="button" className="btn btn--sm" onClick={logout}>
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
