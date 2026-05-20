#!/usr/bin/env node

const fs = require("node:fs");

const DEFAULT_MANIFEST_URL =
  "https://therealjameswilson.github.io/strobe-talbott-foia/data/manifest_enriched.csv";

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
  const text = await loadManifest(source);
  const rows = parseCsv(text);
  const scored = rows
    .map((record) => ({ ...record, ...scoreRecord(record) }))
    .filter((record) => record.bucket !== "noise")
    .sort((a, b) => b.score - a.score || (a.date || "").localeCompare(b.date || ""));

  const buckets = {
    inVolumeConversations: scored.filter((record) => record.bucket === "inVolumeConversations"),
    inVolumeContext: scored.filter((record) => record.bucket === "inVolumeContext"),
    postVolumeFollowOn: scored.filter((record) => record.bucket === "postVolumeFollowOn"),
    undatedOrContext: scored.filter((record) => record.bucket === "undatedOrContext")
  };

  const report = {
    generatedAt: new Date().toISOString(),
    source,
    manifestUrl: "https://therealjameswilson.github.io/strobe-talbott-foia/manifest.html",
    rowCount: rows.length,
    matchedCount: scored.length,
    buckets: Object.fromEntries(
      Object.entries(buckets).map(([name, records]) => [name, records.length])
    ),
    records: scored.map((record) => ({
      documentId: record.document_id,
      date: record.date,
      year: record.year,
      title: record.title,
      pdfUrl: record.pdf_url,
      description: record.description,
      descriptionSource: record.description_source,
      bucket: record.bucket,
      score: record.score,
      matchedTerms: record.matchedTerms,
      conversationTerms: record.conversationTerms
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
