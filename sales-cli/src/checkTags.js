// id: validate-tags
/**
 * validateTagsArray(tags)
 * Valide un tableau de tags parsés
 * Retour:
 *   { ok: boolean, errors: [...], data: {...} }
 */
function validateTagsArray(tags) {
  const result = { ok: true, errors: [], data: {} };
  if (!Array.isArray(tags) || tags.length === 0) return result;

  const allowed = new Set(["date", "ascension"]);
  const seen = new Set();
  const dateRE = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

  for (const t of tags) {
    const key = (t?.key || "").toLowerCase();
    const raw = t?.raw || "";

    // Inconnu
    if (!allowed.has(key)) {
      result.ok = false;
      result.errors.push({
        code: "TAG_UNKNOWN",
        message: `Tag inconnu: #${key} (autorisés: #date, #ascension)`,
        tag: raw,
      });
      continue;
    }

    // Doublon (même clé)
    if (seen.has(key)) {
      result.ok = false;
      result.errors.push({
        code: "TAG_DUPLICATE",
        message: `Tag dupliqué: #${key}`,
        tag: raw,
      });
      continue;
    }
    seen.add(key);

    // Règles spécifiques
    if (key === "ascension") {
      if (t.value != null && String(t.value).trim() !== "") {
        result.ok = false;
        result.errors.push({
          code: "TAG_ASCENSION_NO_VALUE",
          message:
            'Le tag #ascension ne doit pas avoir de valeur (utilise simplement "#ascension").',
          tag: raw,
        });
      } else {
        result.data.ascension = true;
      }
    }

    if (key === "date") {
      const v = t.value == null ? "" : String(t.value).trim();
      if (!v) {
        result.ok = false;
        result.errors.push({
          code: "TAG_DATE_VALUE_MISSING",
          message: 'Le tag #date doit être au format "#date=JJ/MM/AAAA".',
          tag: raw,
        });
      } else if (!dateRE.test(v)) {
        result.ok = false;
        result.errors.push({
          code: "TAG_DATE_FORMAT_INVALID",
          message: `Format de date invalide: "${v}" (attendu JJ/MM/AAAA).`,
          tag: raw,
        });
      } else {
        result.data.date = v; // valide
      }
    }
  }

  return result;
}

module.exports = { validateTagsArray };
