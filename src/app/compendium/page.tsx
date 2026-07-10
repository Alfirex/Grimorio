"use client";

import { useState } from "react";
import Image from "next/image";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BESTIARY, type MonsterDef } from "@/data/bestiary";
import { SPELL_LEVEL_LABELS } from "@/data/dnd5e";
import { SPELLS, spellRangeFor } from "@/data/srd";
import styles from "./page.module.scss";

const CASTER_CLASSES = [
  "Bardo", "Brujo", "Clérigo", "Druida", "Explorador", "Hechicero", "Mago", "Paladín",
];

export default function CompendiumPage() {
  return (
    <RequireAuth>
      <Compendium />
    </RequireAuth>
  );
}

function Compendium() {
  const [tab, setTab] = useState<"spells" | "monsters">("spells");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Compendio</h1>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`btn btn--sm ${tab === "spells" ? "btn--gold" : ""}`}
          onClick={() => setTab("spells")}
        >
          ✨ Conjuros ({SPELLS.length})
        </button>
        <button
          type="button"
          className={`btn btn--sm ${tab === "monsters" ? "btn--gold" : ""}`}
          onClick={() => setTab("monsters")}
        >
          🐉 Bestiario ({BESTIARY.length})
        </button>
      </div>

      {tab === "spells" ? <SpellBrowser /> : <MonsterBrowser />}
    </div>
  );
}

function SpellBrowser() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const results = SPELLS.filter((spell) => {
    if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter && !spell.classes.includes(classFilter)) return false;
    if (levelFilter !== "" && spell.level !== Number(levelFilter)) return false;
    return true;
  }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));

  return (
    <>
      <div className={styles.filters}>
        <input
          className="input"
          placeholder="Buscar conjuro…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">Todas las clases</option>
          {CASTER_CLASSES.map((cls) => (
            <option key={cls}>{cls}</option>
          ))}
        </select>
        <select
          className="input"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">Todos los niveles</option>
          {SPELL_LEVEL_LABELS.map((label, level) => (
            <option key={level} value={level}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>Ningún conjuro coincide con la búsqueda.</p>
      ) : (
        <ul className={styles.spellList}>
          {results.map((spell) => {
            const range = spellRangeFor(spell.name);
            return (
              <li key={`${spell.level}-${spell.name}`} className={styles.spellRow}>
                <span className={styles.spellLevel}>
                  {spell.level === 0 ? "Truco" : `Nv ${spell.level}`}
                </span>
                <div className={styles.spellBody}>
                  <span className={styles.spellName}>
                    {spell.name}
                    {range !== undefined && (
                      <em className={styles.spellRange}>
                        {" "}
                        · {range <= 5 ? "toque" : `${range} pies`}
                      </em>
                    )}
                  </span>
                  <span className={styles.spellDescription}>{spell.description}</span>
                  <span className={styles.spellClasses}>{spell.classes.join(" · ")}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function MonsterBrowser() {
  const [search, setSearch] = useState("");

  const results = BESTIARY.filter(
    (monster) => !search || monster.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles.filters}>
        <input
          className="input"
          placeholder="Buscar criatura…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>Ninguna criatura coincide con la búsqueda.</p>
      ) : (
        <div className={styles.monsterGrid}>
          {results.map((monster) => (
            <MonsterEntry key={monster.name} monster={monster} />
          ))}
        </div>
      )}
    </>
  );
}

function MonsterEntry({ monster }: { monster: MonsterDef }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className={`panel ${styles.monster}`}>
      <div className={styles.monsterTop}>
        {!imgError ? (
          <Image
            src={monster.image}
            alt={monster.name}
            width={90}
            height={90}
            className={styles.monsterImg}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.monsterEmoji}>{monster.emoji}</span>
        )}
        <div>
          <h3 className={styles.monsterName}>{monster.name}</h3>
          <p className={styles.monsterStats}>
            VD {monster.cr} ({monster.xp} PX) · ❤ {monster.hp} PG · 🛡 CA {monster.ac} · 👣{" "}
            {monster.speed} pies
          </p>
          <p className={styles.monsterStats}>
            💰 {monster.loot === "0" ? "sin botín" : `${monster.loot} mo`}
          </p>
        </div>
      </div>
      <ul className={styles.monsterList}>
        {monster.attacks.map((attack) => (
          <li key={attack.id}>
            ⚔ {attack.name} {attack.bonus} ({attack.damage} {attack.type}
            {attack.range ? ` · ${attack.range} pies` : ""})
          </li>
        ))}
        {monster.abilities.map((ability) => (
          <li key={ability}>✧ {ability}</li>
        ))}
      </ul>
    </article>
  );
}
