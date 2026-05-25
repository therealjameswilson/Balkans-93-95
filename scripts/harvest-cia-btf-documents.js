#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");
const REPORT_PATH = path.join(ROOT, "reports", "cia-btf-document-search.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-cia-btf-pdfs");
const COLLECTION_URL =
  "https://clinton.presidentiallibraries.us/items/browse?collection=37&sort_field=Dublin+Core%2CTitle&sort_dir=a";
const CLINTON_BASE = "https://clinton.presidentiallibraries.us";

const MONTHS = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec"
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "FRUS-Balkans-CIA-BTF/1.0" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          response.resume();
          fetchText(response.headers.location).then(resolve, reject);
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function downloadFile(url, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "FRUS-Balkans-CIA-BTF/1.0" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          response.resume();
          downloadFile(response.headers.location, destination).then(resolve, reject);
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        const file = fs.createWriteStream(destination);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;|&#8212;/g, "-");
}

function compact(value = "") {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function slug(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseBrowseItems(html) {
  const records = [];
  const itemRe = /<h2><a href="\/items\/show\/([0-9]+)" class="permalink">([\s\S]*?)<\/a><\/h2>[\s\S]*?<img [^>]*(?:alt|title)="([^"]*\.pdf)"/g;
  for (const match of html.matchAll(itemRe)) {
    records.push({
      itemId: match[1],
      title: compact(match[2]),
      originalFile: compact(match[3])
    });
  }
  return records;
}

function dateParts(title = "") {
  const exact = title.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})([A-Z])?/i);
  if (exact) {
    return {
      year: Number(exact[1]),
      sortDate: `${exact[1]}-${exact[2]}-${exact[3]}`,
      date: `${MONTHS[exact[2]]} ${Number(exact[3])}, ${exact[1]}`,
      certainty: "title date"
    };
  }
  const month = title.match(/^([0-9]{4})-([0-9]{2})([A-Z])?\b/i);
  if (month) {
    return {
      year: Number(month[1]),
      sortDate: `${month[1]}-${month[2]}-15`,
      date: `${MONTHS[month[2]]} ${month[1]}`,
      certainty: "title month"
    };
  }
  const year = title.match(/^([0-9]{4})\b/);
  if (year) {
    return {
      year: Number(year[1]),
      sortDate: `${year[1]}-12-31`,
      date: year[1],
      certainty: "title year"
    };
  }
  return { year: null, sortDate: "1995-12-31", date: "1993-1995", certainty: "undated title" };
}

function documentKind(title = "") {
  if (/minutes/i.test(title)) return "Minutes";
  if (/\bNIE\b|National Intelligence Estimate/i.test(title)) return "Intelligence Estimate";
  if (/assessment/i.test(title)) return "Intelligence Assessment";
  if (/report/i.test(title)) return "Report";
  if (/memorandum|\bmemo\b/i.test(title)) return "Memorandum";
  if (/paper/i.test(title)) return "Paper";
  if (/letter/i.test(title)) return "Letter";
  return "Intelligence document";
}

function subjectsFor(title = "") {
  const tests = [
    ["Bosnia and Herzegovina", /bosnia|sarajevo|srebrenica|gorazde|bihac/i],
    ["Croatia", /croatia|krajina|zagreb|knin|slavonia/i],
    ["Serbia and Montenegro", /serbia|serb|milosevic|belgrade|montenegro/i],
    ["Kosovo", /kosovo/i],
    ["Macedonia", /macedonia/i],
    ["United Nations", /UNPROFOR|United Nations|safe area|safe haven/i],
    ["NATO and air power", /NATO|air strike|airstrike|no-fly|air defense|airdrop/i],
    ["Sanctions", /sanction/i],
    ["War crimes and atrocities", /war crime|atrocit|tribunal|rape|genocide/i],
    ["Peace negotiations", /peace|Contact Group|Dayton|Vance|Owen|plan/i],
    ["Defense and military implementation", /OSD|Defense|military|combatant|force|withdrawal|IFOR|UNPROFOR/i],
    ["Intelligence", /BTF|intelligence|CIA|DDCI|NIC|NIE|Office of European Analysis/i]
  ];
  return tests.filter(([, regex]) => regex.test(title)).map(([label]) => label);
}

function pdfFromItemPage(html) {
  const viewer = html.match(/viewer\.html\?file=([^"&]+)/);
  if (viewer) return decodeURIComponent(viewer[1]);
  const direct = html.match(/https:\/\/clinton\.presidentiallibraries\.us\/files\/original\/[^"'<>]+\.pdf/i);
  return direct ? direct[0] : "";
}

function sourceNote(record) {
  return `Source: William J. Clinton Presidential Library, Clinton Presidential Records, Bosnian Declassified Records, item ${record.itemId}. Classification marking not yet transcribed. Digital copy, source PDF pp. ${record.sourcePdfPages}; ${record.pageCount} ${record.pageCount === 1 ? "page" : "pages"}.`;
}

async function countPages(pdfUrl, itemId) {
  const destination = path.join(CACHE_DIR, `${itemId}-${path.basename(new URL(pdfUrl).pathname)}`);
  if (!fs.existsSync(destination) || fs.statSync(destination).size === 0) {
    await downloadFile(pdfUrl, destination);
  }
  const output = execFileSync("pdfinfo", [destination], { encoding: "utf8" });
  const pages = Number(output.match(/^Pages:\s+([0-9]+)/m)?.[1] || 0);
  return pages || null;
}

function sortRecords(a, b) {
  return (
    String(a.sortDate || "").localeCompare(String(b.sortDate || "")) ||
    String(a.kind || "").localeCompare(String(b.kind || "")) ||
    String(a.title || "").localeCompare(String(b.title || ""))
  );
}

function addSourceCards(data, report) {
  const cards = [
    {
      id: "cia-btf-document-search",
      label: "CIA/Balkan Task Force Document Harvest",
      institution: "William J. Clinton Presidential Library",
      identifier: "Bosnian Declassified Records collection 37",
      scope: "Document-level declassified intelligence and policy records, 1993-1995",
      status: "Harvested",
      description: `Harvested ${report.summary.inPeriodDocuments} in-period standalone records from the Bosnian Declassified Records collection, with ${report.summary.countedPages} counted PDF pages.`,
      url: "reports/cia-btf-document-search.json",
      tags: ["CIA/BTF", "Intelligence", "Bosnia", "Declassified documents"],
      compilerUse: "Use as the document-level intelligence and policy layer for BTF/CIA gap mitigation."
    }
  ];
  const byId = new Map((data.sources || []).map((source) => [source.id, source]));
  for (const card of cards) byId.set(card.id, { ...(byId.get(card.id) || {}), ...card });
  data.sources = [...byId.values()];
}

function mergeDocuments(data, documents) {
  const existingById = new Map((data.documents || []).map((record) => [record.id, record]));
  for (const record of documents) {
    existingById.set(record.id, { ...(existingById.get(record.id) || {}), ...record });
  }
  data.documents = [...existingById.values()].sort(sortRecords);
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const html = await fetchText(COLLECTION_URL);
  const collectionItems = parseBrowseItems(html);
  const inPeriod = collectionItems.filter((item) => {
    const parts = dateParts(item.title);
    return parts.year >= 1993 && parts.year <= 1995;
  });

  const documents = [];
  for (let index = 0; index < inPeriod.length; index += 1) {
    const item = inPeriod[index];
    const itemUrl = `${CLINTON_BASE}/items/show/${item.itemId}`;
    const itemHtml = await fetchText(itemUrl);
    const pdfUrl = pdfFromItemPage(itemHtml);
    if (!pdfUrl) throw new Error(`No PDF found for ${itemUrl}`);
    const pageCount = await countPages(pdfUrl, item.itemId);
    const dates = dateParts(item.title);
    const kind = documentKind(item.title);
    const record = {
      id: `cia-btf-${item.itemId}`,
      date: dates.date,
      sortDate: dates.sortDate,
      dateCertainty: dates.certainty,
      kind,
      documentType: kind,
      documentScope: "Intelligence / policy document",
      title: item.title,
      collection: "Bosnian Declassified Records",
      identifier: `BTF item ${item.itemId}`,
      repository: "William J. Clinton Presidential Library, Clinton Digital Library",
      sourceFamily: "cia-btf-clinton-library",
      sourceFamilyLabel: "CIA/Balkan Task Force document harvest",
      sourceSeries: "Director of Central Intelligence Interagency Balkan Task Force",
      itemId: item.itemId,
      url: itemUrl,
      itemUrl,
      pdfUrl,
      sourcePdfUrl: pdfUrl,
      originalFile: item.originalFile,
      pageCount,
      localPdfPageCount: pageCount,
      sourcePdfPages: pageCount ? `1-${pageCount}` : "pending",
      pageCountStatus: pageCount ? "pdfinfo" : "pending",
      confidence: "high",
      score: 95,
      subjects: subjectsFor(item.title),
      tags: ["CIA/BTF", "Bosnian Declassified Records", ...subjectsFor(item.title).slice(0, 4)],
      compilerUse:
        "Standalone declassified CIA/BTF or intelligence-policy record harvested from the Clinton Library Bosnian Declassified Records collection.",
      extractionStatus: "Direct Clinton Digital Library PDF; no packet extraction required.",
      targets: [
        {
          type: "Clinton Digital Library collection",
          relationship: "cia-btf-document-level",
          staff: "Director of Central Intelligence Interagency Balkan Task Force",
          folderTitle: "Bosnian Declassified Records",
          collectionId: "37"
        }
      ]
    };
    record.sourceNote = sourceNote(record);
    record.sourceNoteDraft = record.sourceNote;
    documents.push(record);
    if ((index + 1) % 25 === 0) console.log(`Processed ${index + 1}/${inPeriod.length} BTF documents.`);
  }

  documents.sort(sortRecords);
  const summary = {
    collectionItems: collectionItems.length,
    inPeriodDocuments: documents.length,
    countedPages: documents.reduce((sum, item) => sum + (item.pageCount || 0), 0),
    byYear: Object.fromEntries(
      [1993, 1994, 1995].map((year) => [
        String(year),
        {
          documents: documents.filter((item) => String(item.sortDate).startsWith(String(year))).length,
          pages: documents
            .filter((item) => String(item.sortDate).startsWith(String(year)))
            .reduce((sum, item) => sum + (item.pageCount || 0), 0)
        }
      ])
    ),
    defenseMilitaryDocuments: documents.filter((item) =>
      /OSD|Defense|military|combatant|force|withdrawal|IFOR|UNPROFOR|air|NATO|no-fly/i.test(
        `${item.title} ${(item.subjects || []).join(" ")}`
      )
    ).length,
    warCrimesAtrocityDocuments: documents.filter((item) =>
      /war crime|atrocit|tribunal|rape|genocide|Srebrenica/i.test(`${item.title} ${(item.subjects || []).join(" ")}`)
    ).length
  };

  const report = {
    generatedAt: new Date().toISOString(),
    sourceUrl: COLLECTION_URL,
    collection: "Bosnian Declassified Records",
    missionBoundary:
      "This report harvests document-level declassified CIA/BTF and intelligence-policy records for compiler consideration. It does not recommend inclusion or volume structure.",
    summary,
    documents
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  mergeDocuments(data, documents);
  addSourceCards(data, report);
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)} with ${documents.length} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
