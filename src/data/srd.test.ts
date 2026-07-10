import { describe, expect, it } from "vitest";
import {
  CLASS_CONTENT,
  featuresFor,
  maxSpellLevelFor,
  SPELL_ATTACK_RANGES,
  spellAbilityFor,
  spellListClassOf,
  spellRangeFor,
  SPELLS,
  spellSlotsFor,
  spellsFor,
} from "@/data/srd";

const CASTER_CLASSES = [
  "Bardo", "Brujo", "Clérigo", "Druida", "Explorador", "Hechicero", "Mago", "Paladín",
];

describe("SPELLS", () => {
  it("solo referencia clases lanzadoras válidas", () => {
    for (const spell of SPELLS) {
      expect(spell.classes.length).toBeGreaterThan(0);
      for (const cls of spell.classes) {
        expect(CASTER_CLASSES).toContain(cls);
      }
    }
  });

  it("no tiene conjuros duplicados", () => {
    const seen = new Set(SPELLS.map((spell) => `${spell.level}:${spell.name}`));
    expect(seen.size).toBe(SPELLS.length);
  });

  it("cubre todos los niveles de conjuro", () => {
    for (let level = 0; level <= 9; level++) {
      expect(SPELLS.some((spell) => spell.level === level)).toBe(true);
    }
  });
});

describe("SPELL_ATTACK_RANGES", () => {
  it("cada alcance corresponde a un conjuro existente", () => {
    const names = new Set(SPELLS.map((spell) => spell.name));
    for (const key of Object.keys(SPELL_ATTACK_RANGES)) {
      expect(names.has(key), `"${key}" no existe en SPELLS`).toBe(true);
    }
  });
});

describe("spellRangeFor", () => {
  it("encuentra el conjuro aunque el nombre lleve coletillas", () => {
    expect(spellRangeFor("Rayo de escarcha (truco)")).toBe(60);
    expect(spellRangeFor("Descarga sobrenatural (truco)")).toBe(120);
  });

  it("con nombres anidados gana el más largo", () => {
    expect(spellRangeFor("Palabra de curación en masa")).toBe(
      SPELL_ATTACK_RANGES["Palabra de curación en masa"]
    );
  });

  it("ignora las armas normales", () => {
    expect(spellRangeFor("Espada larga")).toBeUndefined();
    expect(spellRangeFor("Ballesta ligera")).toBeUndefined();
  });
});

describe("spellsFor / spellListClassOf / spellAbilityFor", () => {
  it("cada clase lanzadora tiene lista propia", () => {
    expect(spellsFor("Mago", "", 0).length).toBeGreaterThan(5);
    expect(spellsFor("Clérigo", "", 1).length).toBeGreaterThan(5);
    expect(spellsFor("Guerrero", "Campeón", 1)).toHaveLength(0);
  });

  it("los arcanos a un tercio usan la lista del mago con INT", () => {
    expect(spellListClassOf("Guerrero", "Caballero Sobrenatural")).toBe("Mago");
    expect(spellListClassOf("Pícaro", "Embaucador Arcano")).toBe("Mago");
    expect(spellAbilityFor("Guerrero", "Caballero Sobrenatural")).toBe("int");
    expect(spellAbilityFor("Mago", "")).toBe("int");
    expect(spellAbilityFor("Bárbaro", "")).toBe("");
    expect(
      spellsFor("Pícaro", "Embaucador Arcano", 0).map((s) => s.name)
    ).toEqual(spellsFor("Mago", "", 0).map((s) => s.name));
  });
});

describe("maxSpellLevelFor", () => {
  it("progresión de lanzador completo", () => {
    expect(maxSpellLevelFor("Mago", "", 1)).toBe(1);
    expect(maxSpellLevelFor("Mago", "", 5)).toBe(3);
    expect(maxSpellLevelFor("Mago", "", 20)).toBe(9);
  });

  it("medio lanzador y brujo", () => {
    expect(maxSpellLevelFor("Paladín", "", 1)).toBe(0);
    expect(maxSpellLevelFor("Paladín", "", 9)).toBe(3);
    expect(maxSpellLevelFor("Brujo", "", 11)).toBe(6); // Arcanum místico
    expect(maxSpellLevelFor("Brujo", "", 10)).toBe(5);
  });

  it("a un tercio y no lanzadores", () => {
    expect(maxSpellLevelFor("Guerrero", "Caballero Sobrenatural", 3)).toBe(1);
    expect(maxSpellLevelFor("Guerrero", "Caballero Sobrenatural", 7)).toBe(2);
    expect(maxSpellLevelFor("Guerrero", "Campeón", 20)).toBe(0);
    expect(maxSpellLevelFor("Bárbaro", "", 20)).toBe(0);
  });
});

describe("spellSlotsFor", () => {
  it("coincide con la tabla del Manual del Jugador", () => {
    expect(spellSlotsFor("Mago", "", 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsFor("Mago", "", 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsFor("Mago", "", 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    expect(spellSlotsFor("Paladín", "", 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsFor("Guerrero", "Caballero Sobrenatural", 13)).toEqual([
      4, 3, 2, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it("magia de pacto del brujo: pocos espacios del nivel máximo", () => {
    expect(spellSlotsFor("Brujo", "", 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsFor("Brujo", "", 5)).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsFor("Brujo", "", 17)).toEqual([0, 0, 0, 0, 4, 0, 0, 0, 0]);
  });

  it("los no lanzadores no tienen espacios", () => {
    expect(spellSlotsFor("Bárbaro", "", 20).every((n) => n === 0)).toBe(true);
  });
});

describe("CLASS_CONTENT / featuresFor", () => {
  it("las 12 clases tienen subclases y rasgos", () => {
    expect(Object.keys(CLASS_CONTENT)).toHaveLength(12);
    for (const [name, content] of Object.entries(CLASS_CONTENT)) {
      expect(content.subclasses.length, name).toBeGreaterThan(1);
      expect(content.features.length, name).toBeGreaterThan(3);
    }
  });

  it("filtra por nivel e incluye la subclase elegida", () => {
    const low = featuresFor("Bárbaro", "Senda del Berserker", 2);
    expect(low.some((f) => f.name === "Furia")).toBe(true);
    expect(low.some((f) => f.name === "Frenesí")).toBe(false); // nivel 3
    const high = featuresFor("Bárbaro", "Senda del Berserker", 3);
    expect(high.some((f) => f.name === "Frenesí")).toBe(true);
    expect(high.every((f) => f.level <= 3)).toBe(true);
  });

  it("clase desconocida no devuelve nada", () => {
    expect(featuresFor("Panadero", "", 20)).toHaveLength(0);
  });
});
