#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const RESEARCH_REPORT_PATH = path.join(ROOT, "reports", "research-collection-search.json");
const SOURCE_CROSSCHECK_PATH = path.join(ROOT, "reports", "source-crosscheck-potential-documents.json");
const TALBOTT_REPORT_PATH = path.join(ROOT, "reports", "strobe-talbott-manifest-search.json");
const REPORT_PATH = path.join(ROOT, "reports", "state-foia-balkans-search.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-state-foia-pdfs");

const API_URL = "https://foia.state.gov/api/Search2/SubmitSimpleQuery";
const FOIA_RECORD_BASE = "https://foia.state.gov/FOIALIBRARY/SearchResults.aspx";
const FOIA_PDF_BASE = "https://foia.state.gov/";

const QUERY_PACKS = [
  { label: "Bosnia", searchText: "Bosnia", limit: 500 },
  { label: "Dayton", searchText: "Dayton", limit: 250 },
  { label: "Sarajevo", searchText: "Sarajevo", limit: 300 },
  { label: "Srebrenica", searchText: "Srebrenica", limit: 250 },
  { label: "Bihac", searchText: "Bihac", limit: 250 },
  { label: "Gorazde", searchText: "Gorazde", limit: 250 },
  { label: "Milosevic", searchText: "Milosevic", limit: 350 },
  { label: "Izetbegovic", searchText: "Izetbegovic", limit: 250 },
  { label: "Tudjman", searchText: "Tudjman", limit: 250 },
  { label: "Croatia", searchText: "Croatia", limit: 350 },
  { label: "Krajina", searchText: "Krajina", limit: 250 },
  { label: "Kosovo", searchText: "Kosovo", limit: 250 },
  { label: "Macedonia", searchText: "Macedonia", limit: 150 },
  { label: "UNPROFOR", searchText: "UNPROFOR", limit: 350 },
  { label: "IFOR", searchText: "IFOR", limit: 200 },
  { label: "Holbrooke", searchText: "Holbrooke", limit: 300 },
  { label: "Frasure", searchText: "Frasure", limit: 250 },
  { label: "Former Yugoslavia", searchText: "Former Yugoslavia", limit: 350 },
  { label: "Belgrade Frasure case", searchText: "Bosnia", caseNumber: "F-2007-03885", limit: 300 }
];

const BALKANS_TERMS =
  /bosnia|herzegovina|dayton|sarajevo|srebrenica|bihac|gorazde|milosevic|izetbegovic|tudjman|croatia|krajina|kosovo|macedonia|unprofor|ifor|former yugoslavia|frasure|holbrooke|contact group|serbia|serbian|belgrade|zagreb/i;
const LOW_VALUE_TERMS =
  /daily press guidance|country report on human rights practices|npt|visa|administrative|contract|procurement|public affairs only|press guidance/i;
const HIGH_VALUE_TERMS =
  /holbrooke|frasure|milosevic|izetbegovic|tudjman|dayton|srebrenica|bihac|gorazde|unprofor|ifor|krajina|belgrade talks|contact group|sarajevo|safe area|lift and strike|air strikes|federation/i;

function readJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function normalizeUrl(url) {
  return String(url || "")
    .replace(/^http:/i, "https:")
    .toLowerCase();
}

function pdfUrl(record) {
  if (!record.pdfLink) return "";
  if (/^https?:\/\//i.test(record.pdfLink)) return record.pdfLink;
  return `${FOIA_PDF_BASE}${record.pdfLink.replace(/^\/+/, "")}`;
}

function recordUrl(record) {
  const params = new URLSearchParams();
  if (record.casenumber) params.set("caseNumber", record.casenumber);
  if (record.subject) params.set("searchText", record.subject);
  return `${FOIA_RECORD_BASE}?${params.toString()}`;
}

function datePart(value) {
  const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function displayDate(iso) {
  if (!iso) return "1993-1995";
  return new Date(`${iso}T00:00:00Z`).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Accept: "application/json",
            Referer: "https://foia.state.gov/FOIALIBRARY/SearchResults.aspx",
            "User-Agent": "FRUS-Balkans-State-FOIA/1.0"
          }
        },
        (response) => {
          let body = "";
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
              return;
            }
            try {
              resolve(JSON.parse(body));
            } catch (error) {
              reject(error);
            }
          });
        }
      )
      .on("error", reject);
  });
}

function queryUrl(pack, start, limit) {
  const params = new URLSearchParams({
    searchText: pack.searchText,
    collectionMatch: "",
    page: String(Math.floor(start / limit) + 1),
    start: String(start),
    limit: String(limit),
    beginDate: "19930101",
    endDate: "19951231",
    postedBeginDate: "",
    postedEndDate: "",
    caseNumber: pack.caseNumber || "",
    docFrom: "",
    docTo: "",
    email: "false",
    telegram: "true",
    misc: "true",
    me: "true",
    gc: "false",
    cc: "false",
    md: "true",
    pr: "false",
    sc: "false",
    rp: "true",
    tn: "false",
    dd: "true",
    cd: "false",
    mf: "false",
    exclude: "",
    sort: ""
  });
  return `${API_URL}?${params.toString()}`;
}

async function runQuery(pack) {
  const pageSize = 100;
  const first = await requestJson(queryUrl(pack, 0, Math.min(pageSize, pack.limit)));
  const total = first.totalHits || 0;
  const results = [...(first.Results || [])];
  const capped = Math.min(total, pack.limit);
  for (let start = pageSize; start < capped; start += pageSize) {
    const data = await requestJson(queryUrl(pack, start, Math.min(pageSize, capped - start)));
    results.push(...(data.Results || []));
  }
  return { ...pack, totalHits: total, fetched: results.length, results };
}

function existingSurface() {
  const data = readJson(DATA_PATH) || {};
  const research = readJson(RESEARCH_REPORT_PATH) || {};
  const crosscheck = readJson(SOURCE_CROSSCHECK_PATH) || {};
  const talbott = readJson(TALBOTT_REPORT_PATH) || {};
  const urls = new Set();
  const add = (url) => {
    if (url) urls.add(normalizeUrl(url));
  };
  for (const document of data.documents || []) {
    for (const url of [document.url, document.pdfUrl, document.itemUrl, document.sourcePdfUrl]) add(url);
  }
  for (const file of research.digitizedFiles || []) {
    for (const url of [file.itemUrl, file.pdfUrl, file.originalFile]) add(url);
  }
  for (const file of crosscheck.potentialDocuments || []) {
    for (const url of [file.itemUrl, file.pdfUrl, file.originalFile]) add(url);
  }
  for (const record of talbott.records || talbott.selectedRecords || []) {
    for (const url of [record.url, record.pdfUrl, record.itemUrl]) add(url);
  }
  return urls;
}

function score(record, matchedQueries) {
  const text = [
    record.subject,
    record.casesubject,
    record.from,
    record.to,
    record.casenumber,
    record.messagenumber,
    matchedQueries.join(" ")
  ].join(" ");
  let value = 0;
  if (BALKANS_TERMS.test(text)) value += 4;
  if (HIGH_VALUE_TERMS.test(text)) value += 4;
  if (record.doctype === "TE") value += 2;
  if (/STATE|BELGRADE|ZAGREB|SARAJEVO|USNATO|USUN|SECSTATE|MOSCOW|PARIS|LONDON|BONN|BRUSSELS/i.test(`${record.from} ${record.to}`)) value += 2;
  if (/F-2007-03885/i.test(record.casenumber || record.casesubject || "")) value += 4;
  if (/S|C/.test(record.classification || "")) value += 1;
  if (LOW_VALUE_TERMS.test(text)) value -= 3;
  return value;
}

function downloadFile(url, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "FRUS-Balkans-State-FOIA/1.0" } }, (response) => {
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
      })
      .on("error", reject);
  });
}

async function countPages(url, apiPages) {
  if (Number(apiPages) > 0) return { pageCount: Number(apiPages), pageCountStatus: "state api" };
  const destination = path.join(CACHE_DIR, path.basename(new URL(url).pathname));
  if (!fs.existsSync(destination) || fs.statSync(destination).size === 0) {
    await downloadFile(url, destination);
  }
  try {
    const output = execFileSync("pdfinfo", [destination], { encoding: "utf8" });
    const pages = Number(output.match(/^Pages:\s+([0-9]+)/m)?.[1] || 0);
    return { pageCount: pages || null, pageCountStatus: pages ? "pdfinfo" : "missing" };
  } catch (error) {
    return { pageCount: null, pageCountStatus: `pdfinfo failed: ${error.message}` };
  }
}

function sourceNote(record, pageCount) {
  const pageWord = Number(pageCount) === 1 ? "page" : "pages";
  const cableLine = [
    record.classification,
    record.doctype,
    record.from && record.to ? `${record.from} to ${record.to}` : "",
    displayDate(datePart(record.docdate))
  ]
    .filter(Boolean)
    .join("; ");
  return [
    `Source: Department of State, FOIA Virtual Reading Room, case ${record.casenumber}, document ${record.messagenumber || path.basename(pdfUrl(record), ".pdf")}.`,
    `${cableLine || "Classification and transmission metadata not yet transcribed."}.`,
    `Direct FOIA PDF; ${pageCount || "unverified"} ${pageWord}.`,
    "Cable number, TAGS/SUBJECT, drafting/clearance, addressees, attachments, distribution, and excisions not yet verified."
  ].join(" ");
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const surface = existingSurface();
  const packs = [];
  for (const pack of QUERY_PACKS) packs.push(await runQuery(pack));

  const byPdf = new Map();
  for (const pack of packs) {
    for (const record of pack.results) {
      const pdf = pdfUrl(record);
      if (!pdf) continue;
      const iso = datePart(record.docdate);
      if (!/^199[345]-/.test(iso)) continue;
      const text = [record.subject, record.casesubject, record.from, record.to, record.messagenumber].join(" ");
      if (!BALKANS_TERMS.test(text)) continue;
      const item = byPdf.get(pdf) || { ...record, matchedQueries: [] };
      item.matchedQueries.push(pack.label);
      byPdf.set(pdf, item);
    }
  }

  const allCandidates = [...byPdf.values()].map((record) => ({
    ...record,
    pdfUrl: pdfUrl(record),
    itemUrl: recordUrl(record),
    score: score(record, record.matchedQueries)
  }));
  const selected = allCandidates
    .filter((record) => record.score >= 7 && !surface.has(normalizeUrl(record.pdfUrl)))
    .sort((a, b) => b.score - a.score || datePart(a.docdate).localeCompare(datePart(b.docdate)))
    .slice(0, 250);

  const stateFoiaDocuments = [];
  for (const [index, record] of selected.entries()) {
    const count = await countPages(record.pdfUrl, record.numpages);
    const iso = datePart(record.docdate);
    stateFoiaDocuments.push({
      id: `state-foia-${path.basename(record.pdfUrl, ".pdf").toLowerCase()}-${index + 1}`,
      title: record.subject || record.casesubject || `State FOIA ${record.casenumber}`,
      kind: record.doctype === "TE" ? "Telegram" : "State FOIA Record",
      documentScope: "Potential State Department document lead",
      date: displayDate(iso),
      sortDate: iso || "1995-12-31",
      dateCertainty: "State FOIA metadata",
      itemUrl: record.itemUrl,
      pdfUrl: record.pdfUrl,
      originalFile: path.basename(new URL(record.pdfUrl).pathname),
      identifier: [record.casenumber, record.messagenumber].filter(Boolean).join("; "),
      repository: "Department of State, FOIA Virtual Reading Room",
      sourceFamily: "state-foia-virtual-reading-room",
      sourceFamilyLabel: "State FOIA Virtual Reading Room",
      sourceSeries: record.casesubject || "State Department FOIA release",
      confidence: record.score >= 11 ? "high" : "medium",
      score: record.score,
      pageCount: count.pageCount,
      pageCountStatus: count.pageCountStatus,
      classification: record.classification || "",
      releasedecision: record.releasedecision || "",
      doctype: record.doctype || "",
      from: record.from || "",
      to: record.to || "",
      caseNumber: record.casenumber || "",
      messageNumber: record.messagenumber || "",
      matchedQueries: record.matchedQueries,
      targets: [
        {
          type: "State Department source gap mitigation",
          relationship: "state-foia-virtual-reading-room",
          staff: [record.from, record.to].filter(Boolean).join(" to "),
          folderTitle: record.casesubject || "State Department FOIA release",
          sourceFamily: "state-foia-virtual-reading-room",
          rank: record.score
        }
      ],
      compilerUse:
        "Potential State Department cable/memorandum lead surfaced to mitigate the State-record gap. This is not an inclusion recommendation.",
      sourceNoteDraft: sourceNote(record, count.pageCount)
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceUrl: "https://foia.state.gov/",
    apiEndpoint: API_URL,
    missionBoundary:
      "This report adds State Department FOIA candidate leads for compiler review. It does not recommend inclusion and does not propose volume structure.",
    queryPacks: packs.map(({ results, ...pack }) => pack),
    summary: {
      queryPacks: packs.length,
      totalHitsAcrossQueries: packs.reduce((sum, pack) => sum + (pack.totalHits || 0), 0),
      fetchedRows: packs.reduce((sum, pack) => sum + pack.fetched, 0),
      uniqueBalkansPdfRows: allCandidates.length,
      selectedCandidateDocuments: stateFoiaDocuments.length,
      countedPages: stateFoiaDocuments.reduce((sum, item) => sum + (item.pageCount || 0), 0),
      highConfidenceDocuments: stateFoiaDocuments.filter((item) => item.confidence === "high").length,
      mediumConfidenceDocuments: stateFoiaDocuments.filter((item) => item.confidence === "medium").length
    },
    stateFoiaDocuments
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)} with ${stateFoiaDocuments.length} State FOIA candidates and ${report.summary.countedPages} counted pages.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
