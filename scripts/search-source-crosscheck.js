#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const RESEARCH_REPORT_PATH = path.join(ROOT, "reports", "research-collection-search.json");
const PUBLIC_PAPERS_REPORT_PATH = path.join(ROOT, "reports", "public-papers-balkans-search.json");
const TALBOTT_REPORT_PATH = path.join(ROOT, "reports", "strobe-talbott-manifest-search.json");
const NARA_MEMCON_REPORT_PATH = path.join(ROOT, "reports", "nara-scout-memcon-telcon-search.json");
const CLINTON_EUROPE_ROOT = path.resolve(ROOT, "..", "Clinton-Europe");
const EUROPE_COLLECTION_REPORT_PATH = path.join(
  CLINTON_EUROPE_ROOT,
  "reports",
  "nara-collection-7388808-candidates.json"
);
const EUROPE_SCOUT_REPORT_PATH = path.join(CLINTON_EUROPE_ROOT, "reports", "nara-scout-candidates.json");
const REPORT_PATH = path.join(ROOT, "reports", "source-crosscheck-potential-documents.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-source-crosscheck-pdfs");

const BALKANS_TERMS =
  /bosnia|dayton|balkan|serbia|serb|croatia|croat|kosovo|yugoslav|sarajevo|srebrenica|milosevic|tudjman|izetbegovic|gorazde|bihac|split\s+agreement|contact\s+group|brcko|knin|mostar|safe\s+area/i;

const MONTHS = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12"
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function existingJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function normalizeUrl(url) {
  return String(url || "")
    .replace(/^http:/i, "https:")
    .toLowerCase();
}

function basenameKey(url) {
  if (!url) return "";
  try {
    const name = path.basename(new URL(url).pathname).toLowerCase();
    return name.replace(/\.(pdf|jpg|jpeg)$/i, "").replace(/[^a-z0-9]/g, "");
  } catch {
    return "";
  }
}

function catalogUrl(record) {
  if (record.catalogUrl) return record.catalogUrl;
  const naid = record.naId || record.naid || record.id || record.naIdNumber;
  return naid ? `https://catalog.archives.gov/id/${naid}` : "";
}

function recordNaid(record) {
  return String(record.naId || record.naid || record.id || record.naIdNumber || "").trim();
}

function pdfUrl(record) {
  if (record.pdfUrl) return record.pdfUrl;
  if (/\.pdf($|\?)/i.test(record.firstDigitalObjectUrl || "")) return record.firstDigitalObjectUrl;
  const objects = Array.isArray(record.digitalObjects) ? record.digitalObjects : [];
  const object = objects.find((item) => /\.pdf($|\?)/i.test(item.objectUrl || item.fileUrl || item.url || ""));
  return object ? object.objectUrl || object.fileUrl || object.url : "";
}

function candidateText(record) {
  return [
    record.title,
    record.scopeAndContent,
    record.sourceSeries,
    record.seriesTitle,
    record.category,
    ...(record.sections || []),
    ...(record.otherTitles || [])
  ]
    .filter(Boolean)
    .join(" ");
}

function inferredYear(record) {
  if (record.inferredYear) return Number(record.inferredYear);
  const titleCode = String(record.title || "").match(/^([0-9]{2})[0-9]{5}/);
  if (titleCode) {
    const year = Number(titleCode[1]);
    if (year >= 93 && year <= 95) return 1900 + year;
  }
  const text = candidateText(record);
  const explicit = text.match(/\b(1993|1994|1995)\b/);
  return explicit ? Number(explicit[1]) : null;
}

function exactDateFromText(text) {
  const match = String(text || "").match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-9]{1,2}),\s+(1993|1994|1995)\b/i
  );
  if (!match) return null;
  return `${match[3]}-${MONTHS[match[1].toLowerCase()]}-${String(match[2]).padStart(2, "0")}`;
}

function dateForCandidate(record, year) {
  const exact = exactDateFromText(candidateText(record));
  if (exact) {
    return {
      date: new Date(`${exact}T00:00:00Z`).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      }),
      sortDate: exact,
      dateCertainty: "catalog title"
    };
  }
  return {
    date: year ? String(year) : "1993-1995",
    sortDate: year ? `${year}-12-31` : "1995-12-31",
    dateCertainty: year ? "inferred from catalog/control number" : "inferred from source-family hit"
  };
}

function titleForCandidate(record) {
  const otherTitles = (record.otherTitles || []).filter(Boolean);
  const descriptive = otherTitles.find((title) => /\[[^\]]+[A-Za-z][^\]]+\]/.test(title));
  if (descriptive) return `${record.title} ${descriptive}`.replace(/\s+/g, " ").trim();
  return record.title || otherTitles[0] || `NAID ${recordNaid(record)}`;
}

function sourceSeries(record) {
  const value = record.sourceSeries || record.seriesTitle || record.parentTitle;
  if (value && typeof value === "object") {
    return [value.title, value.naid ? `(series NAID ${value.naid})` : ""].filter(Boolean).join(" ");
  }
  return value || "Clinton Presidential Records";
}

function loadExistingSurface(data, research) {
  const urls = new Set();
  const basenames = new Set();
  const naids = new Set();
  const addUrl = (url) => {
    if (!url) return;
    urls.add(normalizeUrl(url));
    const key = basenameKey(url);
    if (key) basenames.add(key);
    const naid = String(url).match(/catalog\.archives\.gov\/id\/([0-9]+)/i);
    if (naid) naids.add(naid[1]);
  };

  for (const document of data.documents || []) {
    for (const url of [document.url, document.pdfUrl, document.catalogUrl, document.itemUrl]) addUrl(url);
    const text = JSON.stringify(document);
    for (const match of text.matchAll(/(?:NAID|id\/)\s*:?\s*([0-9]{5,})/gi)) naids.add(match[1]);
  }

  for (const file of research.digitizedFiles || []) {
    for (const url of [file.itemUrl, file.pdfUrl, file.originalFile]) addUrl(url);
  }

  return { urls, basenames, naids };
}

function isRelevant(record) {
  return BALKANS_TERMS.test(candidateText(record)) || (record.sections || []).includes("Balkans and Kosovo");
}

function skipReason(record, surface) {
  if (!isRelevant(record)) return "not_balkans";
  const year = inferredYear(record);
  if (!(year >= 1993 && year <= 1995)) return "outside_1993_1995";
  const pdf = pdfUrl(record);
  if (!pdf) return /\.jpe?g($|\?)/i.test(record.firstDigitalObjectUrl || "") ? "jpg_only" : "no_pdf";
  const cat = catalogUrl(record);
  const key = basenameKey(pdf);
  const naid = recordNaid(record);
  if (
    surface.urls.has(normalizeUrl(pdf)) ||
    surface.urls.has(normalizeUrl(cat)) ||
    surface.basenames.has(key) ||
    surface.naids.has(naid)
  ) {
    return "already_surfaced";
  }
  return "";
}

function downloadFile(url, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { "User-Agent": "FRUS-Balkans-source-crosscheck/1.0" } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        downloadFile(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    });
    request.on("error", reject);
  });
}

async function countPages(url) {
  const name = path.basename(new URL(url).pathname) || `${basenameKey(url)}.pdf`;
  const destination = path.join(CACHE_DIR, name);
  if (!fs.existsSync(destination) || fs.statSync(destination).size === 0) {
    await downloadFile(url, destination);
  }
  try {
    const output = execFileSync("pdfinfo", [destination], { encoding: "utf8" });
    const match = output.match(/^Pages:\s+([0-9]+)/m);
    return { pageCount: match ? Number(match[1]) : null, pageCountStatus: match ? "counted" : "missing" };
  } catch (error) {
    return { pageCount: null, pageCountStatus: `pdfinfo failed: ${error.message}` };
  }
}

function sourceNoteDraft(record, addition) {
  const repository =
    addition.sourceFamily === "nara-catalog-7388808"
      ? "National Archives and Records Administration, National Archives Catalog"
      : "National Archives and Records Administration, National Archives Catalog / Clinton Presidential Library";
  const parts = [
    `Source: ${repository}, ${sourceSeries(record)}, file unit NAID ${addition.naid}, ${addition.itemUrl}.`,
    addition.originalFile ? `Digitized file: ${addition.originalFile}.` : "",
    addition.pageCount ? `${addition.pageCount} PDF pages counted.` : "PDF page count pending.",
    "Source-family cross-check lead only; verify folder/case file, document date, classification, distribution, annotations, attachments, and excisions against the PDF before any FRUS treatment."
  ];
  return parts.filter(Boolean).join(" ");
}

function makeAddition(record, sourceFamily, sourceLabel, index) {
  const year = inferredYear(record);
  const dates = dateForCandidate(record, year);
  const naid = recordNaid(record);
  const pdf = pdfUrl(record);
  const itemUrl = catalogUrl(record);
  const originalFile = path.basename(new URL(pdf).pathname);
  const target = {
    type: sourceLabel,
    relationship: sourceFamily,
    staff: "NARA Catalog source-family cross-check",
    folderTitle: sourceSeries(record),
    sourceFamily,
    naid
  };
  const addition = {
    id: `source-crosscheck-${sourceFamily}-${naid || index}`,
    title: titleForCandidate(record),
    kind: "Potential Document",
    documentScope: "Potential digitized document lead",
    date: dates.date,
    sortDate: dates.sortDate,
    dateCertainty: dates.dateCertainty,
    itemUrl,
    pdfUrl: pdf,
    originalFile,
    identifier: `NAID ${naid}`,
    naid,
    repository: "National Archives and Records Administration",
    sourceFamily,
    sourceFamilyLabel: sourceLabel,
    sourceSeries: sourceSeries(record),
    confidence: "high",
    score: record.score || 0,
    pageCount: null,
    pageCountStatus: "pending",
    targets: [target],
    otherTitles: record.otherTitles || [],
    sections: record.sections || [],
    category: record.category || "",
    compilerUse:
      "Potential digitized declassified U.S. record lead surfaced by checking the same NARA source families used in companion FRUS compiler pages. This is not an inclusion or structure recommendation."
  };
  addition.sourceNoteDraft = sourceNoteDraft(record, addition);
  return { record, addition };
}

function summarizeSkipped(items) {
  const counts = {};
  for (const reason of items) counts[reason] = (counts[reason] || 0) + 1;
  return counts;
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const data = readJson(DATA_PATH);
  const research = readJson(RESEARCH_REPORT_PATH);
  const publicPapers = existingJson(PUBLIC_PAPERS_REPORT_PATH);
  const talbott = existingJson(TALBOTT_REPORT_PATH);
  const naraMemcons = existingJson(NARA_MEMCON_REPORT_PATH);
  const collectionReport = readJson(EUROPE_COLLECTION_REPORT_PATH);
  const scoutReport = readJson(EUROPE_SCOUT_REPORT_PATH);
  const surface = loadExistingSurface(data, research);
  const seenNew = new Set();
  const skipped = [];
  const additions = [];

  for (const [records, sourceFamily, sourceLabel] of [
    [
      collectionReport.candidates || [],
      "nara-catalog-7388808",
      "NARA Catalog collection 7388808"
    ],
    [
      scoutReport.candidates || [],
      "nara-scout-europe-scopes",
      "NARA Scout Clinton NSC Europe-facing scopes"
    ]
  ]) {
    for (const record of records) {
      const reason = skipReason(record, surface);
      if (reason) {
        skipped.push(reason);
        continue;
      }
      const pdf = pdfUrl(record);
      const key = basenameKey(pdf) || recordNaid(record) || normalizeUrl(pdf);
      if (seenNew.has(key)) {
        skipped.push("duplicate_in_crosscheck");
        continue;
      }
      seenNew.add(key);
      additions.push(makeAddition(record, sourceFamily, sourceLabel, additions.length));
    }
  }

  for (const item of additions) {
    const count = await countPages(item.addition.pdfUrl);
    item.addition.pageCount = count.pageCount;
    item.addition.pageCountStatus = count.pageCountStatus;
    item.addition.sourceNoteDraft = sourceNoteDraft(item.record, item.addition);
  }

  const potentialDocuments = additions
    .map((item) => item.addition)
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title));
  const countedPages = potentialDocuments.reduce((sum, item) => sum + (item.pageCount || 0), 0);
  const byFamily = {};
  for (const item of potentialDocuments) {
    const family = byFamily[item.sourceFamily] || { documents: 0, pages: 0 };
    family.documents += 1;
    family.pages += item.pageCount || 0;
    byFamily[item.sourceFamily] = family;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This source-family cross-check adds potential digitized document leads for compiler review. It does not recommend inclusion and does not propose a FRUS volume structure.",
    sourceFamiliesChecked: [
      {
        id: "clinton-digital-library-research-plan",
        label: "Clinton Digital Library research-plan sweep",
        status: "already represented",
        selectedFiles: research.summary?.uniqueDigitizedFiles || (research.digitizedFiles || []).length,
        countedPages: research.summary?.countedPages || null
      },
      {
        id: "clinton-memcons-telcons",
        label: "Clinton Library / NARA Scout memcon-telcon search",
        status: "already represented",
        selectedRecords: naraMemcons?.declassifiedRecords || naraMemcons?.records?.length || null
      },
      {
        id: "strobe-talbott-foia",
        label: "Strobe Talbott FOIA manifest",
        status: "already represented",
        selectedRecords: talbott?.summary?.selectedStandaloneRecords || null,
        countedPages: talbott?.summary?.selectedStandalonePages || null
      },
      {
        id: "govinfo-public-papers",
        label: "GovInfo Clinton Public Papers",
        status: "already represented",
        selectedRecords: publicPapers?.summary?.selectedRecords || null,
        countedPages: publicPapers?.summary?.selectedPages || null
      },
      {
        id: "nara-catalog-7388808",
        label: "NARA Catalog collection 7388808",
        status: "new potential leads added",
        inputCandidates: (collectionReport.candidates || []).length,
        sourceSearchUrl: collectionReport.sourceSearchUrl,
        europeSearchUrl: collectionReport.europeSearchUrl
      },
      {
        id: "nara-scout-europe-scopes",
        label: "NARA Scout scopes 7386505, 7386739, 7388773",
        status: "new potential leads added",
        inputCandidates: (scoutReport.candidates || []).length,
        scoutUrl: scoutReport.scoutUrl,
        scopes: scoutReport.scopes || []
      }
    ],
    summary: {
      inputCandidates:
        (collectionReport.candidates || []).length + (scoutReport.candidates || []).length,
      addedPotentialDocuments: potentialDocuments.length,
      countedPages,
      byFamily,
      skipped: summarizeSkipped(skipped)
    },
    potentialDocuments
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)} with ${potentialDocuments.length} potential documents and ${countedPages} counted pages.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
