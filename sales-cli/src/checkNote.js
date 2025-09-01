// id: validate-note
/**
 * validateNoteWarnings(noteRaw: string)
 * - Ne renvoie que des warnings, jamais d'erreur.
 * - Warning 1 : présence de "#"
 * - Warning 2 : présence de "-"
 * Retour:
 *   { ok: true, warnings: [{ code, message }], note: string }
 */
function validateNoteWarnings(noteRaw) {
  const note = String(noteRaw ?? "")
    .replace(/[\u00A0\u202F]/g, " ")
    .trim();
  const warnings = [];

  if (/#/.test(note)) {
    warnings.push({
      code: "NOTE_HAS_TAG_MARKER",
      message: 'La note contient "#". Mets les tags (#...) avant la note.',
    });
  }

  if (/-/.test(note)) {
    warnings.push({
      code: "NOTE_HAS_DASH_MARKER",
      message:
        'La note contient "-". Mets les blocs/indicateurs avant la note.',
    });
  }

  return { ok: true, warnings, note };
}

module.exports = { validateNoteWarnings };
