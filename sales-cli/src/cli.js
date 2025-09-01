// id: tok3_strict
// tokenizer.js — 1) split en 3 (CORE / TAGS / NOTE), 2) split CORE sur " - ", 3) split TAGS sur "#... " (jusqu'à espace)
// aucun contrôle métier ici, juste du découpage propre.

const { validateTagsArray } = require("./checkTags");
const { validateNoteWarnings } = require("./checkNote");
const { validateCore } = require("./checkCore");

function normalize(s) {
  return String(s || "")
    .replace(/[\u00A0\u202F]/g, " ")
    .trim();
}

/**
 * 1) Coupe le message en 3 segments :
 * - coreRaw : tout AVANT le premier "#" ou le premier "|"
 * - tagsRaw : de ce premier "#" jusqu'à juste avant le "|" (ou la fin s'il n'y a pas de "|")
 * - noteRaw : tout ce qu'il y a APRÈS le premier "|"
 */
function split3(raw) {
  const input = normalize(raw);

  const iHash = input.indexOf("#");
  const iPipe = input.indexOf("|");

  // borne de fin du CORE = min(indexHash, indexPipe) si présent, sinon fin
  const candidates = [iHash, iPipe].filter((i) => i >= 0);
  const coreEnd = candidates.length ? Math.min(...candidates) : input.length;

  const coreRaw = input.slice(0, coreEnd).trim();

  // zone tags = depuis le premier "#" jusqu'au pipe (ou fin) — uniquement si "#" existe et est AVANT le pipe
  let tagsRaw = "";
  if (iHash >= 0 && (iPipe === -1 || iHash < iPipe)) {
    const tagsEnd = iPipe === -1 ? input.length : iPipe;
    tagsRaw = input.slice(iHash, tagsEnd).trim();
  }

  const noteRaw = iPipe >= 0 ? input.slice(iPipe + 1).trim() : "";

  return { coreRaw, tagsRaw, noteRaw };
}

/**
 * 2) Split CORE : on découpe UNIQUEMENT sur " - "
 *    → on récupère un tableau (prefix, count, client, type, R-, C-, P-, ...si jamais il y en a)
 *    (Ici on ne valide pas le nombre de blocs, on te renvoie juste le split proprement.)
 */
function splitCore(coreRaw) {
  if (!coreRaw) return [];
  return coreRaw
    .split(" - ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 3) Parse TAGS : chaque tag commence par "#" et s'arrête au prochain espace.
 *    Les tirets "-" n'ont AUCUN effet ici (car on ne split plus sur " - ").
 *    On renvoie [{ raw:"#tag", key:"tag", value:null|"..."}]
 *    Supporte #k et #k=valeur (valeur peut contenir des tirets, des "/", etc. tant qu'il n'y a pas d'espace).
 */
function parseTags(tagsRaw) {
  if (!tagsRaw) return [];
  const tags = [];
  const re = /#(\S+)/g; // \S+ = jusqu'au prochain espace

  let m;
  while ((m = re.exec(tagsRaw)) !== null) {
    const raw = m[0]; // ex: "#date=01/09/2025"
    const body = m[1]; // ex: "date=01/09/2025"
    const eq = body.indexOf("=");
    const key = (eq === -1 ? body : body.slice(0, eq)).toLowerCase();
    const value = eq === -1 ? null : body.slice(eq + 1);
    tags.push({ raw, key, value });
  }
  return tags;
}

/**
 * API principale pratique
 * Retourne :
 * {
 *   core: [ ... ],          // split " - "
 *   tags: [{raw,key,value}],
 *   note: string|null
 * }
 */
function tokenizeMessage(input) {
  const { coreRaw, tagsRaw, noteRaw } = split3(input);
  const core = splitCore(coreRaw);
  const tags = parseTags(tagsRaw);
  const note = noteRaw ? noteRaw : null;
  return { core, tags, note };
}

// --- CLI de démo (facultatif) ---
if (require.main === module) {
  const message = process.argv.slice(2).join(" ");
  if (!message) {
    console.error("❌ Fournis un message en argument.");
    process.exit(1);
  }

  // Tokenisation du message
  const tokenized = tokenizeMessage(message);

  // Validation du core
  const coreValidation = validateCore(tokenized.core);

  // Validation des tags
  const tagsValidation = validateTagsArray(tokenized.tags);

  // Validation de la note
  const noteValidation = validateNoteWarnings(tokenized.note);

  // Création de l'objet JSON cohérent
  const result = {
    input: message,
    data: tokenized,
    error: [
      ...coreValidation.errors.map((e) => ({
        ...e,
        source: "core",
        severity: coreValidation.severity,
      })),
      ...tagsValidation.errors.map((e) => ({ ...e, source: "tags" })),
      ...noteValidation.warnings.map((w) => ({
        ...w,
        source: "note",
        type: "warning",
      })),
    ],
  };
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { split3, splitCore, parseTags, tokenizeMessage };
