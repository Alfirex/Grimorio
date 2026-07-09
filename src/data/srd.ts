import type { AbilityKey } from "@/types";

/**
 * Contenido del reglamento (SRD 5e) en español: subclases, rasgos de clase
 * por nivel y listado de conjuros por clase y nivel. Sirve para rellenar la
 * ficha de personaje eligiendo de listas en vez de escribirlo todo a mano.
 */

export interface FeatureDef {
  level: number;
  name: string;
  description: string;
}

export interface SubclassDef {
  name: string;
  features: FeatureDef[];
}

export interface ClassContent {
  /** Característica de conjuros de la clase ("" = no lanza). */
  spellAbility: AbilityKey | "";
  /** Cómo llama la clase a su subclase (Senda, Dominio, Colegio…). */
  subclassLabel: string;
  /** Nivel al que se elige la subclase. */
  subclassLevel: number;
  features: FeatureDef[];
  subclasses: SubclassDef[];
}

const f = (level: number, name: string, description: string): FeatureDef => ({
  level,
  name,
  description,
});

export const CLASS_CONTENT: Record<string, ClassContent> = {
  Bárbaro: {
    spellAbility: "",
    subclassLabel: "Senda primigenia",
    subclassLevel: 3,
    features: [
      f(1, "Furia", "Bonificador al daño con FUE y resistencia a daño contundente, perforante y cortante; usos limitados por descanso largo"),
      f(1, "Defensa sin armadura", "Sin armadura, tu CA es 10 + DES + CON"),
      f(2, "Ataque temerario", "Ventaja en ataques con FUE este turno, pero te atacan con ventaja"),
      f(2, "Sentido del peligro", "Ventaja en salvaciones de DES contra efectos que puedas ver"),
      f(5, "Ataque adicional", "Atacas dos veces al usar la acción de Atacar"),
      f(5, "Movimiento rápido", "+10 pies de velocidad sin armadura pesada"),
      f(7, "Instinto salvaje", "Ventaja en las tiradas de iniciativa"),
      f(9, "Crítico brutal", "Un dado de daño extra en críticos (2 a nv 13, 3 a nv 17)"),
      f(11, "Furia implacable", "Si caes a 0 PG en furia, salvación de CON CD 10 para quedarte a 1"),
      f(15, "Furia persistente", "Tu furia solo termina si decides acabarla o caes inconsciente"),
      f(18, "Poderío indómito", "Si una prueba de FUE sale menor que tu FUE, usa tu FUE"),
      f(20, "Campeón primigenio", "+4 a FUE y CON (máximo 24)"),
    ],
    subclasses: [
      {
        name: "Senda del Berserker",
        features: [
          f(3, "Frenesí", "Un ataque cuerpo a cuerpo extra por turno mientras dure la furia; agotamiento al terminar"),
          f(6, "Furia sin control", "No pueden hechizarte ni asustarte durante la furia"),
          f(10, "Presencia intimidante", "Asusta a una criatura a 30 pies (SAB anula)"),
          f(14, "Represalia", "Reacción: ataque cuerpo a cuerpo contra quien te dañe estando a 5 pies"),
        ],
      },
      {
        name: "Senda del Guerrero Totémico",
        features: [
          f(3, "Espíritu totémico", "Oso: resistencia a todo el daño (salvo psíquico) en furia; o águila/lobo"),
          f(6, "Aspecto de la bestia", "Beneficio pasivo del animal: carga del oso, vista de águila…"),
          f(10, "Caminante espiritual", "Puedes lanzar Comunión con la naturaleza como ritual"),
          f(14, "Sintonía totémica", "Poder mayor del tótem: derribas al golpear (oso), vuelo corto (águila)…"),
        ],
      },
    ],
  },
  Bardo: {
    spellAbility: "cha",
    subclassLabel: "Colegio bárdico",
    subclassLevel: 3,
    features: [
      f(1, "Inspiración bárdica", "Acción adicional: un aliado gana 1d6 para una tirada (crece con el nivel)"),
      f(1, "Lanzamiento de conjuros", "Lanzas conjuros de bardo usando Carisma"),
      f(2, "Aprendiz de mucho", "Suma la mitad de tu competencia a pruebas sin competencia"),
      f(2, "Canción de descanso", "Tus aliados recuperan 1d6 PG extra al descansar (crece con el nivel)"),
      f(3, "Pericia", "Duplica tu competencia en 2 habilidades (2 más a nv 10)"),
      f(5, "Fuente de inspiración", "Recuperas la inspiración bárdica con descansos cortos"),
      f(6, "Contraencanto", "Actuación que da ventaja contra miedo y hechizo a los aliados"),
      f(10, "Secretos mágicos", "Aprendes 2 conjuros de cualquier clase (más a nv 14 y 18)"),
      f(20, "Inspiración superior", "Recuperas un uso de inspiración al tirar iniciativa sin ninguno"),
    ],
    subclasses: [
      {
        name: "Colegio del Saber",
        features: [
          f(3, "Competencias adicionales", "Competencia en 3 habilidades a tu elección"),
          f(3, "Palabras cortantes", "Reacción: resta tu dado de inspiración a un ataque, prueba o daño enemigo"),
          f(6, "Secretos mágicos adicionales", "2 conjuros de cualquier clase a nivel 6"),
          f(14, "Habilidad sin igual", "Gasta inspiración para sumar el dado a tu propia prueba"),
        ],
      },
      {
        name: "Colegio del Valor",
        features: [
          f(3, "Competencias adicionales", "Armaduras medias, escudos y armas marciales"),
          f(3, "Inspiración de combate", "Tu inspiración también sirve para daño o para sumar a la CA"),
          f(6, "Ataque adicional", "Atacas dos veces al usar la acción de Atacar"),
          f(14, "Magia de batalla", "Tras lanzar un conjuro, un ataque con arma como acción adicional"),
        ],
      },
    ],
  },
  Brujo: {
    spellAbility: "cha",
    subclassLabel: "Patrón sobrenatural",
    subclassLevel: 1,
    features: [
      f(1, "Magia de pacto", "Pocos espacios pero siempre del nivel máximo; se recuperan con descanso corto"),
      f(2, "Invocaciones sobrenaturales", "2 mejoras místicas a elegir (más con el nivel)"),
      f(3, "Don del pacto", "Cadena (familiar especial), Filo (arma de pacto) o Tomo (3 trucos extra)"),
      f(11, "Arcanum místico", "Un conjuro de nv 6 una vez al día (nv 7 a 13, nv 8 a 15, nv 9 a 17)"),
      f(20, "Maestro sobrenatural", "Recuperas los espacios de pacto una vez por descanso largo"),
    ],
    subclasses: [
      {
        name: "El Infernal",
        features: [
          f(1, "Bendición del Oscuro", "PG temporales (CAR + nivel) al reducir a un enemigo a 0"),
          f(6, "Suerte del Oscuro", "+1d10 a una prueba o salvación, 1/descanso"),
          f(10, "Resistencia infernal", "Resistencia a un tipo de daño a tu elección cada descanso"),
          f(14, "Lanzar a través del infierno", "Destierra al objetivo un turno: 10d10 psíquico"),
        ],
      },
      {
        name: "El Feérico",
        features: [
          f(1, "Presencia feérica", "Hechiza o asusta en un cubo de 10 pies (SAB anula)"),
          f(6, "Escape brumoso", "Reacción al recibir daño: invisible y teletransporte de 60 pies"),
          f(10, "Defensas seductoras", "Inmune a ser hechizado; puedes reflejar el intento"),
          f(14, "Delirio oscuro", "Hechiza o asusta 1 minuto en una ilusión (SAB anula)"),
        ],
      },
      {
        name: "El Primigenio",
        features: [
          f(1, "Mente despierta", "Telepatía con cualquier criatura a 30 pies"),
          f(6, "Escudo entrópico", "Impone desventaja a un ataque; si falla, ventaja en tu siguiente ataque"),
          f(10, "Pensamiento leviatán", "Resistencia psíquica; quien te lea la mente recibe daño"),
          f(14, "Crear esclavo", "Hechizas permanentemente a un humanoide incapacitado"),
        ],
      },
    ],
  },
  Clérigo: {
    spellAbility: "wis",
    subclassLabel: "Dominio divino",
    subclassLevel: 1,
    features: [
      f(1, "Lanzamiento de conjuros", "Preparas y lanzas conjuros de clérigo usando Sabiduría"),
      f(2, "Canalizar divinidad", "Expulsar muertos vivientes + la opción de tu dominio (más usos con el nivel)"),
      f(5, "Destruir muertos vivientes", "Los muertos vivientes expulsados de VD ½ o menos se destruyen (crece)"),
      f(10, "Intervención divina", "Pide ayuda directa a tu deidad: éxito con d100 ≤ tu nivel"),
      f(20, "Intervención divina mejorada", "La intervención divina tiene éxito automático"),
    ],
    subclasses: [
      {
        name: "Dominio de la Vida",
        features: [
          f(1, "Discípulo de la vida", "Tus conjuros de curación curan 2 + nivel del conjuro PG extra"),
          f(2, "Canalizar: Preservar vida", "Reparte nivel × 5 PG entre heridos (hasta la mitad de su máximo)"),
          f(6, "Sanador bendito", "Al curar a otros, te curas 2 + nivel del conjuro"),
          f(8, "Golpe divino", "+1d8 radiante con armas 1/turno (2d8 a nv 14)"),
          f(17, "Sanación suprema", "Tus curaciones con dados curan siempre el máximo"),
        ],
      },
      {
        name: "Dominio de la Luz",
        features: [
          f(1, "Llamarada protectora", "Reacción: desventaja al ataque de un enemigo que veas"),
          f(2, "Canalizar: Resplandor del alba", "2d10 + nivel radiante a 30 pies y disipa oscuridad (CON mitad)"),
          f(6, "Llamarada mejorada", "También puedes proteger a aliados con la llamarada"),
          f(8, "Golpe potente", "+1d8 radiante al daño de tus trucos y conjuros (2d8 a nv 14)"),
          f(17, "Corona de luz", "Luz solar 60 pies; desventaja a salvaciones contra tus conjuros de fuego y radiantes"),
        ],
      },
      {
        name: "Dominio de la Guerra",
        features: [
          f(1, "Sacerdote de guerra", "Ataque con arma como acción adicional, SAB veces al día"),
          f(2, "Canalizar: Golpe guiado", "+10 a una tirada de ataque tuya"),
          f(6, "Canalizar: Bendición del dios de la guerra", "+10 al ataque de un aliado (reacción)"),
          f(8, "Golpe divino", "+1d8 del tipo del arma 1/turno (2d8 a nv 14)"),
          f(17, "Avatar de batalla", "Resistencia al daño contundente, perforante y cortante no mágico"),
        ],
      },
      {
        name: "Dominio de la Tempestad",
        features: [
          f(1, "Ira de la tormenta", "Reacción: 2d8 eléctrico o de trueno a quien te golpee a 5 pies (DES mitad)"),
          f(2, "Canalizar: Ira destructiva", "Tu daño eléctrico o de trueno hace el máximo"),
          f(6, "Golpe de trueno", "Empujas 10 pies a quien dañes con electricidad"),
          f(8, "Golpe divino", "+1d8 de trueno con armas 1/turno (2d8 a nv 14)"),
          f(17, "Tormenta viviente", "Velocidad de vuelo igual a tu velocidad en exteriores"),
        ],
      },
      {
        name: "Dominio del Conocimiento",
        features: [
          f(1, "Bendiciones del conocimiento", "2 idiomas y doble competencia en 2 habilidades de INT"),
          f(2, "Canalizar: Conocimiento de las eras", "10 min de competencia en una habilidad o herramienta"),
          f(6, "Canalizar: Leer pensamientos", "Lee la mente de una criatura (SAB anula) y lánzale Sugestión"),
          f(8, "Golpe potente", "+1d8 al daño de tus trucos (2d8 a nv 14)"),
          f(17, "Visiones del pasado", "Visiones meditando sobre un objeto o lugar"),
        ],
      },
      {
        name: "Dominio de la Naturaleza",
        features: [
          f(1, "Acólito de la naturaleza", "Un truco de druida y competencia extra (armadura pesada incluida)"),
          f(2, "Canalizar: Hechizar animales y plantas", "Hechiza bestias y plantas a 30 pies (SAB anula)"),
          f(6, "Amortiguar elementos", "Reacción: resistencia a ácido, frío, fuego, rayo o trueno a un aliado"),
          f(8, "Golpe divino", "+1d8 de frío, fuego o eléctrico con armas 1/turno (2d8 a nv 14)"),
          f(17, "Maestro de la naturaleza", "Ordena a las bestias y plantas hechizadas"),
        ],
      },
      {
        name: "Dominio del Engaño",
        features: [
          f(1, "Bendición del embaucador", "Ventaja en Sigilo a un aliado durante 1 hora"),
          f(2, "Canalizar: Duplicado ilusorio", "Ilusión de ti mismo; lanza conjuros desde ella"),
          f(6, "Canalizar: Manto de sombras", "Te vuelves invisible hasta el final de tu próximo turno"),
          f(8, "Golpe divino", "+1d8 de veneno con armas 1/turno (2d8 a nv 14)"),
          f(17, "Duplicados mejorados", "Hasta 4 duplicados ilusorios"),
        ],
      },
    ],
  },
  Druida: {
    spellAbility: "wis",
    subclassLabel: "Círculo druídico",
    subclassLevel: 2,
    features: [
      f(1, "Druídico", "Idioma secreto de los druidas y mensajes ocultos"),
      f(1, "Lanzamiento de conjuros", "Preparas y lanzas conjuros de druida usando Sabiduría"),
      f(2, "Forma salvaje", "Transfórmate en bestia 2 veces por descanso (mejores formas a nv 4 y 8)"),
      f(18, "Cuerpo atemporal", "Envejeces 1 año por cada 10; puedes lanzar conjuros en forma salvaje"),
      f(20, "Archidruida", "Forma salvaje ilimitada e ignoras componentes de conjuro"),
    ],
    subclasses: [
      {
        name: "Círculo de la Tierra",
        features: [
          f(2, "Recuperación natural", "Recuperas espacios de conjuro en un descanso corto 1/día; truco extra"),
          f(3, "Conjuros de círculo", "Conjuros adicionales según tu terreno (bosque, montaña…)"),
          f(6, "Zancada por la tierra", "El terreno difícil natural no te frena; inmune a plantas mágicas hostiles"),
          f(10, "Protección de la naturaleza", "Inmune a veneno y enfermedad; los feéricos no te hechizan"),
          f(14, "Santuario natural", "Bestias y plantas dudan en atacarte (SAB o pierden el ataque)"),
        ],
      },
      {
        name: "Círculo de la Luna",
        features: [
          f(2, "Forma salvaje de combate", "Transfórmate como acción adicional; bestias hasta VD 1"),
          f(6, "Golpes primigenios", "Tus ataques en forma salvaje cuentan como mágicos; formas hasta VD nivel/3"),
          f(10, "Forma salvaje elemental", "Gasta 2 usos para transformarte en elemental de aire, tierra, fuego o agua"),
          f(14, "Mil formas", "Alterar el propio aspecto a voluntad"),
        ],
      },
    ],
  },
  Explorador: {
    spellAbility: "wis",
    subclassLabel: "Arquetipo de explorador",
    subclassLevel: 3,
    features: [
      f(1, "Enemigo predilecto", "Ventaja para rastrear y recordar información sobre un tipo de criatura"),
      f(1, "Explorador nato", "Terreno predilecto: viajas y rastreas sin trabas en él"),
      f(2, "Lanzamiento de conjuros", "Lanzas conjuros de explorador usando Sabiduría"),
      f(2, "Estilo de combate", "Arquería (+2 a distancia), Defensa (+1 CA), Duelo o Dos Armas"),
      f(3, "Consciencia primigenia", "Detecta si hay aberraciones, feéricos, no muertos… a 1 milla"),
      f(5, "Ataque adicional", "Atacas dos veces al usar la acción de Atacar"),
      f(8, "Zancada por la tierra", "El terreno difícil no te ralentiza"),
      f(10, "Esconderse a plena vista", "Camúflate: +10 a Sigilo mientras no te muevas"),
      f(14, "Desaparecer", "Acción de Esconderse como acción adicional"),
      f(18, "Sentidos salvajes", "Percibes criaturas invisibles a 30 pies"),
      f(20, "Asesino de enemigos", "+SAB al ataque o al daño contra tu enemigo predilecto 1/turno"),
    ],
    subclasses: [
      {
        name: "Cazador",
        features: [
          f(3, "Presa del cazador", "Asesino de colosos, Azote de gigantes o Asesino de hordas"),
          f(7, "Táctica defensiva", "Escapa de la horda, Defensa multiataque o Voluntad de acero"),
          f(11, "Ataque múltiple", "Descarga (ataque a todos a 10 pies) o Ataque torbellino"),
          f(15, "Defensa superior", "Evasión, Resistir la marea o Esquiva asombrosa"),
        ],
      },
      {
        name: "Señor de las Bestias",
        features: [
          f(3, "Compañero animal", "Una bestia VD ¼ lucha a tus órdenes"),
          f(7, "Entrenamiento excepcional", "Tu bestia Esprinta, se Retira o Esquiva con tu acción adicional"),
          f(11, "Furia bestial", "Tu bestia ataca dos veces cuando le ordenas atacar"),
          f(15, "Compartir conjuros", "Tus conjuros de «tú mismo» también afectan a tu bestia"),
        ],
      },
    ],
  },
  Guerrero: {
    spellAbility: "",
    subclassLabel: "Arquetipo marcial",
    subclassLevel: 3,
    features: [
      f(1, "Estilo de combate", "Arquería, Defensa, Duelo, Gran Arma, Protección o Dos Armas"),
      f(1, "Tomar aliento", "Acción adicional: recuperas 1d10 + nivel PG, 1/descanso"),
      f(2, "Oleada de acción", "Una acción extra en tu turno, 1/descanso (2 usos a nv 17)"),
      f(5, "Ataque adicional", "Atacas dos veces (tres a nv 11, cuatro a nv 20)"),
      f(9, "Indómito", "Repite una salvación fallida, 1/descanso largo (más usos a nv 13 y 17)"),
    ],
    subclasses: [
      {
        name: "Campeón",
        features: [
          f(3, "Crítico mejorado", "Crítico con 19 o 20"),
          f(7, "Atleta destacado", "+½ competencia a pruebas físicas sin competencia; saltos más largos"),
          f(10, "Estilo de combate adicional", "Un segundo estilo de combate"),
          f(15, "Crítico superior", "Crítico con 18, 19 o 20"),
          f(18, "Superviviente", "Al inicio de tu turno con menos de la mitad de PG, recuperas 5 + CON"),
        ],
      },
      {
        name: "Maestro de Batalla",
        features: [
          f(3, "Superioridad en combate", "4 dados de superioridad (d8) y 3 maniobras: Derribar, Desarmar…"),
          f(7, "Conoce a tu enemigo", "Estudia a una criatura: sabes si es superior a ti en FUE, CA, PG…"),
          f(10, "Maniobras mejoradas", "Dados de superioridad d10 y más maniobras"),
          f(15, "Implacable", "Recuperas un dado de superioridad al tirar iniciativa sin ninguno"),
          f(18, "Dados superiores", "Dados de superioridad d12"),
        ],
      },
      {
        name: "Caballero Sobrenatural",
        features: [
          f(3, "Lanzamiento de conjuros", "Conjuros de la lista del mago usando Inteligencia (hasta nv 4)"),
          f(3, "Vínculo con el arma", "Tu arma vinculada no puede ser desarmada y acude a tu mano"),
          f(7, "Magia de guerra", "Tras lanzar un truco, un ataque con arma como acción adicional"),
          f(10, "Golpe sobrenatural", "Quien recibe tu ataque tiene desventaja contra tu próximo conjuro"),
          f(15, "Carga arcana", "Teletransporte de 30 pies al usar Oleada de acción"),
          f(18, "Magia de guerra mejorada", "Tras cualquier conjuro, un ataque con arma como adicional"),
        ],
      },
    ],
  },
  Hechicero: {
    spellAbility: "cha",
    subclassLabel: "Origen mágico",
    subclassLevel: 1,
    features: [
      f(1, "Lanzamiento de conjuros", "Lanzas conjuros de hechicero usando Carisma"),
      f(2, "Puntos de hechicería", "Conviértelos en espacios de conjuro y viceversa"),
      f(3, "Metamagia", "2 opciones: Conjuro Acelerado, Gemelo, Sutil, Potenciado… (más a nv 10 y 17)"),
      f(20, "Restauración hechicera", "Recuperas 4 puntos de hechicería en cada descanso corto"),
    ],
    subclasses: [
      {
        name: "Linaje Dracónico",
        features: [
          f(1, "Resiliencia dracónica", "+1 PG por nivel; CA 13 + DES sin armadura"),
          f(6, "Afinidad elemental", "+CAR al daño del tipo de tu dragón; resistencia gastando 1 punto"),
          f(14, "Alas de dragón", "Alas: velocidad de vuelo igual a tu velocidad"),
          f(18, "Presencia dracónica", "Aura de 60 pies que asombra o asusta (SAB anula)"),
        ],
      },
      {
        name: "Magia Salvaje",
        features: [
          f(1, "Oleada de magia salvaje", "Tus conjuros pueden desatar un efecto aleatorio (tabla d100)"),
          f(1, "Mareas de caos", "Ventaja en una tirada; se recarga al sufrir una oleada"),
          f(6, "Doblar la suerte", "Reacción: ±1d4 a la tirada de otra criatura (1 punto)"),
          f(14, "Caos controlado", "Tira dos veces en la tabla de oleada y elige"),
          f(18, "Bombardeo hechicero", "Tus dados de daño máximos se vuelven a tirar y suman"),
        ],
      },
    ],
  },
  Mago: {
    spellAbility: "int",
    subclassLabel: "Escuela arcana",
    subclassLevel: 2,
    features: [
      f(1, "Lanzamiento de conjuros", "Libro de conjuros; preparas conjuros usando Inteligencia"),
      f(1, "Recuperación arcana", "Recuperas espacios (½ nivel) en un descanso corto, 1/día"),
      f(18, "Maestría de conjuros", "Un conjuro de nv 1 y otro de nv 2 a voluntad sin gastar espacios"),
      f(20, "Conjuros distintivos", "Dos conjuros de nv 3 una vez por descanso sin gastar espacio"),
    ],
    subclasses: [
      {
        name: "Escuela de Abjuración",
        features: [
          f(2, "Custodia arcana", "Escudo de PG que absorbe daño al lanzar abjuraciones"),
          f(6, "Custodia proyectada", "Reacción: tu custodia absorbe el daño de un aliado"),
          f(10, "Abjuración mejorada", "+competencia a Contrahechizo y Disipar magia"),
          f(14, "Resistencia a conjuros", "Ventaja en salvaciones contra conjuros; resistencia a su daño"),
        ],
      },
      {
        name: "Escuela de Adivinación",
        features: [
          f(2, "Portento", "Tira 2d20 al descansar; sustituye cualquier tirada por ellos"),
          f(6, "Adivinación experta", "Recuperas espacios al lanzar adivinaciones de nv 2+"),
          f(10, "El tercer ojo", "Visión en la oscuridad, ver invisible o leer cualquier idioma"),
          f(14, "Portento mayor", "3 tiradas de portento"),
        ],
      },
      {
        name: "Escuela de Conjuración",
        features: [
          f(2, "Conjuración menor", "Crea un objeto simple de hasta 10 lb"),
          f(6, "Transposición benigna", "Teletransporte de 30 pies o intercambio con un aliado"),
          f(10, "Conjuración centrada", "El daño no rompe tu concentración en conjuraciones"),
          f(14, "Convocación duradera", "Tus criaturas convocadas no desaparecen al perder concentración"),
        ],
      },
      {
        name: "Escuela de Encantamiento",
        features: [
          f(2, "Mirada hipnótica", "Hechiza a una criatura adyacente mientras la mires"),
          f(6, "Encantamiento instintivo", "Reacción: desvía a otro objetivo el ataque que te lanzan"),
          f(10, "Dividir encantamiento", "Tus encantamientos de un objetivo afectan a dos"),
          f(14, "Alterar recuerdos", "La criatura hechizada olvida lo que le hiciste"),
        ],
      },
      {
        name: "Escuela de Evocación",
        features: [
          f(2, "Esculpir conjuros", "Tus aliados superan automáticamente tus áreas de daño"),
          f(6, "Truco potente", "Tus trucos hacen medio daño incluso si fallan la salvación"),
          f(10, "Evocación potenciada", "+INT al daño de tus evocaciones"),
          f(14, "Sobrecarga", "Daño máximo con evocaciones de nv 5 o menos (con riesgo)"),
        ],
      },
      {
        name: "Escuela de Ilusión",
        features: [
          f(2, "Ilusión menor mejorada", "Sonido e imagen a la vez con el truco"),
          f(6, "Ilusiones maleables", "Cambia tus ilusiones con una acción"),
          f(10, "Yo ilusorio", "Reacción: un duplicado absorbe un ataque que te impactaría"),
          f(14, "Realidad ilusoria", "Haz real un objeto de tus ilusiones durante 1 minuto"),
        ],
      },
      {
        name: "Escuela de Nigromancia",
        features: [
          f(2, "Cosecha sombría", "Recuperas PG al matar con conjuros"),
          f(6, "Servidumbre no muerta", "Tus esqueletos y zombis tienen más PG y daño"),
          f(10, "Curtido contra la no-muerte", "Resistencia necrótica; tus PG máximos no pueden reducirse"),
          f(14, "Dominar muertos vivientes", "Toma el control de un muerto viviente (CAR anula)"),
        ],
      },
      {
        name: "Escuela de Transmutación",
        features: [
          f(2, "Alquimia menor", "Transforma un material en otro (madera en piedra…)"),
          f(6, "Piedra del transmutador", "Piedra con un beneficio: velocidad, resistencia, visión…"),
          f(10, "Cambiaformas", "Lanza Polimorfar sobre ti sin gastar espacio"),
          f(14, "Maestro transmutador", "Gran transmutación: rejuvenecer, restaurar, transmutar rocas…"),
        ],
      },
    ],
  },
  Monje: {
    spellAbility: "",
    subclassLabel: "Tradición monástica",
    subclassLevel: 3,
    features: [
      f(1, "Defensa sin armadura", "Sin armadura, tu CA es 10 + DES + SAB"),
      f(1, "Artes marciales", "d4 sin armas (crece); ataque sin armas como acción adicional"),
      f(2, "Ki", "Ráfaga de golpes, Defensa paciente y Paso del viento gastando puntos"),
      f(2, "Movimiento sin armadura", "+10 pies de velocidad (crece con el nivel)"),
      f(3, "Desviar proyectiles", "Reacción: reduce 1d10 + DES + nivel el daño a distancia; devuélvelo"),
      f(4, "Caída lenta", "Reacción: reduce el daño de caída 5 × nivel"),
      f(5, "Ataque adicional", "Atacas dos veces al usar la acción de Atacar"),
      f(5, "Golpe aturdidor", "1 ki: el impactado queda aturdido (CON anula)"),
      f(6, "Golpes potenciados con ki", "Tus golpes sin armas cuentan como mágicos"),
      f(7, "Evasión", "Salvación de DES: ningún daño si la superas, mitad si fallas"),
      f(7, "Quietud mental", "Acción: termina un efecto de hechizo o miedo sobre ti"),
      f(10, "Pureza corporal", "Inmune a veneno y enfermedad"),
      f(13, "Lengua del sol y la luna", "Entiendes y te hacen entender en cualquier idioma"),
      f(14, "Alma de diamante", "Competencia en todas las salvaciones; repite fallos con 1 ki"),
      f(15, "Cuerpo atemporal", "No envejeces ni necesitas comida ni agua"),
      f(18, "Cuerpo vacío", "4 ki: invisibilidad 1 min con resistencia a casi todo el daño"),
      f(20, "Perfección personal", "Recuperas 4 ki al tirar iniciativa sin puntos"),
    ],
    subclasses: [
      {
        name: "Camino de la Mano Abierta",
        features: [
          f(3, "Técnica de la mano abierta", "Con Ráfaga de golpes: derriba, empuja 15 pies o niega reacciones"),
          f(6, "Plenitud corporal", "Acción: recuperas nivel × 3 PG, 1/descanso largo"),
          f(11, "Tranquilidad", "Efecto de Santuario sobre ti entre descansos"),
          f(17, "Palma temblorosa", "Vibraciones letales: reduce a 0 PG (CON: 10d10 en su lugar)"),
        ],
      },
      {
        name: "Camino de la Sombra",
        features: [
          f(3, "Artes de la sombra", "2 ki: Oscuridad, Visión en la oscuridad, Pasar sin rastro o Silencio"),
          f(6, "Paso sombrío", "Teletransporte de 60 pies entre sombras; ventaja en el siguiente ataque"),
          f(11, "Manto de sombras", "Invisible en penumbra u oscuridad"),
          f(17, "Oportunista", "Reacción: golpea a quien reciba un ataque de otro a 5 pies de ti"),
        ],
      },
      {
        name: "Camino de los Cuatro Elementos",
        features: [
          f(3, "Disciplinas elementales", "Gasta ki en efectos de aire, agua, fuego y tierra"),
          f(6, "Disciplina adicional", "Nueva disciplina elemental (otra a nv 11 y 17)"),
        ],
      },
    ],
  },
  Paladín: {
    spellAbility: "cha",
    subclassLabel: "Juramento sagrado",
    subclassLevel: 3,
    features: [
      f(1, "Sentido divino", "Detecta celestiales, infernales y muertos vivientes a 60 pies"),
      f(1, "Imposición de manos", "Reserva de curación de nivel × 5 PG por contacto"),
      f(2, "Estilo de combate", "Defensa, Duelo, Gran Arma o Protección"),
      f(2, "Lanzamiento de conjuros", "Lanzas conjuros de paladín usando Carisma"),
      f(2, "Castigo divino", "Gasta un espacio al impactar: +2d8 radiante (+1d8 por nivel extra)"),
      f(3, "Salud divina", "Inmune a las enfermedades"),
      f(5, "Ataque adicional", "Atacas dos veces al usar la acción de Atacar"),
      f(6, "Aura de protección", "+CAR a las salvaciones tuyas y de aliados a 10 pies"),
      f(10, "Aura de valor", "Tú y tus aliados a 10 pies sois inmunes al miedo"),
      f(11, "Castigo divino mejorado", "+1d8 radiante a todos tus ataques cuerpo a cuerpo"),
      f(14, "Toque purificador", "Termina un conjuro sobre ti o un aliado, CAR veces al día"),
    ],
    subclasses: [
      {
        name: "Juramento de Devoción",
        features: [
          f(3, "Canalizar: Arma sagrada", "+CAR a los ataques con un arma durante 1 minuto"),
          f(3, "Canalizar: Expulsar a los impíos", "Expulsa infernales y muertos vivientes (SAB anula)"),
          f(7, "Aura de devoción", "Tú y tus aliados a 10 pies no podéis ser hechizados"),
          f(15, "Pureza de espíritu", "Protección contra el bien y el mal permanente"),
          f(20, "Nimbo sagrado", "Luz solar: 10 radiante a enemigos y ventaja contra magia infernal"),
        ],
      },
      {
        name: "Juramento de los Antiguos",
        features: [
          f(3, "Canalizar: Ira de la naturaleza", "Enredaderas espectrales apresan (FUE/DES anula)"),
          f(3, "Canalizar: Expulsar a los infieles", "Expulsa feéricos e infernales (SAB anula)"),
          f(7, "Aura de custodia", "Tú y tus aliados a 10 pies: resistencia al daño de conjuros"),
          f(15, "Centinela imperecedero", "Al caer a 0 PG, quédate a 1, una vez al día"),
          f(20, "Campeón antiguo", "Forma de fuerza natural: regeneración y conjuros acelerados"),
        ],
      },
      {
        name: "Juramento de Venganza",
        features: [
          f(3, "Canalizar: Abjurar enemigo", "Asusta y frena a una criatura (SAB parcial)"),
          f(3, "Canalizar: Voto de enemistad", "Ventaja en ataques contra un objetivo 1 minuto"),
          f(7, "Vengador implacable", "Tras un ataque de oportunidad, muévete media velocidad gratis"),
          f(15, "Alma de venganza", "Reacción: ataque contra tu enemigo jurado cuando ataca"),
          f(20, "Ángel vengador", "Alas, vuelo 60 pies y aura que asusta 1 hora"),
        ],
      },
    ],
  },
  Pícaro: {
    spellAbility: "",
    subclassLabel: "Arquetipo de pícaro",
    subclassLevel: 3,
    features: [
      f(1, "Pericia", "Duplica tu competencia en 2 habilidades (2 más a nv 6)"),
      f(1, "Ataque furtivo", "+1d6 al daño con ventaja o aliado adyacente (+1d6 cada 2 niveles)"),
      f(1, "Jerga de ladrones", "Idioma secreto del hampa"),
      f(2, "Acción astuta", "Esprintar, Retirarse o Esconderse como acción adicional"),
      f(5, "Esquiva asombrosa", "Reacción: reduce a la mitad el daño de un ataque que veas"),
      f(7, "Evasión", "Salvación de DES: ningún daño si la superas, mitad si fallas"),
      f(11, "Talento fiable", "Mínimo 10 en el dado en pruebas con competencia"),
      f(14, "Sentido ciego", "Percibes criaturas ocultas e invisibles a 10 pies"),
      f(15, "Mente escurridiza", "Competencia en salvaciones de SAB"),
      f(18, "Elusivo", "Ningún ataque tiene ventaja contra ti si no estás incapacitado"),
      f(20, "Golpe de suerte", "Convierte un fallo en impacto o un fallo de prueba en 20, 1/descanso"),
    ],
    subclasses: [
      {
        name: "Ladrón",
        features: [
          f(3, "Manos rápidas", "Juego de Manos, abrir cerraduras o usar objetos como acción adicional"),
          f(3, "Trabajo de segundo piso", "Escalas sin coste extra; saltos más largos"),
          f(9, "Sigilo supremo", "Ventaja en Sigilo si te mueves media velocidad o menos"),
          f(13, "Usar objeto mágico", "Ignoras los requisitos de clase y raza de los objetos mágicos"),
          f(17, "Reflejos de ladrón", "Dos turnos en la primera ronda de combate"),
        ],
      },
      {
        name: "Asesino",
        features: [
          f(3, "Asesinar", "Ventaja contra quien no haya actuado; críticos automáticos a sorprendidos"),
          f(3, "Competencias adicionales", "Kit de disfraz y kit de envenenador"),
          f(9, "Experto en infiltración", "Crea identidades falsas convincentes"),
          f(13, "Impostor", "Imita el habla, la escritura y los gestos de otra persona"),
          f(17, "Golpe mortal", "Duplica el daño contra criaturas sorprendidas (CON anula)"),
        ],
      },
      {
        name: "Embaucador Arcano",
        features: [
          f(3, "Lanzamiento de conjuros", "Conjuros de la lista del mago usando Inteligencia (hasta nv 4)"),
          f(3, "Mano de mago mejorada", "Tu mano de mago es invisible: roba y planta objetos"),
          f(9, "Emboscada mágica", "Desventaja a la salvación contra tu conjuro si estás oculto"),
          f(13, "Embaucador versátil", "Ventaja en ataques contra el objetivo de tu mano de mago"),
          f(17, "Ladrón de conjuros", "Reacción: roba el conjuro que te lanzan (fallando su salvación)"),
        ],
      },
    ],
  },
};

// ---------- Conjuros ----------

export interface SpellDef {
  name: string;
  level: number; // 0 = truco
  classes: string[];
  description: string;
}

const CLASS_CODES: Record<string, string> = {
  Ba: "Bardo",
  Br: "Brujo",
  Cl: "Clérigo",
  Dr: "Druida",
  Ex: "Explorador",
  He: "Hechicero",
  Ma: "Mago",
  Pa: "Paladín",
};

const s = (level: number, name: string, codes: string, description: string): SpellDef => ({
  name,
  level,
  classes: codes.split(" ").map((code) => CLASS_CODES[code]),
  description,
});

/** Conjuros del SRD por nivel con las clases que pueden aprenderlos. */
export const SPELLS: SpellDef[] = [
  // Trucos
  s(0, "Burla viciosa", "Ba", "1d4 psíquico y desventaja en su próximo ataque (SAB anula)"),
  s(0, "Descarga sobrenatural", "Br", "1d10 fuerza a 120 pies; más rayos al subir de nivel"),
  s(0, "Druidismo", "Dr", "Efectos naturales menores: predecir el tiempo, abrir flores…"),
  s(0, "Garrote", "Dr", "Tu bastón o garrote golpea con tu característica de conjuro y d8"),
  s(0, "Golpe certero", "Ba He Ma", "Ventaja en tu próximo ataque contra el objetivo"),
  s(0, "Ilusión menor", "Ba Br He Ma", "Un sonido o la imagen de un objeto durante 1 minuto"),
  s(0, "Llama sagrada", "Cl", "1d8 radiante a 60 pies; ignora cobertura (DES anula)"),
  s(0, "Luces danzantes", "Ba He Ma", "Hasta 4 luces flotantes que mueves a voluntad"),
  s(0, "Luz", "Ba Cl He Ma", "Un objeto ilumina 20 pies durante 1 hora"),
  s(0, "Mano de mago", "Ba Br He Ma", "Mano espectral que manipula objetos a 30 pies"),
  s(0, "Mensaje", "Ba He Ma", "Susurra a alguien a 120 pies y escucha su respuesta"),
  s(0, "Orientación divina", "Cl Dr", "+1d4 a una prueba de característica del objetivo"),
  s(0, "Preservar la vida", "Cl", "Estabiliza a una criatura moribunda a 0 PG"),
  s(0, "Prestidigitación", "Ba Br He Ma", "Pequeños efectos mágicos inofensivos"),
  s(0, "Producir llama", "Dr", "Llama en la mano: da luz o lanza 1d8 de fuego a 30 pies"),
  s(0, "Rayo de escarcha", "He Ma", "1d8 frío a 60 pies y −10 pies de velocidad"),
  s(0, "Remendar", "Ba Cl Dr He Ma", "Repara una rotura pequeña en un objeto"),
  s(0, "Resistencia", "Cl Dr", "+1d4 a una salvación del objetivo"),
  s(0, "Rociada de veneno", "Br Dr He Ma", "1d12 veneno a 10 pies (CON anula)"),
  s(0, "Saeta de fuego", "He Ma", "1d10 fuego a 120 pies; prende objetos"),
  s(0, "Salpicadura de ácido", "He Ma", "1d6 ácido a una o dos criaturas juntas (DES anula)"),
  s(0, "Taumaturgia", "Cl", "Efectos menores: voz atronadora, llamas que titilan, temblores…"),
  s(0, "Toque electrizante", "He Ma", "1d8 eléctrico; ventaja contra armadura de metal"),
  s(0, "Toque gélido", "Br He Ma", "1d8 necrótico a 120 pies; no puede curarse hasta tu turno"),
  // Nivel 1
  s(1, "Armadura de mago", "He Ma", "CA 13 + DES sin armadura durante 8 horas"),
  s(1, "Bendecir", "Cl Pa", "+1d4 a ataques y salvaciones de hasta 3 criaturas"),
  s(1, "Buenas bayas", "Dr Ex", "10 bayas que curan 1 PG y alimentan un día"),
  s(1, "Caída de pluma", "Ba He Ma", "Reacción: hasta 5 criaturas caen suavemente"),
  s(1, "Comprensión de idiomas", "Ba Br He Ma", "Entiendes cualquier idioma hablado o escrito 1 hora"),
  s(1, "Curar heridas", "Ba Cl Dr Ex Pa", "1d8 + característica PG por contacto"),
  s(1, "Detectar magia", "Ba Cl Dr Ex He Ma Pa", "Percibes auras mágicas a 30 pies (ritual)"),
  s(1, "Disfrazarse", "Ba He Ma", "Cambia tu aspecto durante 1 hora"),
  s(1, "Dormir", "Ba He Ma", "5d8 PG de criaturas caen dormidas (las más débiles primero)"),
  s(1, "Enmarañar", "Dr", "Zona de 20 pies apresa a las criaturas (FUE libera)"),
  s(1, "Escudo", "He Ma", "Reacción: +5 a la CA hasta tu próximo turno"),
  s(1, "Escudo de la fe", "Cl Pa", "+2 a la CA de una criatura (concentración, 10 min)"),
  s(1, "Fuego feérico", "Dr", "Los objetivos brillan: ventaja para atacarles (DES anula)"),
  s(1, "Hechizar persona", "Ba Br Dr He Ma", "Un humanoide te considera amigo (SAB anula)"),
  s(1, "Heroísmo", "Ba Pa", "PG temporales cada turno e inmunidad al miedo (concentración)"),
  s(1, "Infligir heridas", "Cl", "3d10 necrótico por contacto"),
  s(1, "Maleficio", "Br", "+1d6 necrótico al dañar al objetivo y desventaja en una característica"),
  s(1, "Manos ardientes", "He Ma", "3d6 fuego en cono de 15 pies (DES mitad)"),
  s(1, "Marca del cazador", "Ex", "+1d6 al daño contra tu presa (concentración)"),
  s(1, "Niebla oscura", "Dr Ex He Ma", "Esfera de niebla de 20 pies que bloquea la visión"),
  s(1, "Ola atronadora", "Ba Dr He Ma", "2d8 trueno en 15 pies y empuja 10 pies (CON mitad)"),
  s(1, "Palabra de curación", "Ba Cl", "1d4 + característica PG a 60 pies (acción adicional)"),
  s(1, "Perdición", "Ba Cl", "−1d4 a ataques y salvaciones de hasta 3 criaturas (CAR anula)"),
  s(1, "Protección contra el bien y el mal", "Br Cl Ma Pa", "Protege contra aberraciones, infernales, no muertos…"),
  s(1, "Proyectil mágico", "He Ma", "3 dardos de 1d4+1 fuerza que impactan siempre"),
  s(1, "Rayo de brujería", "Br He Ma", "1d12 eléctrico continuo mientras mantengas el rayo"),
  s(1, "Rociada de color", "Ba He Ma", "6d10 PG de criaturas quedan cegadas 1 ronda"),
  s(1, "Salto", "Dr Ex He Ma", "Triplica la distancia de salto de una criatura"),
  s(1, "Santuario", "Cl", "Para atacar al protegido hay que superar una salvación de SAB"),
  s(1, "Sirviente invisible", "Ba Br Ma", "Fuerza invisible que hace tareas sencillas"),
  s(1, "Zancada prodigiosa", "Ba Dr Ex He Ma", "+10 pies de velocidad durante 1 hora"),
  // Nivel 2
  s(2, "Agrandar/Reducir", "He Ma", "Duplica o encoge al objetivo: ±1d4 al daño"),
  s(2, "Arma espiritual", "Cl", "Arma flotante: 1d8 + característica (acción adicional)"),
  s(2, "Ayuda", "Cl Pa", "+5 PG máximos y actuales a 3 criaturas durante 8 horas"),
  s(2, "Ceguera/Sordera", "Ba Cl He Ma", "Ciega o ensordece al objetivo (CON anula)"),
  s(2, "Contorno borroso", "He Ma", "Desventaja para atacarte (concentración)"),
  s(2, "Encontrar corcel", "Pa", "Invoca una montura espiritual leal"),
  s(2, "Esfera flamígera", "Dr Ma", "Esfera rodante: 2d6 fuego a quien acabe cerca"),
  s(2, "Imagen múltiple", "Br He Ma", "3 duplicados ilusorios que absorben ataques"),
  s(2, "Inmovilizar persona", "Ba Br Cl Dr He Ma", "Paraliza a un humanoide (SAB anula cada turno)"),
  s(2, "Invisibilidad", "Ba Br He Ma", "Invisible hasta atacar o lanzar un conjuro (1 h)"),
  s(2, "Llama continua", "Cl Ma", "Llama eterna que no consume ni quema"),
  s(2, "Localizar objeto", "Ba Cl Dr Ex Ma Pa", "Sientes la dirección de un objeto a 1000 pies"),
  s(2, "Oración de curación", "Cl", "2d8 + característica PG a hasta 6 criaturas"),
  s(2, "Oscuridad", "Br He Ma", "Esfera de oscuridad mágica de 15 pies"),
  s(2, "Pasar sin dejar rastro", "Dr Ex", "+10 a Sigilo para el grupo y sin huellas"),
  s(2, "Paso brumoso", "Br He Ma", "Teletransporte de 30 pies (acción adicional)"),
  s(2, "Piel de corteza", "Dr Ex", "La CA del objetivo no baja de 16 (concentración)"),
  s(2, "Rayo abrasador", "He Ma", "3 rayos de 2d6 fuego a objetivos a 120 pies"),
  s(2, "Rayo de luna", "Dr", "2d10 radiante en un cilindro que puedes mover"),
  s(2, "Restablecimiento menor", "Ba Cl Dr Ex Pa", "Cura una enfermedad o condición: ceguera, parálisis…"),
  s(2, "Silencio", "Ba Cl Ex", "Esfera de 20 pies sin sonido: bloquea conjuros verbales (ritual)"),
  s(2, "Sugestión", "Ba Br He Ma", "El objetivo sigue una orden razonable hasta 8 h (SAB anula)"),
  s(2, "Telaraña", "He Ma", "Cubo de 20 pies de telarañas que apresan (FUE libera)"),
  s(2, "Visión en la oscuridad", "Dr Ex He Ma", "El objetivo ve en la oscuridad 60 pies durante 8 h"),
  s(2, "Zona de verdad", "Ba Cl Pa", "En 15 pies no se puede mentir a sabiendas (CAR anula)"),
  // Nivel 3
  s(3, "Acelerar", "He Ma", "+2 CA, velocidad doble y una acción extra limitada"),
  s(3, "Animar a los muertos", "Cl Ma", "Crea un esqueleto o zombi que obedece tus órdenes"),
  s(3, "Bola de fuego", "He Ma", "8d6 fuego en 20 pies de radio (DES mitad)"),
  s(3, "Caminar sobre el agua", "Cl Dr Ex He", "10 criaturas caminan sobre líquidos 1 hora (ritual)"),
  s(3, "Círculo mágico", "Br Cl Ma Pa", "Cilindro que bloquea a un tipo de criatura"),
  s(3, "Clarividencia", "Ba Cl He Ma", "Sensor invisible para ver u oír un lugar a 1 milla"),
  s(3, "Contrahechizo", "Br He Ma", "Reacción: anula un conjuro de nv 3 o menos"),
  s(3, "Crecimiento vegetal", "Ba Dr Ex", "Terreno difícil ×4 o cosecha abundante"),
  s(3, "Disipar magia", "Ba Br Cl Dr He Ma Pa", "Termina conjuros de nv 3 o menos sobre el objetivo"),
  s(3, "Don de lenguas", "Ba Br Cl He Ma", "Habla y entiende cualquier idioma 1 hora"),
  s(3, "Espíritus guardianes", "Cl", "3d8 radiante o necrótico a enemigos en 15 pies (SAB mitad)"),
  s(3, "Forma gaseosa", "Br He Ma", "El objetivo se vuelve una nube brumosa que vuela"),
  s(3, "Llamar al relámpago", "Dr", "3d10 eléctrico cada turno bajo una tormenta"),
  s(3, "Luz del día", "Cl Dr Ex He Pa", "Esfera de luz solar de 60 pies; disipa oscuridad mágica"),
  s(3, "Miedo", "Ba Br He Ma", "Cono de 30 pies: los asustados sueltan lo que llevan y huyen"),
  s(3, "Muro de viento", "Dr Ex", "Muro de viento: 3d8 y desvía proyectiles"),
  s(3, "Palabra de curación en masa", "Ba Cl", "1d4 + característica PG a 6 criaturas (adicional)"),
  s(3, "Protección contra energía", "Cl Dr Ex He Ma", "Resistencia a ácido, frío, fuego, rayo o trueno"),
  s(3, "Ralentizar", "He Ma", "Hasta 6 criaturas: mitad de velocidad y sin reacciones (SAB anula)"),
  s(3, "Relámpago", "He Ma", "8d6 eléctrico en línea de 100 pies (DES mitad)"),
  s(3, "Respirar agua", "Dr Ex He Ma", "10 criaturas respiran bajo el agua 24 h (ritual)"),
  s(3, "Revivificar", "Cl Pa", "Devuelve la vida a alguien muerto hace menos de 1 minuto"),
  s(3, "Toque vampírico", "Br Ma", "3d6 necrótico por contacto; te curas la mitad"),
  s(3, "Volar", "Br He Ma", "El objetivo vuela a 60 pies durante 10 minutos"),
  // Nivel 4
  s(4, "Confusión", "Ba Dr He Ma", "Los afectados actúan al azar cada turno (SAB anula)"),
  s(4, "Destierro", "Br Cl He Ma Pa", "Envía al objetivo a otro plano (CAR anula)"),
  s(4, "Dominar bestia", "Dr He", "Controlas a una bestia (SAB anula)"),
  s(4, "Escudo de fuego", "Ma", "Aura fría o cálida: 2d8 a quien te golpee cuerpo a cuerpo"),
  s(4, "Guardián de la fe", "Cl", "Centinela espectral: 20 radiante a enemigos cercanos (DES mitad)"),
  s(4, "Invisibilidad mejorada", "Ba Br He Ma", "Invisible aunque ataques o lances conjuros"),
  s(4, "Libertad de movimiento", "Ba Cl Dr Ex", "Ignora terreno difícil, parálisis y apresamiento"),
  s(4, "Localizar criatura", "Ba Cl Dr Ex Ma Pa", "Sientes la dirección de una criatura a 1000 pies"),
  s(4, "Marchitar", "Br Dr He Ma", "8d8 necrótico a una criatura (CON mitad)"),
  s(4, "Moldear la piedra", "Cl Dr Ma", "Remodela la piedra: pasajes, puertas, muros…"),
  s(4, "Muro de fuego", "Dr He Ma", "Muro de 60 pies: 5d8 fuego al cruzarlo o acabar cerca"),
  s(4, "Piedra de piel", "Dr Ex He Ma", "Resistencia al daño físico no mágico (concentración)"),
  s(4, "Polimorfar", "Ba Dr He Ma", "Transforma a una criatura en una bestia (SAB anula)"),
  s(4, "Puerta dimensional", "Ba Br He Ma", "Teletransporte de 500 pies contigo y un aliado"),
  s(4, "Tentáculos negros", "Ma", "Zona de 20 pies que apresa y hace 3d6 contundente"),
  // Nivel 5
  s(5, "Alzar a los muertos", "Ba Cl Pa", "Resucita a alguien muerto hace menos de 10 días"),
  s(5, "Animar objetos", "Ba He Ma", "Hasta 10 objetos cobran vida y luchan por ti"),
  s(5, "Círculo de teletransporte", "Ba He Ma", "Portal a un círculo permanente que conozcas"),
  s(5, "Comunión", "Cl", "3 preguntas de sí o no a tu deidad (ritual)"),
  s(5, "Comunión con la naturaleza", "Dr Ex", "Conoces el terreno, criaturas y aguas en 3 millas (ritual)"),
  s(5, "Cono de frío", "He Ma", "8d8 frío en cono de 60 pies (CON mitad)"),
  s(5, "Consagrar", "Cl", "Sacraliza una zona: los infernales y no muertos no entran"),
  s(5, "Curar heridas en masa", "Ba Cl Dr", "3d8 + característica PG a hasta 6 criaturas"),
  s(5, "Dominar persona", "Ba He Ma", "Controlas a un humanoide (SAB anula)"),
  s(5, "Escudriñar", "Ba Br Cl Dr Ma", "Ves y oyes a una criatura en cualquier lugar (SAB anula)"),
  s(5, "Golpe flamígero", "Cl", "4d6 fuego + 4d6 radiante en columna de 10 pies (DES mitad)"),
  s(5, "Muro de piedra", "Dr He Ma", "Muro de piedra que puede hacerse permanente"),
  s(5, "Onda destructiva", "Pa", "5d6 trueno + 5d6 radiante a 30 pies y derriba (CON anula)"),
  s(5, "Plaga de insectos", "Cl Dr He", "4d10 perforante en esfera de 20 pies (CON mitad)"),
  s(5, "Restablecimiento mayor", "Ba Cl Dr", "Elimina maldiciones, petrificación y drenados"),
  s(5, "Telequinesis", "He Ma", "Mueve criaturas u objetos de hasta 1000 lb con la mente"),
  // Nivel 6
  s(6, "Cadena de relámpagos", "He Ma", "10d8 eléctrico que salta a 3 objetivos más (DES mitad)"),
  s(6, "Danza irresistible", "Ba Ma", "El objetivo baila sin control (SAB para parar)"),
  s(6, "Dañar", "Cl", "14d6 necrótico y reduce los PG máximos (CON mitad)"),
  s(6, "Desintegrar", "He Ma", "10d6+40 fuerza; si cae a 0 PG queda hecho polvo (DES anula)"),
  s(6, "Festín de héroes", "Cl Dr", "Banquete: inmunes a miedo y veneno, +2d10 PG máximos"),
  s(6, "Globo de invulnerabilidad", "He Ma", "Esfera inmune a conjuros de nv 5 o menos"),
  s(6, "Mal de ojo", "Ba Br He Ma", "Tu mirada asusta, enferma o duerme (SAB anula)"),
  s(6, "Muro de hielo", "Ma", "Muro de hielo: 10d6 frío al atravesar su hueco"),
  s(6, "Palabra de retorno", "Cl", "Teletransporta al grupo a tu santuario designado"),
  s(6, "Sanar", "Cl Dr", "70 PG y cura ceguera, sordera y enfermedades"),
  s(6, "Viajar entre plantas", "Dr", "Entra en una planta y sal por otra en el mismo plano"),
  // Nivel 7
  s(7, "Bola de fuego de explosión retardada", "He Ma", "12d6 fuego que crece mientras esperas a detonarla"),
  s(7, "Cambio de plano", "Br Cl Dr He Ma", "Viaja a otro plano de existencia"),
  s(7, "Dedo de la muerte", "Br He Ma", "7d8+30 necrótico; si muere, se alza como tu zombi (CON mitad)"),
  s(7, "Palabra divina", "Cl", "Daña o destierra según los PG del objetivo (CAR anula)"),
  s(7, "Regenerar", "Ba Cl Dr", "4d8+15 PG y regenera miembros amputados"),
  s(7, "Resurrección", "Ba Cl", "Resucita a alguien muerto hace hasta 100 años"),
  s(7, "Rociada prismática", "He Ma", "8 rayos de colores con efectos distintos (DES)"),
  s(7, "Teletransporte", "Ba He Ma", "Hasta 8 criaturas a cualquier destino que conozcas"),
  s(7, "Tormenta de fuego", "Cl Dr He", "7d10 fuego en 10 cubos de 10 pies (DES mitad)"),
  // Nivel 8
  s(8, "Aura sagrada", "Cl", "Aliados: ventaja en salvaciones y desventaja para atacarles"),
  s(8, "Campo antimagia", "Cl Ma", "Esfera de 10 pies donde la magia no funciona"),
  s(8, "Dominar monstruo", "Ba Br He Ma", "Controlas a cualquier criatura (SAB anula)"),
  s(8, "Laberinto", "Ma", "Destierra al objetivo a un laberinto extraplanar"),
  s(8, "Mente en blanco", "Ba Ma", "Inmune a daño psíquico, lectura mental y adivinación"),
  s(8, "Palabra de poder: aturdir", "Ba Br He Ma", "Aturde al objetivo si tiene 150 PG o menos"),
  s(8, "Sol radiante", "Dr He Ma", "12d6 radiante en 60 pies y ciega (CON mitad)"),
  s(8, "Terremoto", "Cl Dr He", "Grietas, derrumbes y criaturas derribadas en 100 pies"),
  // Nivel 9
  s(9, "Cambiar de forma", "Dr Ma", "Transfórmate en cualquier criatura de VD igual a tu nivel"),
  s(9, "Deseo", "He Ma", "El conjuro más poderoso: duplica otro conjuro o altera la realidad"),
  s(9, "Detener el tiempo", "He Ma", "1d4+1 turnos seguidos solo para ti"),
  s(9, "Palabra de poder: matar", "Ba Br He Ma", "Mata al objetivo si tiene 100 PG o menos"),
  s(9, "Profecía", "Ba Br Dr Ma", "8 h: ventaja en todo y no pueden atacarte con ventaja"),
  s(9, "Portal", "Cl He Ma", "Abre un portal a otro plano de existencia"),
  s(9, "Proyección astral", "Br Cl Ma", "Viaja al plano astral con hasta 8 compañeros"),
  s(9, "Resurrección verdadera", "Cl Dr", "Resucita incluso sin cuerpo a muertos de hasta 200 años"),
  s(9, "Sanación en masa", "Cl", "700 PG repartidos entre las criaturas que elijas"),
  s(9, "Tormenta de meteoritos", "He Ma", "20d6 fuego + 20d6 contundente en 4 zonas (DES mitad)"),
];

/**
 * Alcance en pies de los conjuros que se usan como ataque o apoyo en el
 * tablero (5 = toque/cuerpo a cuerpo). Se consulta por nombre cuando un
 * ataque de la ficha coincide con un conjuro.
 */
export const SPELL_ATTACK_RANGES: Record<string, number> = {
  // Trucos
  "Burla viciosa": 60,
  "Descarga sobrenatural": 120,
  "Garrote": 5,
  "Llama sagrada": 60,
  "Producir llama": 30,
  "Rayo de escarcha": 60,
  "Rociada de veneno": 10,
  "Saeta de fuego": 120,
  "Salpicadura de ácido": 60,
  "Toque electrizante": 5,
  "Toque gélido": 120,
  // Nivel 1
  "Bendecir": 30,
  "Curar heridas": 5,
  "Dormir": 90,
  "Hechizar persona": 30,
  "Infligir heridas": 5,
  "Maleficio": 90,
  "Manos ardientes": 15,
  "Ola atronadora": 15,
  "Palabra de curación": 60,
  "Perdición": 30,
  "Proyectil mágico": 120,
  "Rayo de brujería": 30,
  "Rociada de color": 60,
  // Nivel 2
  "Arma espiritual": 60,
  "Ceguera/Sordera": 30,
  "Esfera flamígera": 60,
  "Inmovilizar persona": 60,
  "Oración de curación": 30,
  "Rayo abrasador": 120,
  "Rayo de luna": 120,
  "Sugestión": 30,
  // Nivel 3
  "Bola de fuego": 150,
  "Contrahechizo": 60,
  "Disipar magia": 120,
  "Espíritus guardianes": 15,
  "Llamar al relámpago": 120,
  "Miedo": 30,
  "Palabra de curación en masa": 60,
  "Ralentizar": 120,
  "Relámpago": 100,
  "Toque vampírico": 5,
  // Nivel 4
  "Confusión": 90,
  "Destierro": 60,
  "Guardián de la fe": 30,
  "Marchitar": 30,
  "Muro de fuego": 120,
  "Polimorfar": 60,
  "Tentáculos negros": 90,
  // Nivel 5
  "Cono de frío": 60,
  "Curar heridas en masa": 60,
  "Dominar persona": 60,
  "Golpe flamígero": 60,
  "Onda destructiva": 30,
  "Plaga de insectos": 300,
  "Telequinesis": 60,
  // Nivel 6
  "Cadena de relámpagos": 150,
  "Danza irresistible": 30,
  "Dañar": 60,
  "Desintegrar": 60,
  "Mal de ojo": 10,
  "Sanar": 60,
  // Nivel 7
  "Bola de fuego de explosión retardada": 150,
  "Dedo de la muerte": 60,
  "Palabra divina": 30,
  "Rociada prismática": 60,
  "Tormenta de fuego": 150,
  // Nivel 8
  "Dominar monstruo": 60,
  "Palabra de poder: aturdir": 60,
  "Sol radiante": 150,
  "Terremoto": 500,
  // Nivel 9
  "Palabra de poder: matar": 60,
  "Sanación en masa": 60,
  "Tormenta de meteoritos": 5280,
};

/**
 * Alcance del conjuro cuyo nombre aparezca en el del ataque
 * (p. ej. "Rayo de escarcha (truco)" → 60 pies).
 */
export function spellRangeFor(attackName: string): number | undefined {
  const name = attackName.toLowerCase();
  let best: number | undefined;
  let bestLength = 0;
  // El nombre más largo gana: "Palabra de curación en masa" antes que "Palabra de curación"
  for (const [spell, range] of Object.entries(SPELL_ATTACK_RANGES)) {
    if (spell.length > bestLength && name.includes(spell.toLowerCase())) {
      best = range;
      bestLength = spell.length;
    }
  }
  return best;
}

// ---------- Utilidades de selección ----------

/** Subclases que lanzan conjuros de la lista del mago con INT (casters a un tercio). */
const THIRD_CASTER_SUBCLASSES = new Set(["Caballero Sobrenatural", "Embaucador Arcano"]);

/** Clase cuya lista de conjuros usa el personaje ("" = no lanza conjuros). */
export function spellListClassOf(characterClass: string, subclass: string): string {
  if (CLASS_CONTENT[characterClass]?.spellAbility) return characterClass;
  if (THIRD_CASTER_SUBCLASSES.has(subclass)) return "Mago";
  return "";
}

/** Característica de conjuros recomendada para la clase (y subclase). */
export function spellAbilityFor(characterClass: string, subclass: string): AbilityKey | "" {
  const ability = CLASS_CONTENT[characterClass]?.spellAbility ?? "";
  if (ability) return ability;
  return THIRD_CASTER_SUBCLASSES.has(subclass) ? "int" : "";
}

/** Nivel máximo de conjuro que puede lanzar el personaje según clase y nivel. */
export function maxSpellLevelFor(
  characterClass: string,
  subclass: string,
  charLevel: number
): number {
  switch (characterClass) {
    case "Bardo":
    case "Clérigo":
    case "Druida":
    case "Hechicero":
    case "Mago":
      return Math.min(9, Math.ceil(charLevel / 2));
    case "Brujo":
      // Magia de pacto hasta nv 5 + Arcanum místico (nv 6-9)
      if (charLevel >= 17) return 9;
      if (charLevel >= 15) return 8;
      if (charLevel >= 13) return 7;
      if (charLevel >= 11) return 6;
      return Math.min(5, Math.ceil(charLevel / 2));
    case "Paladín":
    case "Explorador":
      return charLevel < 2 ? 0 : Math.min(5, Math.ceil(charLevel / 4));
    default:
      if (THIRD_CASTER_SUBCLASSES.has(subclass)) {
        if (charLevel >= 19) return 4;
        if (charLevel >= 13) return 3;
        if (charLevel >= 7) return 2;
        return charLevel >= 3 ? 1 : 0;
      }
      return 0;
  }
}

/** Conjuros disponibles para la clase (y subclase) a un nivel de conjuro dado. */
export function spellsFor(
  characterClass: string,
  subclass: string,
  spellLevel: number
): SpellDef[] {
  const listClass = spellListClassOf(characterClass, subclass);
  if (!listClass) return [];
  return SPELLS.filter(
    (spell) => spell.level === spellLevel && spell.classes.includes(listClass)
  ).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Espacios de conjuro de lanzador completo por nivel (índices 0-8 → nv 1-9). */
const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // nivel 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // nivel 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // nivel 20
];

/**
 * Espacios de conjuro según clase, subclase y nivel (índices 0-8 → nv 1-9).
 * El brujo usa Magia de pacto: pocos espacios, todos del mismo nivel.
 */
export function spellSlotsFor(
  characterClass: string,
  subclass: string,
  charLevel: number
): number[] {
  const none = Array.from({ length: 9 }, () => 0);
  const level = Math.min(20, Math.max(1, charLevel));

  switch (characterClass) {
    case "Bardo":
    case "Clérigo":
    case "Druida":
    case "Hechicero":
    case "Mago":
      return FULL_CASTER_SLOTS[level - 1];
    case "Brujo": {
      const slots = [...none];
      const pactLevel = Math.min(5, Math.ceil(level / 2));
      const count = level === 1 ? 1 : level >= 17 ? 4 : level >= 11 ? 3 : 2;
      slots[pactLevel - 1] = count;
      return slots;
    }
    case "Paladín":
    case "Explorador":
      // Medio lanzador: progresa como un lanzador completo de la mitad de nivel
      return level < 2 ? none : FULL_CASTER_SLOTS[Math.ceil(level / 2) - 1];
    default:
      // Caballero Sobrenatural y Embaucador Arcano: un tercio del nivel
      if (THIRD_CASTER_SUBCLASSES.has(subclass)) {
        return level < 3 ? none : FULL_CASTER_SLOTS[Math.ceil(level / 3) - 1];
      }
      return none;
  }
}

/** Rasgos de clase y subclase disponibles hasta el nivel indicado. */
export function featuresFor(
  characterClass: string,
  subclass: string,
  charLevel: number
): FeatureDef[] {
  const content = CLASS_CONTENT[characterClass];
  if (!content) return [];
  const own = content.features.filter((feature) => feature.level <= charLevel);
  const sub = content.subclasses
    .find((entry) => entry.name === subclass)
    ?.features.filter((feature) => feature.level <= charLevel) ?? [];
  return [...own, ...sub].sort((a, b) => a.level - b.level);
}
