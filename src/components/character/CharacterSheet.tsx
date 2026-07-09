"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  deleteCharacter,
  subscribeCampaign,
  subscribeCharacter,
  subscribeMyCampaigns,
  updateCharacter,
} from "@/lib/db";
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ALIGNMENTS,
  BACKGROUNDS,
  CLASSES,
  DEITIES,
  RACES,
  SKILLS,
  SPELL_LEVEL_LABELS,
} from "@/data/dnd5e";
import {
  CLASS_CONTENT,
  featuresFor,
  maxSpellLevelFor,
  spellAbilityFor,
  spellSlotsFor,
  spellsFor,
} from "@/data/srd";
import {
  abilityModifier,
  formatModifier,
  hitDieForClass,
  initiativeTotal,
  passivePerception,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from "@/utils/character";
import { fileToAvatar } from "@/utils/image";
import type { AbilityKey, Campaign, Character } from "@/types";
import { NotesPanel } from "./NotesPanel";
import styles from "./CharacterSheet.module.scss";

export function CharacterSheet({ characterId }: { characterId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  // Carga inicial: solo el primer snapshot para no pisar la edición en curso
  useEffect(() => {
    const unsubscribe = subscribeCharacter(characterId, (data) => {
      if (!data) {
        setNotFound(true);
        return;
      }
      if (!loadedRef.current) {
        loadedRef.current = true;
        setCharacter(data);
      }
    });
    return unsubscribe;
  }, [characterId]);

  useEffect(() => {
    if (!character?.campaignId) return;
    return subscribeCampaign(character.campaignId, setCampaign);
  }, [character?.campaignId]);

  // La suscripción puede traer una campaña antigua si el personaje cambia de campaña
  const currentCampaign =
    character?.campaignId && campaign?.id === character.campaignId ? campaign : null;

  useEffect(() => {
    if (!user) return;
    return subscribeMyCampaigns(user.uid, setMyCampaigns);
  }, [user]);

  if (notFound) return <p className={styles.info}>Este personaje ya no existe.</p>;
  if (!character || !user) return <p className={styles.info}>Desenrollando el pergamino…</p>;

  const isOwner = character.ownerUid === user.uid;
  const isDM = currentCampaign?.dmUid === user.uid;

  const set = (patch: Partial<Character>) => {
    setCharacter((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Partial<Character> = { ...character };
      delete data.id;
      await updateCharacter(characterId, data);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar a ${character.name || "este personaje"} para siempre?`)) return;
    await deleteCharacter(characterId);
    router.replace("/dashboard");
  };

  const profBonus = proficiencyBonus(character.level);
  const chosenDeity = DEITIES.find((deity) => deity.name === character.deity);

  return (
    <div className={styles.sheet}>
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>{character.name || "Personaje sin nombre"}</h1>
        <div className={styles.toolbarActions}>
          {isOwner && (
            <>
              {dirty && <span className={styles.unsaved}>Cambios sin guardar</span>}
              <button
                type="button"
                className="btn btn--gold"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete}>
                Eliminar
              </button>
            </>
          )}
          {!isOwner && <span className="badge">Solo lectura{isDM ? " · Vista de máster" : ""}</span>}
        </div>
      </div>

      <fieldset disabled={!isOwner} className={styles.fieldset}>
        {/* ---------- Identidad ---------- */}
        <section className="panel">
          <h2 className="section-title">Identidad</h2>
          <div className={styles.avatarRow}>
            <div
              className={styles.avatarPreview}
              style={
                character.avatar ? { backgroundImage: `url(${character.avatar})` } : undefined
              }
            >
              {!character.avatar && "🎭"}
            </div>
            {isOwner && (
              <div className={styles.avatarActions}>
                <label className="btn btn--sm">
                  {character.avatar ? "Cambiar foto" : "Subir foto"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const avatar = await fileToAvatar(file);
                        set({ avatar });
                      } catch {
                        window.alert("No se pudo procesar esa imagen.");
                      }
                    }}
                  />
                </label>
                {character.avatar && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => set({ avatar: "" })}
                  >
                    Quitar
                  </button>
                )}
                <p className={styles.avatarHint}>
                  Se verá en tu ficha del tablero. Se recorta y comprime automáticamente.
                </p>
              </div>
            )}
          </div>
          <div className={styles.identityGrid}>
            <label>
              <span className="field-label">Nombre</span>
              <input
                className="input"
                value={character.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </label>
            <label>
              <span className="field-label">Raza</span>
              <select
                className="input"
                value={character.race}
                onChange={(e) => set({ race: e.target.value })}
              >
                {RACES.map((race) => (
                  <option key={race}>{race}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Clase</span>
              <select
                className="input"
                value={character.characterClass}
                onChange={(e) =>
                  // Al cambiar de clase, la subclase deja de tener sentido y la
                  // característica de conjuros pasa a la propia de la nueva clase
                  set({
                    characterClass: e.target.value,
                    subclass: "",
                    spellcastingAbility: spellAbilityFor(e.target.value, ""),
                  })
                }
              >
                {CLASSES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <SubclassField character={character} onChange={set} />
            <label>
              <span className="field-label">Nivel</span>
              <input
                type="number"
                min={1}
                max={20}
                className="input"
                value={character.level}
                onChange={(e) => set({ level: clampInt(e.target.value, 1, 20) })}
              />
            </label>
            <label>
              <span className="field-label">Trasfondo</span>
              <select
                className="input"
                value={character.background}
                onChange={(e) => set({ background: e.target.value })}
              >
                {BACKGROUNDS.map((bg) => (
                  <option key={bg}>{bg}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Alineamiento</span>
              <select
                className="input"
                value={character.alignment}
                onChange={(e) => set({ alignment: e.target.value })}
              >
                {ALIGNMENTS.map((alignment) => (
                  <option key={alignment}>{alignment}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Deidad / Fe</span>
              <select
                className="input"
                value={character.deity ?? ""}
                title={
                  chosenDeity
                    ? `${chosenDeity.name}, ${chosenDeity.title} · Dominios sugeridos: ${chosenDeity.domains}`
                    : undefined
                }
                onChange={(e) => set({ deity: e.target.value })}
              >
                <option value="">— No sigue ninguna fe —</option>
                {/* Conserva deidades propias de la campaña escritas antes a mano */}
                {character.deity && !DEITIES.some((d) => d.name === character.deity) && (
                  <option value={character.deity}>{character.deity}</option>
                )}
                {DEITIES.map((deity) => (
                  <option key={deity.name} value={deity.name}>
                    {deity.name} · {deity.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Experiencia (PX)</span>
              <input
                type="number"
                min={0}
                className="input"
                value={character.xp}
                onChange={(e) => set({ xp: clampInt(e.target.value, 0, 999999) })}
              />
            </label>
            {isOwner && (
              <label>
                <span className="field-label">Campaña</span>
                <select
                  className="input"
                  value={character.campaignId ?? ""}
                  onChange={(e) => set({ campaignId: e.target.value || null })}
                >
                  <option value="">— Sin campaña —</option>
                  {myCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.inspiration}>
              <input
                type="checkbox"
                checked={character.inspiration}
                onChange={(e) => set({ inspiration: e.target.checked })}
              />
              <span className="field-label">Inspiración</span>
            </label>
          </div>
        </section>

        {/* ---------- Características ---------- */}
        <section className="panel">
          <h2 className="section-title">Características · Bono de competencia {formatModifier(profBonus)}</h2>
          <div className={styles.abilityRow}>
            {ABILITY_KEYS.map((key) => (
              <div key={key} className="stat-box">
                <div className="stat-box__label">{ABILITY_LABELS[key]}</div>
                <div className="stat-box__value">
                  {formatModifier(abilityModifier(character.abilities[key]))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={`input ${styles.abilityInput}`}
                  value={character.abilities[key]}
                  onChange={(e) =>
                    set({
                      abilities: {
                        ...character.abilities,
                        [key]: clampInt(e.target.value, 1, 30),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <div className={styles.columns}>
          <div className={styles.colLeft}>
            {/* ---------- Salvaciones ---------- */}
            <section className="panel">
              <h2 className="section-title">Tiradas de salvación</h2>
              <ul className={styles.checkList}>
                {ABILITY_KEYS.map((key) => (
                  <li key={key}>
                    <label className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={character.savingThrowProfs.includes(key)}
                        onChange={(e) =>
                          set({
                            savingThrowProfs: toggleInList(
                              character.savingThrowProfs,
                              key,
                              e.target.checked
                            ),
                          })
                        }
                      />
                      <span className={styles.checkLabel}>{ABILITY_LABELS[key]}</span>
                      <span className={styles.checkBonus}>
                        {formatModifier(savingThrowBonus(character, key))}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            {/* ---------- Habilidades ---------- */}
            <section className="panel">
              <h2 className="section-title">Habilidades</h2>
              <p className={styles.hint}>✦ = competencia · ★ = pericia (doble bono)</p>
              <ul className={styles.checkList}>
                {SKILLS.map((skill) => {
                  const hasProf = character.skillProfs.includes(skill.id);
                  const hasExpertise = character.skillExpertise.includes(skill.id);
                  return (
                    <li key={skill.id}>
                      <div className={styles.checkRow}>
                        <input
                          type="checkbox"
                          title="Competencia"
                          checked={hasProf}
                          onChange={(e) =>
                            set({
                              skillProfs: toggleInList(
                                character.skillProfs,
                                skill.id,
                                e.target.checked
                              ),
                              skillExpertise: e.target.checked
                                ? character.skillExpertise
                                : character.skillExpertise.filter((id) => id !== skill.id),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={`${styles.expertiseBtn} ${hasExpertise ? styles.expertiseOn : ""}`}
                          title="Pericia (doble bono de competencia)"
                          disabled={!hasProf || !isOwner}
                          onClick={() =>
                            set({
                              skillExpertise: toggleInList(
                                character.skillExpertise,
                                skill.id,
                                !hasExpertise
                              ),
                            })
                          }
                        >
                          ★
                        </button>
                        <span className={styles.checkLabel}>
                          {skill.label}
                          <em className={styles.abilityTag}>{skill.ability.toUpperCase()}</em>
                        </span>
                        <span className={styles.checkBonus}>
                          {formatModifier(skillBonus(character, skill.id))}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.passive}>
                Percepción pasiva: <strong>{passivePerception(character)}</strong>
              </p>
            </section>
          </div>

          <div className={styles.colRight}>
            {/* ---------- Combate ---------- */}
            <section className="panel">
              <h2 className="section-title">Combate</h2>
              <div className={styles.combatGrid}>
                <label className="stat-box">
                  <span className="stat-box__label">CA</span>
                  <input
                    type="number"
                    className={`input ${styles.abilityInput}`}
                    value={character.armorClass}
                    onChange={(e) => set({ armorClass: clampInt(e.target.value, 0, 40) })}
                  />
                </label>
                <div className="stat-box">
                  <span className="stat-box__label">Iniciativa</span>
                  <span className="stat-box__value">
                    {formatModifier(initiativeTotal(character))}
                  </span>
                  <span className="stat-box__sub">DES + extra</span>
                </div>
                <label className="stat-box">
                  <span className="stat-box__label">Velocidad</span>
                  <input
                    type="number"
                    className={`input ${styles.abilityInput}`}
                    value={character.speed}
                    onChange={(e) => set({ speed: clampInt(e.target.value, 0, 200) })}
                  />
                </label>
                <label className="stat-box">
                  <span className="stat-box__label">PG máx.</span>
                  <input
                    type="number"
                    className={`input ${styles.abilityInput}`}
                    value={character.maxHp}
                    onChange={(e) => set({ maxHp: clampInt(e.target.value, 1, 999) })}
                  />
                </label>
                <label className="stat-box">
                  <span className="stat-box__label">PG actuales</span>
                  <input
                    type="number"
                    className={`input ${styles.abilityInput}`}
                    value={character.currentHp}
                    onChange={(e) => set({ currentHp: clampInt(e.target.value, 0, 999) })}
                  />
                </label>
                <label className="stat-box">
                  <span className="stat-box__label">PG temp.</span>
                  <input
                    type="number"
                    className={`input ${styles.abilityInput}`}
                    value={character.tempHp}
                    onChange={(e) => set({ tempHp: clampInt(e.target.value, 0, 999) })}
                  />
                </label>
              </div>

              <div className={styles.hitDiceRow}>
                <span className="field-label">
                  Dados de golpe (d{hitDieForClass(character.characterClass)})
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className={`input ${styles.smallInput}`}
                  title="Usados"
                  value={character.hitDiceUsed}
                  onChange={(e) => set({ hitDiceUsed: clampInt(e.target.value, 0, 20) })}
                />
                <span className={styles.hitDiceSep}>/</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className={`input ${styles.smallInput}`}
                  title="Totales"
                  value={character.hitDiceTotal}
                  onChange={(e) => set({ hitDiceTotal: clampInt(e.target.value, 1, 20) })}
                />
              </div>

              <DeathSavesEditor character={character} onChange={set} />

              {isOwner && <RestButtons character={character} onChange={set} />}
            </section>

            {/* ---------- Ataques ---------- */}
            <section className="panel">
              <h2 className="section-title">Ataques</h2>
              {character.attacks.map((attack, index) => (
                <div key={attack.id} className={styles.attackRow}>
                  <input
                    className="input"
                    placeholder="Arma"
                    value={attack.name}
                    onChange={(e) => {
                      const attacks = [...character.attacks];
                      attacks[index] = { ...attack, name: e.target.value };
                      set({ attacks });
                    }}
                  />
                  <input
                    className={`input ${styles.smallInput}`}
                    placeholder="+5"
                    title="Bono de ataque"
                    value={attack.bonus}
                    onChange={(e) => {
                      const attacks = [...character.attacks];
                      attacks[index] = { ...attack, bonus: e.target.value };
                      set({ attacks });
                    }}
                  />
                  <input
                    className="input"
                    placeholder="1d8+3"
                    title="Daño"
                    value={attack.damage}
                    onChange={(e) => {
                      const attacks = [...character.attacks];
                      attacks[index] = { ...attack, damage: e.target.value };
                      set({ attacks });
                    }}
                  />
                  <input
                    className="input"
                    placeholder="Cortante"
                    title="Tipo de daño"
                    value={attack.type}
                    onChange={(e) => {
                      const attacks = [...character.attacks];
                      attacks[index] = { ...attack, type: e.target.value };
                      set({ attacks });
                    }}
                  />
                  <input
                    className="input"
                    type="number"
                    min={5}
                    step={5}
                    placeholder="c.c."
                    title="Alcance en pies (vacío = cuerpo a cuerpo)"
                    value={attack.range ?? ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      const attacks = [...character.attacks];
                      const updated = { ...attack };
                      // Sin valor, el campo desaparece: el ataque vuelve a ser cuerpo a cuerpo
                      if (Number.isNaN(value)) delete updated.range;
                      else updated.range = value;
                      attacks[index] = updated;
                      set({ attacks });
                    }}
                  />
                  {isOwner && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() =>
                        set({ attacks: character.attacks.filter((a) => a.id !== attack.id) })
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {isOwner && (
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() =>
                    set({
                      attacks: [
                        ...character.attacks,
                        { id: crypto.randomUUID(), name: "", bonus: "", damage: "", type: "" },
                      ],
                    })
                  }
                >
                  + Añadir ataque
                </button>
              )}
            </section>

            {/* ---------- Equipo ---------- */}
            <section className="panel">
              <h2 className="section-title">Equipo y tesoro</h2>
              <div className={styles.moneyRow}>
                {(["pp", "gp", "ep", "sp", "cp"] as const).map((coin) => (
                  <label key={coin} className={styles.coin}>
                    <span className="field-label">{coin.toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      className="input"
                      value={character.money[coin]}
                      onChange={(e) =>
                        set({
                          money: { ...character.money, [coin]: clampInt(e.target.value, 0, 999999) },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <textarea
                className="input"
                rows={5}
                placeholder="Mochila, armadura, cuerda, antorchas…"
                value={character.equipment}
                onChange={(e) => set({ equipment: e.target.value })}
              />
            </section>
          </div>
        </div>

        {/* ---------- Conjuros ---------- */}
        <SpellsSection character={character} onChange={set} isOwner={isOwner} />

        {/* ---------- Personalidad e historia ---------- */}
        <section className="panel">
          <h2 className="section-title">Personalidad e historia</h2>
          <div className={styles.personalityGrid}>
            {(
              [
                ["personality", "Rasgos de personalidad"],
                ["ideals", "Ideales"],
                ["bonds", "Vínculos"],
                ["flaws", "Defectos"],
                ["appearance", "Apariencia"],
                ["otherProficiencies", "Otras competencias e idiomas"],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                <span className="field-label">{label}</span>
                <textarea
                  className="input"
                  rows={3}
                  value={character[field]}
                  onChange={(e) => set({ [field]: e.target.value })}
                />
              </label>
            ))}
          </div>
          {isOwner && <ClassFeaturesPicker character={character} onChange={set} />}
          <label>
            <span className="field-label">Rasgos y atributos de clase</span>
            <textarea
              className="input"
              rows={5}
              value={character.featuresAndTraits}
              onChange={(e) => set({ featuresAndTraits: e.target.value })}
            />
          </label>
          <label>
            <span className="field-label">Historia del personaje</span>
            <textarea
              className="input"
              rows={6}
              value={character.backstory}
              onChange={(e) => set({ backstory: e.target.value })}
            />
          </label>
        </section>
      </fieldset>

      {/* ---------- Notas del máster ---------- */}
      <NotesPanel
        characterId={characterId}
        isOwner={isOwner}
        isDM={Boolean(isDM)}
      />
    </div>
  );
}

// ---------- Subcomponentes ----------

function DeathSavesEditor({
  character,
  onChange,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}) {
  const renderChecks = (kind: "successes" | "failures", label: string) => (
    <div className={styles.deathRow}>
      <span className="field-label">{label}</span>
      {[1, 2, 3].map((n) => (
        <input
          key={n}
          type="checkbox"
          checked={character.deathSaves[kind] >= n}
          onChange={(e) =>
            onChange({
              deathSaves: {
                ...character.deathSaves,
                [kind]: e.target.checked ? n : n - 1,
              },
            })
          }
        />
      ))}
    </div>
  );

  return (
    <div className={styles.deathSaves}>
      <span className="field-label">Salvaciones de muerte</span>
      {renderChecks("successes", "Éxitos")}
      {renderChecks("failures", "Fallos")}
    </div>
  );
}

function SpellsSection({
  character,
  onChange,
  isOwner,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  isOwner: boolean;
}) {
  const [newSpellLevel, setNewSpellLevel] = useState(0);
  const [newSpellPick, setNewSpellPick] = useState("");
  const dc = spellSaveDC(character);
  const attackBonus = spellAttackBonus(character);

  // Listado del reglamento filtrado por la clase (o subclase lanzadora) y nivel
  const maxLevel = maxSpellLevelFor(
    character.characterClass,
    character.subclass,
    character.level
  );
  const suggestions = spellsFor(character.characterClass, character.subclass, newSpellLevel);

  const handleAddSpell = () => {
    const picked = suggestions.find((spell) => spell.name === newSpellPick);
    onChange({
      spells: [
        ...character.spells,
        {
          id: crypto.randomUUID(),
          name: picked?.name ?? "",
          level: newSpellLevel,
          prepared: false,
          description: picked?.description ?? "",
        },
      ],
    });
    setNewSpellPick("");
  };

  return (
    <section className="panel">
      <h2 className="section-title">Conjuros</h2>
      <div className={styles.spellHeader}>
        <label>
          <span className="field-label">Característica de conjuro</span>
          <select
            className="input"
            value={character.spellcastingAbility}
            onChange={(e) =>
              onChange({ spellcastingAbility: e.target.value as AbilityKey | "" })
            }
          >
            <option value="">— No lanza conjuros —</option>
            {ABILITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {ABILITY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        {dc !== null && (
          <>
            <div className="stat-box">
              <span className="stat-box__label">CD de salvación</span>
              <span className="stat-box__value">{dc}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box__label">Ataque de conjuro</span>
              <span className="stat-box__value">{formatModifier(attackBonus ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      {character.spellcastingAbility && (
        <>
          <div className={styles.slotsHeader}>
            <h3 className={styles.subTitle}>Espacios de conjuro</h3>
            {isOwner && spellSlotsFor(character.characterClass, character.subclass, character.level).some((n) => n > 0) && (
              <button
                type="button"
                className="btn btn--sm"
                title="Rellena los espacios con la tabla del reglamento para tu clase y nivel"
                onClick={() => {
                  const suggested = spellSlotsFor(
                    character.characterClass,
                    character.subclass,
                    character.level
                  );
                  onChange({
                    spellSlots: suggested.map((total, i) => ({
                      total,
                      used: Math.min(character.spellSlots[i]?.used ?? 0, total),
                    })),
                  });
                }}
              >
                📜 Según clase y nivel
              </button>
            )}
          </div>
          <div className={styles.slotsRow}>
            {character.spellSlots.map((slot, index) => (
              <div key={index} className={styles.slotBox}>
                <span className="field-label">Nv {index + 1}</span>
                <div className={styles.slotInputs}>
                  <input
                    type="number"
                    min={0}
                    max={slot.total}
                    className="input"
                    title="Usados"
                    value={slot.used}
                    onChange={(e) => {
                      const spellSlots = [...character.spellSlots];
                      spellSlots[index] = {
                        ...slot,
                        used: clampInt(e.target.value, 0, slot.total),
                      };
                      onChange({ spellSlots });
                    }}
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    className="input"
                    title="Totales"
                    value={slot.total}
                    onChange={(e) => {
                      const total = clampInt(e.target.value, 0, 9);
                      const spellSlots = [...character.spellSlots];
                      spellSlots[index] = { total, used: Math.min(slot.used, total) };
                      onChange({ spellSlots });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className={styles.subTitle}>Grimorio</h3>
          {SPELL_LEVEL_LABELS.map((label, level) => {
            const spells = character.spells.filter((s) => s.level === level);
            if (spells.length === 0) return null;
            return (
              <div key={level} className={styles.spellLevelGroup}>
                <h4 className={styles.spellLevelTitle}>{label}</h4>
                {spells.map((spell) => (
                  <div key={spell.id} className={styles.spellRow}>
                    <input
                      type="checkbox"
                      title="Preparado"
                      checked={spell.prepared}
                      onChange={(e) =>
                        onChange({
                          spells: character.spells.map((s) =>
                            s.id === spell.id ? { ...s, prepared: e.target.checked } : s
                          ),
                        })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Nombre del conjuro"
                      value={spell.name}
                      onChange={(e) =>
                        onChange({
                          spells: character.spells.map((s) =>
                            s.id === spell.id ? { ...s, name: e.target.value } : s
                          ),
                        })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Alcance, daño, notas…"
                      value={spell.description}
                      onChange={(e) =>
                        onChange({
                          spells: character.spells.map((s) =>
                            s.id === spell.id ? { ...s, description: e.target.value } : s
                          ),
                        })
                      }
                    />
                    {isOwner && (
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() =>
                          onChange({
                            spells: character.spells.filter((s) => s.id !== spell.id),
                          })
                        }
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {isOwner && (
            <div className={styles.addSpellRow}>
              <select
                className={`input ${styles.smallInput}`}
                value={newSpellLevel}
                onChange={(e) => {
                  setNewSpellLevel(Number(e.target.value));
                  setNewSpellPick("");
                }}
              >
                {SPELL_LEVEL_LABELS.map((label, level) => {
                  // Marca los niveles que la clase aún no puede lanzar
                  const locked = maxLevel > 0 && level > maxLevel;
                  return (
                    <option key={level} value={level}>
                      {label}
                      {locked ? " 🔒" : ""}
                    </option>
                  );
                })}
              </select>
              {suggestions.length > 0 && (
                <select
                  className="input"
                  value={newSpellPick}
                  title={`Conjuros de ${SPELL_LEVEL_LABELS[newSpellLevel].toLowerCase()} de tu clase`}
                  onChange={(e) => setNewSpellPick(e.target.value)}
                >
                  <option value="">— Escribir uno propio —</option>
                  {suggestions.map((spell) => (
                    <option key={spell.name} value={spell.name}>
                      {spell.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" className="btn btn--sm" onClick={handleAddSpell}>
                + Añadir conjuro
              </button>
              {maxLevel > 0 && (
                <span className={styles.spellHint}>
                  Tu clase lanza conjuros de hasta nivel {maxLevel} al nivel {character.level}.
                </span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Descanso corto (gastar dados de golpe) y descanso largo. */
function RestButtons({
  character,
  onChange,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}) {
  const [lastRoll, setLastRoll] = useState("");
  const die = hitDieForClass(character.characterClass);
  const canSpendDie =
    character.hitDiceUsed < character.hitDiceTotal &&
    character.currentHp < character.maxHp;

  const spendHitDie = () => {
    const roll = 1 + Math.floor(Math.random() * die);
    const healed = Math.max(1, roll + abilityModifier(character.abilities.con));
    onChange({
      currentHp: Math.min(character.maxHp, character.currentHp + healed),
      hitDiceUsed: character.hitDiceUsed + 1,
    });
    setLastRoll(`🎲 d${die} = ${roll} + CON → recuperas ${healed} PG`);
  };

  const longRest = () => {
    if (
      !window.confirm(
        "¿Descanso largo? Recuperas todos los PG, los espacios de conjuro, las salvaciones de muerte y la mitad de los dados de golpe."
      )
    )
      return;
    onChange({
      currentHp: character.maxHp,
      tempHp: 0,
      hitDiceUsed: Math.max(
        0,
        character.hitDiceUsed - Math.max(1, Math.floor(character.hitDiceTotal / 2))
      ),
      deathSaves: { successes: 0, failures: 0 },
      spellSlots: character.spellSlots.map((slot) => ({ ...slot, used: 0 })),
    });
    setLastRoll("");
  };

  return (
    <div className={styles.restRow}>
      <button
        type="button"
        className="btn btn--sm"
        disabled={!canSpendDie}
        title={`Descanso corto: tira 1d${die} + CON y cura eso (gasta un dado de golpe)`}
        onClick={spendHitDie}
      >
        🎲 Gastar dado de golpe (d{die})
      </button>
      <button type="button" className="btn btn--sm" onClick={longRest}>
        🌙 Descanso largo
      </button>
      {lastRoll && <span className={styles.restNote}>{lastRoll}</span>}
    </div>
  );
}

/** Selector de subclase con las opciones del reglamento para la clase actual. */
function SubclassField({
  character,
  onChange,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}) {
  const content = CLASS_CONTENT[character.characterClass];
  const options = content?.subclasses.map((sub) => sub.name) ?? [];

  if (options.length === 0) {
    return (
      <label>
        <span className="field-label">Subclase</span>
        <input
          className="input"
          value={character.subclass}
          onChange={(e) => onChange({ subclass: e.target.value })}
        />
      </label>
    );
  }

  return (
    <label>
      <span className="field-label">
        {content.subclassLabel} (nv {content.subclassLevel})
      </span>
      <select
        className="input"
        value={character.subclass}
        onChange={(e) => {
          const subclass = e.target.value;
          // Un Caballero Sobrenatural o Embaucador Arcano empieza a lanzar conjuros
          const ability = spellAbilityFor(character.characterClass, subclass);
          onChange({
            subclass,
            ...(ability && !character.spellcastingAbility
              ? { spellcastingAbility: ability }
              : {}),
          });
        }}
      >
        <option value="">— Sin elegir —</option>
        {/* Conserva valores antiguos escritos a mano aunque no estén en la lista */}
        {character.subclass && !options.includes(character.subclass) && (
          <option value={character.subclass}>{character.subclass}</option>
        )}
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Rasgos de clase y subclase del reglamento hasta el nivel actual, para añadirlos a la ficha. */
function ClassFeaturesPicker({
  character,
  onChange,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = featuresFor(character.characterClass, character.subclass, character.level);
  if (available.length === 0) return null;

  const isAdded = (name: string) => character.featuresAndTraits.includes(name);
  const pending = available.filter((feature) => !isAdded(feature.name));

  const appendFeatures = (features: typeof available) => {
    const lines = features.map(
      (feature) => `Nv ${feature.level} — ${feature.name}: ${feature.description}`
    );
    const current = character.featuresAndTraits.trimEnd();
    onChange({
      featuresAndTraits: current ? `${current}\n${lines.join("\n")}` : lines.join("\n"),
    });
  };

  return (
    <div className={styles.featurePicker}>
      <div className={styles.featurePickerHeader}>
        <button type="button" className="btn btn--sm" onClick={() => setOpen((v) => !v)}>
          {open ? "▾" : "▸"} Rasgos de {character.characterClass}
          {character.subclass ? ` (${character.subclass})` : ""} hasta nivel {character.level}
        </button>
        {pending.length > 0 && (
          <button
            type="button"
            className="btn btn--gold btn--sm"
            onClick={() => appendFeatures(pending)}
          >
            + Añadir los {pending.length} pendientes
          </button>
        )}
      </div>
      {open && (
        <ul className={styles.featureList}>
          {available.map((feature) => (
            <li key={`${feature.level}-${feature.name}`} className={styles.featureRow}>
              <span>
                <strong>
                  Nv {feature.level} — {feature.name}:
                </strong>{" "}
                {feature.description}
              </span>
              <button
                type="button"
                className="btn btn--sm"
                disabled={isAdded(feature.name)}
                onClick={() => appendFeatures([feature])}
              >
                {isAdded(feature.name) ? "✓" : "+"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Utilidades ----------

function clampInt(value: string, min: number, max: number): number {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function toggleInList<T>(list: T[], item: T, include: boolean): T[] {
  if (include) return list.includes(item) ? list : [...list, item];
  return list.filter((entry) => entry !== item);
}
