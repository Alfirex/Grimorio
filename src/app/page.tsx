"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SetupGuide } from "@/components/setup/SetupGuide";
import { generateDungeon } from "@/utils/mapgen";
import { renderDungeon, THEMES } from "@/utils/renderDungeon";
import styles from "./page.module.scss";

const FEATURES = [
  {
    icon: "📜",
    title: "Fichas con el reglamento dentro",
    text: "Clases, subclases y razas del SRD 5.1 en español con rasgos por nivel, más de 165 conjuros, y trasfondos y panteón propios: todo se elige de listas y los números se calculan solos.",
  },
  {
    icon: "♟",
    title: "Tablero táctico en tiempo real",
    text: "Cada jugador mueve su ficha desde su casa; niebla de guerra por salas, puertas que se abren y cierran, y todo sincronizado al instante.",
  },
  {
    icon: "⚔",
    title: "Combate de verdad",
    text: "Alcances reales, ventaja y desventaja, salvaciones contra CD, plantillas de área (esfera, cono, línea…) que se resuelven solas y estados sobre las fichas.",
  },
  {
    icon: "⭐",
    title: "Progresión completa",
    text: "Los enemigos dan PX según su desafío, el botín se reparte al saquear y la ficha te sube de nivel aplicando PG, rasgos nuevos y espacios de conjuro.",
  },
  {
    icon: "🗺",
    title: "Mazmorras procedurales",
    text: "Genera mapas con semilla reproducible en seis ambientaciones ilustradas y colócalos como tablero de tu campaña con un clic.",
  },
  {
    icon: "🐉",
    title: "Bestiario y compendio",
    text: "29 criaturas listas para desplegar (incluso en grupos guardados) y un compendio consultable de conjuros con buscador y filtros.",
  },
  {
    icon: "🎲",
    title: "Iniciativa y dados compartidos",
    text: "El combate se ordena solo, la ficha activa brilla en el tablero, la página avisa cuando te toca y las tiradas pueden anunciarse a toda la mesa.",
  },
  {
    icon: "📔",
    title: "Crónica y láminas",
    text: "Diario de sesiones, notas del máster por personaje y handouts que se revelan en el momento justo: el retrato del villano, el mapa, la carta…",
  },
  {
    icon: "🖨",
    title: "Tu ficha, donde quieras",
    text: "Imprime la hoja o guárdala en PDF, y exporta e importa personajes en JSON para compartir builds o cambiar de cuenta.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Crea tu héroe",
    text: "Elige raza, clase y trasfondo: la ficha aplica bonificadores, competencias y rasgos por ti.",
  },
  {
    number: "2",
    title: "Únete a la mesa",
    text: "El máster crea la campaña y comparte un código de 6 letras. Asigna tu personaje y listo.",
  },
  {
    number: "3",
    title: "A jugar",
    text: "Mapa en el tablero, iniciativa, combate, botín y experiencia: la sesión entera sin salir de la web.",
  },
];

const FOR_DM = [
  "Genera la mazmorra y colócala como tablero con niebla de guerra",
  "Despliega enemigos del bestiario o grupos guardados en cualquier sala",
  "Inicia el combate: la iniciativa se tira sola y todos ven los turnos",
  "Daña, cura, marca estados y resuelve áreas con salvaciones automáticas",
  "Notas privadas por personaje, diario de campaña y láminas que revelar",
];

const FOR_PLAYERS = [
  "Tu ficha 5e completa con el reglamento integrado y cálculo automático",
  "Mueve tu ficha con su velocidad real; abre puertas y descubre salas",
  "Ataca con tus armas y conjuros respetando su alcance",
  "Tira habilidades y salvaciones desde la ficha, a la vista de la mesa",
  "Sube de nivel con un clic cuando el botín reparte la experiencia",
];

export default function LandingPage() {
  const { user, loading, configured, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (!configured) return <SetupGuide />;
  if (loading || user) return <p className={styles.loading}>Abriendo el grimorio…</p>;

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className={styles.landing}>
      {/* Farolillos de la taberna */}
      <span className={styles.lantern} aria-hidden />
      <span className={`${styles.lantern} ${styles.lanternRight}`} aria-hidden />

      {/* ---------- Cartel colgante ---------- */}
      <section className={styles.hero}>
        <div className={styles.signWrap}>
          <div className={styles.sign}>
            <h1 className={styles.title}>Grimorio</h1>
            <p className={styles.signSub}>⚔ Taberna &amp; mesa de aventuras ⚔</p>
          </div>
        </div>

        <p className={styles.subtitle}>
          La mesa virtual de rol <strong>compatible con 5e</strong> (SRD 5.1) en español:
          fichas guiadas por el reglamento, tablero táctico en tiempo real y todo lo que
          una campaña necesita, en un solo lugar.
        </p>
        <div className={styles.badges}>
          <span className={styles.badge}>Gratis</span>
          <span className={styles.badge}>Sin instalación</span>
          <span className={styles.badge}>SRD 5.1 en español</span>
          <span className={styles.badge}>Tiempo real</span>
        </div>
        <button type="button" className={styles.tavernBtn} onClick={handleLogin}>
          <GoogleIcon /> Entrar con Google
        </button>
        {error && <p className="error-text">{error}</p>}
      </section>

      <div className={styles.divider} aria-hidden>
        ⚜
      </div>

      {/* ---------- Demo del generador + pasos ---------- */}
      <section className={styles.showcase}>
        <div className={styles.steps}>
          <h2 className={styles.sectionTitle}>Cómo funciona</h2>
          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <span className={styles.stepCoin}>{step.number}</span>
              <div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <DungeonPreview />
      </section>

      <div className={styles.divider} aria-hidden>
        ⚜
      </div>

      {/* ---------- Funcionalidades en pergamino ---------- */}
      <section>
        <h2 className={styles.sectionTitle}>Todo lo que trae</h2>
        <div className={styles.features}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} aria-hidden>
        ⚜
      </div>

      {/* ---------- Para máster y jugadores ---------- */}
      <section className={styles.roles}>
        <div className={styles.roleCard}>
          <h3 className={styles.roleTitle}>🎩 Si eres el máster</h3>
          <ul>
            {FOR_DM.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className={styles.roleCard}>
          <h3 className={styles.roleTitle}>🛡 Si eres jugador</h3>
          <ul>
            {FOR_PLAYERS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Cierre ---------- */}
      <section className={styles.outro}>
        <p className={styles.outroText}>
          🕯 La chimenea está encendida y la mesa, servida. Solo faltáis vosotros.
        </p>
        <button type="button" className={styles.tavernBtn} onClick={handleLogin}>
          <GoogleIcon /> Empezar gratis
        </button>
      </section>
    </div>
  );
}

/** Mazmorra real generada en vivo, rotando ambientaciones cada pocos segundos. */
function DungeonPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeIndex, setThemeIndex] = useState(0);
  const themeIds = Object.keys(THEMES);

  useEffect(() => {
    const interval = setInterval(
      () => setThemeIndex((i) => (i + 1) % themeIds.length),
      4000
    );
    return () => clearInterval(interval);
  }, [themeIds.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const map = generateDungeon({
      width: 48,
      height: 32,
      roomAttempts: 14,
      minRoomSize: 4,
      maxRoomSize: 9,
      seed: 1420,
    });
    renderDungeon(canvas, map, 9, themeIds[themeIndex]);
  }, [themeIndex, themeIds]);

  return (
    <figure className={styles.preview}>
      <div className={styles.previewFrame}>
        <canvas ref={canvasRef} className={styles.previewCanvas} />
      </div>
      <figcaption className={styles.previewCaption}>
        Mazmorra generada ahora mismo · ambientación «{THEMES[themeIds[themeIndex]].label}»
      </figcaption>
    </figure>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}
