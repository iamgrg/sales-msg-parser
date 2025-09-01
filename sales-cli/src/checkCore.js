// id: validate-core-v1
/**
 * validateCore(coreParts: string[])
 * Attendu (exactement 7 blocs, séparés avant par " - "):
 *  [0] "New Sales"
 *  [1] COUNT                   -> entier >= 0
 *  [2] CLIENT                  -> non vide
 *  [3] TYPE                    -> FU | OCC (MAJ)
 *  [4] "R- <montant>€"         -> espace après "R-", entier ou décimal (virgule ou point), € avec ou sans espace
 *  [5] "C- <montant>€"         -> idem, avec C ≤ R
 *  [6] "P- <PAYMENTS>"         -> CB/SEPA/VIREMENT/PAYPAL combinés par "+" (avec ou sans espaces), MAJ
 * *
 * Retour:
 * {
 *   ok: boolean,
 *   severity: "OK"|"FATAL"|"MAJOR"|"MINOR",
 *   errors: Array<{ code: string, field?: string }>,
 *   data?: {
 *     prefix,
 *     count,
 *     client,
 *     type,
 *     revenue: number,
 *     cash: number,
 *     payments: string[] // ex: ["CB","SEPA"]
 *   }
 * }
 */
function validateCore(coreParts) {
  const errorsFatal = [];
  const errorsMajor = [];
  const errorsMinor = [];

  if (!Array.isArray(coreParts) || coreParts.length !== 7) {
    if (!Array.isArray(coreParts) || coreParts.length < 7)
      errorsFatal.push({ code: "CORE_TOO_SHORT" });
    else errorsFatal.push({ code: "CORE_TOO_LONG" });
    return summarize(errorsFatal, errorsMajor, errorsMinor, null);
  }

  const [prefix, countRaw, clientRaw, typeRaw, rRaw, cRaw, pRaw] =
    coreParts.map((s) => (s ?? "").trim());

  // 0) Préfixe
  if (prefix !== "New Sales") {
    errorsFatal.push({ code: "PREFIX_BAD", field: "prefix" });
  }

  // 1) COUNT
  if (!/^\d+$/.test(countRaw)) {
    errorsMajor.push({ code: "COUNT_INVALID", field: "count" });
  }
  const count = /^\d+$/.test(countRaw) ? Number(countRaw) : null;

  // 2) CLIENT
  if (!clientRaw) {
    errorsMajor.push({ code: "CLIENT_EMPTY", field: "client" });
  }
  const client = clientRaw;

  // 3) TYPE
  if (!/^(FU|OCC)$/.test(typeRaw)) {
    errorsMajor.push({ code: "TYPE_INVALID", field: "type" });
  }
  const type = typeRaw;

  // 4) "R- <montant>€"
  const moneyCoreRevenue = /^R-\s+(\d+(?:[,.]\d{1,2})?)\s*€$/;
  let rev = null;
  if (!moneyCoreRevenue.test(rRaw)) {
    // détails fréquents
    if (/^R-\d/.test(rRaw)) {
      errorsMajor.push({
        code: "R_SPACE_AFTER_FLAG_REQUIRED",
        field: "revenue",
      }); // espace après "R-"
    }
    errorsMajor.push({ code: "REVENUE_INVALID", field: "revenue" });
  } else {
    rev = toNumberEU(rRaw.match(moneyCoreRevenue)[1]);
  }

  // 5) C- <montant>€" 
  const moneyCoreCash = /^C-\s+(\d+(?:[,.]\d{1,2})?)\s*€$/;
  let cash = null;
  if (!moneyCoreCash.test(cRaw)) {
    if (/^C-\d/.test(cRaw)) {
      errorsMajor.push({ code: "C_SPACE_AFTER_FLAG_REQUIRED", field: "cash" });
    }
    errorsMajor.push({ code: "CASH_INVALID", field: "cash" });
  } else {
    cash = toNumberEU(cRaw.match(moneyCoreCash)[1]);
  }

  // 6) "P- <PAYMENTS>"
  const payOk =
    /^P-\s+(?:CB|SEPA|VIREMENT|PAYPAL)(?:\s*\+\s*(?:CB|SEPA|VIREMENT|PAYPAL))*$/.test(
      pRaw
    );
  let payments = [];
  if (!payOk) {
    errorsMajor.push({ code: "PAYMENTS_INVALID", field: "payments" }); // format global invalide
    if (/[a-z]/.test(pRaw))
      errorsMajor.push({
        code: "PAYMENTS_UPPERCASE_REQUIRED",
        field: "payments",
      });
  } else {
    const list = pRaw.replace(/^P-\s+/, "").split(/\s*\+\s*/);
    payments = list;
    // doublons => MINOR
    if (new Set(list).size !== list.length) {
      errorsMinor.push({ code: "PAYMENTS_DUPLICATE", field: "payments" });
    }
  }

  // Cross rule : C ≤ R (si les deux parsés)
  if (rev != null && cash != null && cash > rev) {
    errorsMajor.push({ code: "CASH_GT_REVENUE", field: "cash" });
  }

  const data = errorsFatal.length
    ? null
    : {
        prefix,
        count,
        client,
        type,
        revenue: rev,
        cash,
        payments,
      };

  return summarize(errorsFatal, errorsMajor, errorsMinor, data);
}

/* ----------------- Helpers ----------------- */

function toNumberEU(txt) {
  // "7000" | "7000,5" | "7000,50" | "7000.5" | "7000.50" -> nombre JS
  return Number(String(txt).replace(",", "."));
}

function summarize(fatal, major, minor, data) {
  if (fatal.length)
    return { ok: false, severity: "FATAL", errors: fatal, data: null };
  if (major.length)
    return { ok: false, severity: "MAJOR", errors: major, data };
  if (minor.length)
    return { ok: false, severity: "MINOR", errors: minor, data };
  return { ok: true, severity: "OK", errors: [], data };
}

module.exports = { validateCore };
