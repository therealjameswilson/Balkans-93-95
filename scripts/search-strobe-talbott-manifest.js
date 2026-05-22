#!/usr/bin/env node

const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const DEFAULT_MANIFEST_URL =
  "https://therealjameswilson.github.io/strobe-talbott-foia/data/manifest_enriched.csv";
const CACHE_DIR = path.join("/private/tmp", "strobe-talbott-foia-pdfs");

const DEFAULT_TERMS = [
  "bosnia",
  "dayton",
  "yugoslav",
  "croatia",
  "croatian",
  "serbia",
  "serbian",
  "srebrenica",
  "milosevic",
  "milošević",
  "izetbegovic",
  "karadzic",
  "mladic",
  "balkan",
  "kosovo",
  "macedonia",
  "slovenia",
  "eastern slavonia",
  "republika srpska",
  "holbrooke"
];

const FULL_TEXT_TERMS = [
  ["bosnia", /\bbosni(a|an|ak|a-herzegovina|a and herzegovina)?\b/i],
  ["herzegovina", /\bherzegovina\b/i],
  ["dayton", /\bdayton\b/i],
  ["croatia", /\bcroati(a|an|ans)?\b/i],
  ["yugoslavia", /\byugoslav(ia|ian)?\b|former yugoslavia/i],
  ["serbia", /\bserbi(a|an|ans)?\b/i],
  ["belgrade", /\bbelgrade\b/i],
  ["kosovo", /\bkosovo\b/i],
  ["macedonia", /\bmacedonia(n)?\b/i],
  ["slovenia", /\bslovenia(n)?\b/i],
  ["srebrenica", /\bsrebrenica\b/i],
  ["sarajevo", /\bsarajevo\b/i],
  ["gorazde", /\bgorazde\b|\bgoražde\b/i],
  ["bihac", /\bbihac\b|\bbihać\b/i],
  ["brcko", /\bbrcko\b|\bbrčko\b/i],
  ["milosevic", /\bmilosevic\b|\bmilošević\b/i],
  ["karadzic", /\bkaradzic\b|\bkaradžić\b/i],
  ["mladic", /\bmladic\b|\bmladić\b/i],
  ["izetbegovic", /\bizetbegovic\b|\bizetbegović\b/i],
  ["tudjman", /\btudjman\b|\btuđman\b/i],
  ["holbrooke", /\bholbrooke\b/i],
  ["unprofor", /\bunprofor\b/i],
  ["ifor", /\bifor\b/i],
  ["contact group", /\bcontact group\b/i],
  ["eastern slavonia", /\beastern slavonia\b/i],
  ["war crimes", /\bwar crimes?\b|\bwar crimes tribunal\b|\bicty\b/i],
  ["lift and strike", /\blift and strike\b/i],
  ["safe areas", /\bsafe areas?\b/i],
  ["balkan", /\bbalkans?\b/i]
];

const SELECTED_STANDALONE_KEYS = new Map(
  [
    [
      "C09000058|5/2/1994",
      "Presidential briefing memorandum with a substantial Bosnia policy section for the May 1994 CNN appearance."
    ],
    [
      "C09000052|12/12/1994",
      "Talbott private letter to Yuri on U.S.-Russian relations after Budapest; Bosnia appears as one of the linked strategic issues."
    ],
    [
      "C09000085|2/23/1995",
      "Briefing memorandum for Secretary Brown's Madrid trip covering Spain's UNPROFOR role and Contact Group concerns."
    ],
    [
      "C09000078|4/11/1995",
      "Talbott remarks in Ankara with a discrete former-Yugoslavia/Kosovo/Bosnia policy passage."
    ],
    [
      "C09000087|6/13/1995",
      "Yuri Mamedov letter to Talbott on the Halifax presidents' meeting, former Yugoslavia, and Contact Group cooperation."
    ],
    [
      "C09000098|6/7/1995",
      "Talbott official-informal message to Mamedov previewing Clinton-Yeltsin agenda items, including Bosnia and Milosevic."
    ],
    [
      "C09000009|8/31/1995",
      "Secretary-Kozyrev Bosnia letter already included in the chronological inventory."
    ],
    [
      "C09000010|10/13/1995",
      "Talbott memorandum to Holbrooke already included in the chronological inventory."
    ],
    [
      "C09000055|10/19/1995",
      "Dissent Channel message on Russian participation in the Bosnia Peace Implementation Force."
    ],
    [
      "C09000068|12/14/1995",
      "Talbott note to Holbrooke already included in the chronological inventory."
    ],
    [
      "C09000051|12/20/1995",
      "Michael Nacht letter to Talbott already included in the chronological inventory."
    ],
    [
      "C09000052|12/27/1995",
      "Henry Kissinger letter to Talbott on Bosnia cooperation, Russia, and NATO enlargement."
    ]
  ]
);

const EXCLUDED_IN_VOLUME_REASONS = new Map([
  ["C09000065|6/25/1995", "Manifest date appears misleading; attachment discusses post-Dayton IFOR and 1996 Bosnian elections."],
  ["C09000022|3/28/1994", "Russia-policy cable with only incidental Bosnia references."],
  ["C09000042|5/25/1995", "Romania/democracy letter; Yugoslavia/Tudjman/Holbrooke hits are incidental."],
  ["C09000001|11/21/1995", "Asia/APEC memorandum; Bosnia appears only as a domestic-policy comparison."],
  ["C09000094|4/2/1995", "NATO-Russia planning comments; Holbrooke hit is not a Balkans document."],
  ["C09000040|6/16/1995", "NATO-enlargement article correspondence; Holbrooke hit is a bibliographic reference."],
  ["C09000034|9/25/1995", "CFR recommendation letter; Holbrooke hit is only in a references list."],
  ["C09000039|5/29/1995", "Austria-related note with only incidental Balkan refugee-policy language."]
]);

const CONVERSATION_TERMS = [
  "memorandum of conversation",
  "memorandum of telephone conversation",
  "memcon",
  "telcon",
  "meeting",
  "conversation",
  "telephone conversation",
  "phone call"
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value) {
  return (value || "").toString().toLowerCase();
}

function normalizeAscii(value) {
  return normalize(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((item) => item.some(Boolean))
    .map((item) =>
      Object.fromEntries(headers.map((header, index) => [header, item[index] || ""]))
    );
}

function parseYear(date) {
  const value = (date || "").toString();
  const direct = value.match(/\b(19|20)\d{2}\b/);
  if (direct) return Number(direct[0]);

  const slash = value.match(/\b\d{1,2}\/\d{1,2}\/(\d{2,4})\b/);
  if (!slash) return null;
  const raw = slash[1];
  if (raw.length === 4) return Number(raw);
  const year = Number(raw);
  return year >= 80 ? 1900 + year : 2000 + year;
}

function sortableDateValue(date) {
  const value = (date || "").toString();
  const slash = value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!slash) return value;
  const year = slash[3].length === 4 ? Number(slash[3]) : Number(slash[3]) >= 80 ? 1900 + Number(slash[3]) : 2000 + Number(slash[3]);
  return `${year}-${String(slash[1]).padStart(2, "0")}-${String(slash[2]).padStart(2, "0")}`;
}

function matchedTerms(text, terms) {
  const haystack = normalize(text);
  return terms.filter((term) => haystack.includes(normalize(term)));
}

function matchedRegionalTerms(text) {
  const haystack = normalize(text);
  return matchedTerms(text, DEFAULT_TERMS).filter((term) => {
    if (term !== "dayton") return true;
    if (!/university\s+of\w*\s+dayton|professor bilocerkowycz/.test(haystack)) return true;
    return /dayton (peace|accord|agreement|implementation|proximity|negotiation|talks)|bosnia|holbrooke/.test(
      haystack
    );
  });
}

function recordText(record) {
  return [record.document_id, record.date, record.title, record.description, record.pdf_url]
    .filter(Boolean)
    .join(" ");
}

function recordKey(record) {
  return `${record.document_id}|${record.date}`;
}

function pageCount(pdfPath) {
  try {
    const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8", maxBuffer: 1024 * 1024 });
    const match = output.match(/^Pages:\s+(\d+)/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function pdfText(pdfPath) {
  try {
    return execFileSync("pdftotext", ["-layout", "-nopgbrk", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    });
  } catch {
    return "";
  }
}

function cachePath(record) {
  const digest = crypto.createHash("sha1").update(record.pdf_url).digest("hex").slice(0, 16);
  return path.join(CACHE_DIR, `${digest}-${record.document_id || "document"}.pdf`);
}

async function downloadPdf(record) {
  const outPath = cachePath(record);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) return outPath;

  const response = await fetch(record.pdf_url);
  if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${record.pdf_url}`);
  fs.writeFileSync(outPath, Buffer.from(await response.arrayBuffer()));
  return outPath;
}

function matchedFullTextTerms(text) {
  const clean = normalizeAscii(text);
  return FULL_TEXT_TERMS.filter(([, regex]) => regex.test(clean)).map(([label]) => label);
}

function notFalseDayton(text) {
  const clean = normalizeAscii(text);
  if (!/\bdayton\b/.test(clean)) return true;
  if (!/university of dayton|professor bilocerkowycz|dayton daily/.test(clean)) return true;
  return /dayton (peace|accord|agreement|implementation|proximity|negotiation|talks)|bosnia|holbrooke|ifor/.test(
    clean
  );
}

function snippetFor(text, terms) {
  const flat = text.replace(/\s+/g, " ").trim();
  const clean = normalizeAscii(flat);
  let index = -1;
  for (const term of terms) {
    index = clean.indexOf(normalizeAscii(term));
    if (index >= 0) break;
  }
  if (index < 0) index = 0;
  return flat.slice(Math.max(0, index - 180), index + 520);
}

function scoreRecord(record) {
  const year = parseYear(record.date);
  const text = recordText(record);
  const terms = matchedRegionalTerms(text);
  const conversationTerms = matchedTerms(text, CONVERSATION_TERMS);
  const exactBosnia = /bosnia|dayton|srebrenica|izetbegovic|milosevic|milošević|yugoslav|croatia|serbia/i.test(
    text
  );
  const inVolumeWindow = year >= 1993 && year <= 1995;
  const postVolume = year && year > 1995;
  const regionHit = terms.length > 0;

  let score = 0;
  if (regionHit) {
    score += terms.length * 3;
    score += conversationTerms.length * 2;
    if (inVolumeWindow) score += 8;
    if (exactBosnia) score += 5;
    if (/memorandum of conversation|memorandum of telephone conversation|memcon|telcon/i.test(text)) {
      score += 6;
    }
    if (/kosovo/i.test(text) && postVolume) score -= 5;
  }

  let bucket = "noise";
  if (score > 0 && inVolumeWindow && conversationTerms.length) bucket = "inVolumeConversations";
  else if (score > 0 && inVolumeWindow) bucket = "inVolumeContext";
  else if (score > 0 && postVolume) bucket = "postVolumeFollowOn";
  else if (score > 0) bucket = "undatedOrContext";

  return {
    year,
    score,
    bucket,
    matchedTerms: terms,
    conversationTerms
  };
}

async function loadManifest(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${source}`);
    return text;
  }

  return fs.readFileSync(source, "utf8");
}

async function main() {
  const source = argValue("--source", DEFAULT_MANIFEST_URL);
  const fullText = process.argv.includes("--metadata-only") ? false : true;
  const text = await loadManifest(source);
  const rows = parseCsv(text);
  const metadataScored = rows.map((record) => ({ ...record, ...scoreRecord(record) }));
  const fullTextResults = [];

  if (fullText) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    let processed = 0;
    const concurrency = Number(argValue("--concurrency", "8"));
    let index = 0;

    async function worker() {
      while (index < metadataScored.length) {
        const record = metadataScored[index];
        index += 1;
        try {
          const pdfPath = await downloadPdf(record);
          const pages = pageCount(pdfPath);
          const extractedText = pdfText(pdfPath);
          const searchableText = [recordText(record), extractedText].join("\n");
          const fullTextTerms = matchedFullTextTerms(searchableText);
          const inVolumeWindow = record.year >= 1993 && record.year <= 1995;
          const fullTextHit = fullTextTerms.length > 0 && notFalseDayton(searchableText);
          const selectedReason = SELECTED_STANDALONE_KEYS.get(recordKey(record)) || "";
          const excludedReason = EXCLUDED_IN_VOLUME_REASONS.get(recordKey(record)) || "";
          const reviewStatus = selectedReason
            ? "selected-standalone"
            : excludedReason
              ? "excluded-after-review"
              : fullTextHit && inVolumeWindow
                ? "review-needed"
                : fullTextHit
                  ? "out-of-period-follow-on"
                  : "no-regional-hit";
          const fullTextScore =
            (inVolumeWindow ? 20 : 0) +
            fullTextTerms.length * 3 +
            (/bosnia|dayton|srebrenica|sarajevo|gorazde|ifor|unprofor|milosevic|izetbegovic|tudjman|holbrooke/i.test(
              searchableText
            )
              ? 8
              : 0) +
            (/memorandum|memo|letter|note|talking points|telegram|cable|fax|official informal|dissent channel/i.test(
              searchableText
            )
              ? 2
              : 0);

          if (fullTextHit || selectedReason || excludedReason || record.bucket !== "noise") {
            fullTextResults.push({
              ...record,
              pages,
              fullTextTerms,
              fullTextScore,
              fullTextHit,
              reviewStatus,
              selectedReason,
              excludedReason,
              snippet: fullTextHit ? snippetFor(searchableText, fullTextTerms) : ""
            });
          }
        } catch (error) {
          fullTextResults.push({
            ...record,
            fullTextTerms: [],
            fullTextScore: record.score,
            fullTextHit: false,
            reviewStatus: "pdf-error",
            error: error.message
          });
        }

        processed += 1;
        if (processed % 100 === 0) {
          console.error(`Processed ${processed}/${metadataScored.length} Strobe PDFs`);
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }

  const scored = (fullText ? fullTextResults : metadataScored.filter((record) => record.bucket !== "noise"))
    .filter((record) => record.bucket !== "noise" || record.fullTextHit || record.reviewStatus === "selected-standalone")
    .sort((a, b) => {
      const selectedDelta =
        (b.reviewStatus === "selected-standalone" ? 1 : 0) - (a.reviewStatus === "selected-standalone" ? 1 : 0);
      if (selectedDelta) return selectedDelta;
      return (b.fullTextScore || b.score) - (a.fullTextScore || a.score) || (a.date || "").localeCompare(b.date || "");
    });

  const buckets = {
    inVolumeConversations: scored.filter((record) => record.bucket === "inVolumeConversations"),
    inVolumeContext: scored.filter(
      (record) =>
        record.bucket === "inVolumeContext" ||
        (record.year >= 1993 && record.year <= 1995 && record.reviewStatus === "selected-standalone")
    ),
    postVolumeFollowOn: scored.filter((record) => record.bucket === "postVolumeFollowOn"),
    undatedOrContext: scored.filter((record) => record.bucket === "undatedOrContext")
  };

  const selectedStandalone = scored
    .filter((record) => record.reviewStatus === "selected-standalone")
    .sort((a, b) => sortableDateValue(a.date).localeCompare(sortableDateValue(b.date)) || (a.title || "").localeCompare(b.title || ""));
  const excludedStandaloneHits = scored
    .filter((record) => record.reviewStatus === "excluded-after-review")
    .sort((a, b) => sortableDateValue(a.date).localeCompare(sortableDateValue(b.date)) || (a.title || "").localeCompare(b.title || ""));

  const report = {
    generatedAt: new Date().toISOString(),
    source,
    manifestUrl: "https://therealjameswilson.github.io/strobe-talbott-foia/manifest.html",
    searchMode: fullText ? "manifest metadata plus full PDF text" : "manifest metadata only",
    rowCount: rows.length,
    matchedCount: scored.length,
    buckets: Object.fromEntries(
      Object.entries(buckets).map(([name, records]) => [name, records.length])
    ),
    summary: {
      manifestRows: rows.length,
      searchedPdfFiles: fullText ? rows.length : 0,
      fullTextHits: fullText ? scored.filter((record) => record.fullTextHit).length : 0,
      inVolumeFullTextHits: scored.filter(
        (record) => record.year >= 1993 && record.year <= 1995 && record.fullTextHit
      ).length,
      selectedStandaloneRecords: selectedStandalone.length,
      selectedStandalonePages: selectedStandalone.reduce((total, record) => total + (record.pages || 0), 0),
      excludedInVolumeHits: excludedStandaloneHits.length,
      postVolumeFollowOnHits: scored.filter((record) => record.reviewStatus === "out-of-period-follow-on").length
    },
    standaloneCandidates: selectedStandalone.map((record) => ({
      documentId: record.document_id,
      date: record.date,
      year: record.year,
      title: record.title,
      pdfUrl: record.pdf_url,
      pageCount: record.pages,
      matchedTerms: record.fullTextTerms || record.matchedTerms,
      score: record.fullTextScore || record.score,
      reviewStatus: record.reviewStatus,
      selectedReason: record.selectedReason,
      snippet: record.snippet
    })),
    excludedInVolumeHits: excludedStandaloneHits.map((record) => ({
      documentId: record.document_id,
      date: record.date,
      year: record.year,
      title: record.title,
      pdfUrl: record.pdf_url,
      pageCount: record.pages,
      matchedTerms: record.fullTextTerms || record.matchedTerms,
      excludedReason: record.excludedReason,
      snippet: record.snippet
    })),
    records: scored.map((record) => ({
      documentId: record.document_id,
      date: record.date,
      year: record.year,
      title: record.title,
      pdfUrl: record.pdf_url,
      pageCount: record.pages || null,
      description: record.description,
      descriptionSource: record.description_source,
      bucket: record.bucket,
      score: record.fullTextScore || record.score,
      matchedTerms: record.matchedTerms,
      fullTextTerms: record.fullTextTerms || [],
      conversationTerms: record.conversationTerms,
      reviewStatus: record.reviewStatus || "",
      selectedReason: record.selectedReason || "",
      excludedReason: record.excludedReason || "",
      snippet: record.snippet || "",
      error: record.error || ""
    }))
  };

  const out = argValue("--out", "");
  if (out) {
    fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
