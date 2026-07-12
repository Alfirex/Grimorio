# ⚔ Grimorio — Mesa virtual de rol 5e

Aplicación web para gestionar partidas de rol compatibles con 5e (SRD 5.1): fichas de personaje completas,
campañas con código de invitación, notas del máster, rastreador de iniciativa, tirador de dados,
generador procedural de mapas de mazmorra y tablero virtual con fichas en tiempo real.

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** para utilidades de layout + **SCSS Modules** para el tema visual
- **Firebase**: autenticación con Google y base de datos Firestore en tiempo real

## Funciones

| Función | Descripción |
|---|---|
| 🔐 Login con Google | Cada usuario entra con su cuenta y gestiona sus propios personajes |
| 📜 Ficha de personaje 5e | Características, salvaciones, 18 habilidades con competencia/pericia, combate, ataques con alcance, conjuros con espacios, equipo, monedas, deidad, personalidad e historia. Modificadores, bono de competencia, CD de conjuros y percepción pasiva se calculan solos |
| 📖 Reglamento integrado | Subclases, rasgos de clase por nivel, 165+ conjuros con alcance y espacios de conjuro por clase y nivel (SRD 5.1 en español): todo se elige de listas en vez de escribirse a mano |
| 🌙 Descansos | Descanso corto (gastar dados de golpe) y largo (PG, espacios y salvaciones de muerte) con un clic |
| ⭐ Experiencia y niveles | Los enemigos dan PX según su VD; al saquear se reparten entre el grupo y la ficha avisa cuando puedes subir de nivel, aplicando PG, rasgos nuevos y espacios de conjuro |
| 🏰 Campañas | El máster crea la campaña y comparte un código de 6 letras; los jugadores se unen y asignan su personaje |
| 🖋 Notas del máster | El DM deja notas en cada ficha, privadas o visibles para el jugador (protegido también por reglas de Firestore) |
| ⚔ Iniciativa compartida | El máster inicia el combate y la iniciativa se tira sola (jugadores con su bono); todos ven el orden de turnos y rondas en tiempo real, y la ficha activa brilla en el tablero |
| 🎲 Dados | Tirador flotante disponible en toda la app (`2d6+3`, `d20`…) con historial |
| 🗺 Generador de mapas | Mazmorras procedurales con semilla reproducible, 6 ambientaciones ilustradas, salas numeradas y exportación a PNG |
| ♟ Tablero virtual | Cada jugador mueve su ficha (limitada por su velocidad) y el DM controla enemigos de un bestiario de 29 criaturas (VD 1/8 a 6), todo sincronizado. Niebla de guerra por salas, combate con alcances reales, estados (envenenado, derribado…), daño/cura del máster, botín con PX y registro de combate con borrado |

## Puesta en marcha

1. **Instala las dependencias**

   ```bash
   npm install
   ```

2. **Crea un proyecto de Firebase** (gratuito) en [console.firebase.google.com](https://console.firebase.google.com):
   - En **Authentication → Sign-in method**, habilita **Google**.
   - En **Firestore Database**, crea la base de datos y pega el contenido de
     [`firestore.rules`](./firestore.rules) en la pestaña **Reglas**.
   - En **Configuración del proyecto → Tus apps**, registra una **app web** y copia la configuración.

3. **Configura las variables de entorno**

   ```bash
   cp .env.example .env.local
   # rellena los valores con la configuración de tu app web de Firebase
   ```

4. **Arranca el servidor de desarrollo**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000). Si falta la configuración de Firebase,
   la propia app te mostrará una guía de instalación.

## Estructura

```
src/
├── app/                  # Rutas (App Router)
│   ├── page.tsx          # Portada + login con Google
│   ├── dashboard/        # Mis personajes y campañas
│   ├── characters/[id]/  # Ficha de personaje
│   ├── campaigns/[id]/   # Vista de campaña (tablero, máster e iniciativa)
│   └── map-generator/    # Generador de mazmorras
├── components/           # Componentes por dominio (character, campaign, dice…)
├── context/              # AuthContext (sesión de Firebase)
├── data/                 # Datos 5e del SRD (clases, razas, habilidades…)
├── lib/                  # Inicialización de Firebase y acceso a Firestore
├── styles/               # Variables y mixins SCSS del tema
├── types/                # Tipos compartidos
└── utils/                # Reglas de 5e, dados, generación y render de mapas
```

## Seguridad

Las reglas de `firestore.rules` garantizan que:

- Solo el dueño puede editar o borrar su personaje.
- Las fichas solo las ven su dueño y los miembros de su campaña.
- Las notas privadas del máster no son legibles por el jugador ni siquiera llamando a la API directamente.
- Solo el DM puede modificar una campaña; los miembros únicamente pueden mover fichas del tablero, y cualquier usuario autenticado solo puede añadirse a sí mismo con el código de invitación.

## Licencia del contenido

- Este proyecto incluye material del **System Reference Document 5.1** («SRD 5.1») de
  Wizards of the Coast LLC, disponible en
  [dnd.wizards.com/resources/systems-reference-document](https://dnd.wizards.com/resources/systems-reference-document)
  y licenciado bajo
  [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/legalcode).
  La atribución exigida por la licencia se muestra en el pie de todas las páginas.
- Solo se usa contenido del SRD: una subclase por clase, las razas y conjuros del SRD y
  criaturas del SRD. El panteón de deidades, los rasgos de trasfondo y todos los textos
  descriptivos son **originales de Grimorio**.
- Grimorio no está afiliado a Wizards of the Coast ni cuenta con su respaldo.
  «Dungeons & Dragons» y «D&D» son marcas de Wizards of the Coast LLC; este proyecto
  solo las menciona de forma descriptiva para indicar compatibilidad.
- Los retratos del bestiario se sirven desde [dnd5eapi.co](https://www.dnd5eapi.co)
  (proyecto comunitario sobre el SRD); si una imagen no carga, se muestra un emoji.

## Anuncios (opcional, gratis)

La app trae integración con **Google AdSense** desactivada por defecto. Para activarla:

1. Crea una cuenta gratuita en [AdSense](https://adsense.google.com) y da de alta tu dominio.
2. Añade tu identificador de editor a las variables de entorno del despliegue:

   ```bash
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   ```

3. Crea el archivo `public/ads.txt` con la línea que te indica AdSense:

   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

4. En el panel de AdSense activa los **anuncios automáticos** para tu sitio y, en
   «Privacidad y mensajes», el **mensaje de consentimiento** (obligatorio para visitantes
   de la UE por el RGPD). Sin la variable de entorno, la app no carga ningún script de
   anuncios.

### Alojamiento gratuito compatible con anuncios

- **Cloudflare Pages** y **Netlify**: gratis y permiten uso comercial (anuncios). ✅
- **Firebase Hosting/App Hosting**: el runtime de Next.js requiere el plan Blaze
  (con tramo gratuito, pide tarjeta).
- **Vercel (plan Hobby)**: gratuito pero **prohíbe uso comercial**, anuncios incluidos;
  no lo uses si monetizas. ⚠️
