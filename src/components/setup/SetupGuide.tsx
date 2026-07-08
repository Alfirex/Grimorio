import styles from "./SetupGuide.module.scss";

const STEPS = [
  <>
    Crea un proyecto gratuito en{" "}
    <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
      console.firebase.google.com
    </a>
    .
  </>,
  <>
    En <strong>Authentication → Sign-in method</strong>, habilita el proveedor{" "}
    <strong>Google</strong>.
  </>,
  <>
    En <strong>Firestore Database</strong>, crea la base de datos (modo producción) y pega el
    contenido de <code>firestore.rules</code> en la pestaña Reglas.
  </>,
  <>
    En <strong>Configuración del proyecto → Tus apps</strong>, registra una app web y copia la
    configuración.
  </>,
  <>
    Copia <code>.env.example</code> a <code>.env.local</code>, rellena los valores y reinicia{" "}
    <code>npm run dev</code>.
  </>,
];

export function SetupGuide() {
  return (
    <div className={styles.wrapper}>
      <div className="panel">
        <h1 className={styles.title}>⚙ Configuración pendiente</h1>
        <p className={styles.intro}>
          Grimorio necesita un proyecto de Firebase (gratuito) para el login con Google y la base
          de datos. Sigue estos pasos:
        </p>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
