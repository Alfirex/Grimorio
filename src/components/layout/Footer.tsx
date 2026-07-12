"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./Footer.module.scss";

/** Cimientos de piedra de la taberna: cierre de todas las páginas. */
export function Footer() {
  const { user, configured, signInWithGoogle } = useAuth();

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
            La mesa virtual de rol 5e, servida junto a la chimenea.
          </p>
        </div>

        <nav className={styles.links} aria-label="Enlaces del pie">
          <span className={styles.linksTitle}>La taberna</span>
          {user ? (
            <>
              <Link href="/dashboard">Mi Mesa</Link>
              <Link href="/map-generator">Mapas</Link>
              <Link href="/compendium">Compendio</Link>
            </>
          ) : (
            <>
              <p className={styles.lockedNote}>
                La puerta está cerrada con llave para los desconocidos.
              </p>
              {configured && (
                <button
                  type="button"
                  className={styles.loginLink}
                  onClick={() => signInWithGoogle().catch(() => {})}
                >
                  🔑 Entrar para sentarte a la mesa
                </button>
              )}
            </>
          )}
        </nav>

        <div className={styles.credits}>
          <span className={styles.linksTitle}>El tablón de anuncios</span>
          <p>Contenido del SRD 5.1 (CC BY 4.0).</p>
          <p>Fichas, tableros y dados en tiempo real.</p>
          <p>Gratis para tu grupo de aventureros.</p>
        </div>
      </div>

      <div className={styles.plaque}>
        <span>🕯 Forjado entre tiradas de d20 · que nunca se apague vuestra antorcha 🕯</span>
      </div>

      {/* Atribución exigida por la licencia CC BY 4.0 del SRD 5.1 y descargo de marca */}
      <div className={styles.legal}>
        <p>
          Esta obra incluye material del System Reference Document 5.1 («SRD 5.1») de
          Wizards of the Coast LLC, disponible en{" "}
          <a
            href="https://dnd.wizards.com/resources/systems-reference-document"
            rel="noopener noreferrer"
            target="_blank"
          >
            dnd.wizards.com/resources/systems-reference-document
          </a>
          . El SRD 5.1 se ofrece bajo la licencia{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/legalcode"
            rel="noopener noreferrer"
            target="_blank"
          >
            Creative Commons Attribution 4.0 International
          </a>
          .
        </p>
        <p>
          Grimorio es un proyecto de aficionados, no está afiliado a Wizards of the Coast
          ni cuenta con su respaldo. Dungeons &amp; Dragons y D&amp;D son marcas de Wizards
          of the Coast LLC. El resto del contenido (panteón, textos y diseño) es original
          de Grimorio.
        </p>
      </div>
    </footer>
  );
}
