"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SetupGuide } from "@/components/setup/SetupGuide";
import styles from "./page.module.scss";

const FEATURES = [
  {
    icon: "📜",
    title: "Fichas completas",
    text: "Hojas de personaje 5e con cálculo automático de modificadores, salvaciones y habilidades.",
  },
  {
    icon: "🏰",
    title: "Campañas",
    text: "Crea partidas, invita a tus jugadores con un código y gestiona la mesa como máster.",
  },
  {
    icon: "🖋",
    title: "Notas del máster",
    text: "Deja notas privadas o visibles en cada ficha de personaje de tu campaña.",
  },
  {
    icon: "🗺",
    title: "Tablero y mapas",
    text: "Mazmorras procedurales que se convierten en tablero con fichas en tiempo real.",
  },
  {
    icon: "🎲",
    title: "Dados e iniciativa",
    text: "Tirador de dados siempre a mano y rastreador de iniciativa para los combates.",
  },
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
    <div className={styles.hero}>
      <h1 className={styles.title}>Grimorio</h1>
      <p className={styles.subtitle}>
        Tu mesa de Dungeons &amp; Dragons, organizada: personajes, campañas, notas del máster,
        iniciativa y mapas en un solo lugar.
      </p>

      <button type="button" className={styles.googleBtn} onClick={handleLogin}>
        <GoogleIcon /> Entrar con Google
      </button>
      {error && <p className="error-text">{error}</p>}

      <div className={styles.features}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className="panel">
            <div className={styles.featureIcon}>{feature.icon}</div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureText}>{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
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
