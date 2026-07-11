import Link from "next/link";
import styles from "./Footer.module.scss";

/** Cimientos de piedra de la taberna: cierre de todas las páginas. */
export function Footer() {
  return (
    <footer className={`${styles.footer} no-print`}>
      <span className={styles.torch} aria-hidden>
        🔥
      </span>
      <span className={`${styles.torch} ${styles.torchRight}`} aria-hidden>
        🔥
      </span>

      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <span className={styles.brand}>⚔ Grimorio</span>
          <p className={styles.tagline}>
            La mesa virtual de Dungeons &amp; Dragons 5e, servida junto a la chimenea.
          </p>
        </div>

        <nav className={styles.links} aria-label="Enlaces del pie">
          <span className={styles.linksTitle}>La taberna</span>
          <Link href="/dashboard">Mi Mesa</Link>
          <Link href="/map-generator">Mapas</Link>
          <Link href="/compendium">Compendio</Link>
        </nav>

        <div className={styles.credits}>
          <span className={styles.linksTitle}>El tablón de anuncios</span>
          <p>Basado en el SRD 5.1 de D&amp;D.</p>
          <p>Fichas, tableros y dados en tiempo real.</p>
          <p>Gratis para tu grupo de aventureros.</p>
        </div>
      </div>

      <div className={styles.plaque}>
        <span>🕯 Forjado entre tiradas de d20 · que nunca se apague vuestra antorcha 🕯</span>
      </div>
    </footer>
  );
}
