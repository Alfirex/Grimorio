# ⚔ Grimorio — Gestor de partidas de D&D

Aplicación web para gestionar partidas de Dungeons & Dragons 5e: fichas de personaje completas,
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
| 📜 Ficha de personaje 5e | Características, salvaciones, 18 habilidades con competencia/pericia, combate, ataques, conjuros con espacios, equipo, monedas, personalidad e historia. Modificadores, bono de competencia, CD de conjuros y percepción pasiva se calculan solos |
| 🏰 Campañas | El máster crea la campaña y comparte un código de 6 letras; los jugadores se unen y asignan su personaje |
| 🖋 Notas del máster | El DM deja notas en cada ficha, privadas o visibles para el jugador (protegido también por reglas de Firestore) |
| ⚔ Iniciativa | Rastreador de turnos y rondas con PG de cada combatiente, importa a los jugadores de la campaña |
| 🎲 Dados | Tirador flotante disponible en toda la app (`2d6+3`, `d20`…) con historial |
| 🗺 Generador de mapas | Mazmorras procedurales con semilla reproducible, salas numeradas y exportación a PNG |
| ♟ Tablero virtual | El máster coloca un mapa generado como tablero de la campaña; cada jugador mueve su ficha y el DM controla enemigos, todo sincronizado en tiempo real |

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
├── data/                 # Datos de D&D 5e (clases, razas, habilidades…)
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
