import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Política de privacidad — Grimorio",
  description: "Qué datos trata Grimorio, para qué y cuáles son tus derechos.",
};

/** Política de privacidad: requisito de AdSense y buena práctica RGPD. */
export default function PrivacyPage() {
  return (
    <article className={`panel ${styles.page}`}>
      <h1 className={styles.title}>Política de privacidad</h1>
      <p className={styles.updated}>Última actualización: julio de 2026</p>

      <h2 className="section-title">Qué es Grimorio</h2>
      <p>
        Grimorio es una mesa virtual gratuita para partidas de rol. Esta política explica
        qué datos se tratan al usarla y con qué finalidad.
      </p>

      <h2 className="section-title">Datos que se tratan</h2>
      <ul className={styles.list}>
        <li>
          <strong>Cuenta:</strong> el acceso se hace con tu cuenta de Google mediante
          Firebase Authentication. Grimorio recibe tu nombre, tu correo y tu foto de
          perfil, y los usa únicamente para identificarte dentro de la aplicación.
        </li>
        <li>
          <strong>Datos de juego:</strong> los personajes, campañas, mapas, notas y
          mensajes que creas se guardan en Firebase Firestore (Google) y son visibles
          solo según las reglas del juego: tu personaje lo ven tú, tu máster y tu grupo.
        </li>
        <li>
          <strong>Imágenes:</strong> los retratos que subes se guardan comprimidos junto
          a tus datos de juego. Las ilustraciones del bestiario se cargan desde el
          proyecto comunitario dnd5eapi.co, que puede ver tu dirección IP al servirlas.
        </li>
      </ul>

      <h2 className="section-title">Cookies y almacenamiento</h2>
      <ul className={styles.list}>
        <li>
          <strong>Sesión:</strong> Firebase Authentication usa almacenamiento local del
          navegador para mantener tu sesión iniciada.
        </li>
        <li>
          <strong>Anuncios:</strong> si esta instancia muestra anuncios de Google
          AdSense, Google puede usar cookies para personalizarlos o medirlos. En ese
          caso verás un mensaje de consentimiento donde podrás aceptarlos o rechazarlos
          antes de que se carguen.
        </li>
      </ul>

      <h2 className="section-title">Lo que no se hace</h2>
      <p>
        Grimorio no vende tus datos, no los comparte con terceros ajenos a los servicios
        descritos (Google Firebase y, si están activos, los anuncios de Google) y no te
        envía correos.
      </p>

      <h2 className="section-title">Dónde se procesan los datos</h2>
      <p>
        Los servicios de Google (Firebase y, en su caso, AdSense) pueden procesar datos
        en la Unión Europea y en Estados Unidos. Google participa en el EU-U.S. Data
        Privacy Framework, el mecanismo que ampara esas transferencias conforme al RGPD.
      </p>

      <h2 className="section-title">Contenido subido por los usuarios</h2>
      <p>
        Los retratos, láminas y textos que los usuarios suben a sus mesas son
        responsabilidad de quien los sube, que declara tener derecho a usarlos. Si
        encuentras en una mesa contenido que infringe tus derechos o la ley, comunícalo
        al contacto de abajo y será retirado.
      </p>

      <h2 className="section-title">Tus derechos</h2>
      <p>
        Puedes borrar tus personajes y campañas desde la propia aplicación en cualquier
        momento. Para ejercer los derechos de acceso, rectificación o supresión sobre tu
        cuenta (RGPD), usa el contacto del titular.
      </p>

      <h2 className="section-title">Titular y contacto</h2>
      {process.env.NEXT_PUBLIC_CONTACT_EMAIL ? (
        <p>
          Esta instancia de Grimorio la opera su titular, con contacto en{" "}
          <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
          </a>
          , tanto para cuestiones de privacidad como para solicitudes de retirada de
          contenido.
        </p>
      ) : (
        <p className={styles.operatorNote}>
          ⚠ Instancia sin contacto configurado: quien opere este despliegue debe definir
          la variable de entorno <code>NEXT_PUBLIC_CONTACT_EMAIL</code> para cumplir con
          la normativa de servicios de internet si publica el sitio (especialmente con
          anuncios).
        </p>
      )}

      <h2 className="section-title">Cambios</h2>
      <p>
        Si esta política cambia, se actualizará esta página y la fecha de arriba.
      </p>
    </article>
  );
}
