#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT = path.join(ROOT, "reports", "public-papers-balkans-search.json");
const CACHE_DIR = path.join("/private/tmp", "ppp-clinton-zips");
const SOURCE_COLLECTION_URL =
  "https://www.govinfo.gov/app/collection/ppp/president-42_Clinton,%20William%20J./1993/01%21A%21January%2020%20to%20July%2031%2C%201993";
const GOVINFO_PACKAGE_BASE = "https://www.govinfo.gov/content/pkg";

const PACKAGES = [
  "PPP-1993-book1",
  "PPP-1993-book2",
  "PPP-1994-book1",
  "PPP-1994-book2",
  "PPP-1995-book1",
  "PPP-1995-book2"
];

const TERM_PATTERNS = [
  ["bosnia", /\bbosnia\b|\bbosnian(s)?\b|\bbosniak(s)?\b|\bbosnia herzegovina\b|\bbosnia and herzegovina\b/],
  ["yugoslavia", /\byugoslavia\b|\byugoslav(ian)?\b|\bformer yugoslavia\b|\bformer yugoslav republic\b/],
  ["serbia/serbs", /\bserbia\b|\bserbian(s)?\b|\bserbs?\b/],
  ["croatia", /\bcroatia\b|\bcroatian(s)?\b|\bcroats?\b/],
  ["kosovo", /\bkosovo\b/],
  ["macedonia", /\bmacedonia(n)?\b|\bfyrom\b|\bformer yugoslav republic of macedonia\b/],
  ["slovenia", /\bslovenia(n)?\b/],
  ["balkan", /\bbalkan(s)?\b/],
  ["sarajevo", /\bsarajevo\b/],
  ["srebrenica", /\bsrebrenica\b/],
  ["gorazde", /\bgorazde\b/],
  ["bihac", /\bbihac\b/],
  ["brcko", /\bbrcko\b/],
  ["milosevic", /\bmilosevic\b/],
  ["karadzic", /\bkaradzic\b/],
  ["mladic", /\bmladic\b/],
  ["izetbegovic", /\bizetbegovic\b/],
  ["tudjman", /\btudjman\b|\btudman\b/],
  ["unprofor", /\bunprofor\b/],
  ["ifor", /\bifor\b|\bimplementation force\b|\bpeace implementation force\b/],
  ["dayton", /\bdayton\b/],
  ["contact group", /\bcontact group\b/],
  ["lift and strike", /\blift and strike\b/],
  ["arms embargo", /\barms embargo\b/],
  ["safe areas", /\bsafe area(s)?\b/],
  ["war crimes", /\bwar crime(s)?\b|\bwar crimes tribunal\b|\bicty\b|\binternational criminal tribunal\b/]
];

const MONTHS = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12"
};

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCharCode(Number(number)));
}

function normalizeAscii(value = "") {
  return decodeHtml(value)
    .replace(/[ĐÐ]/g, "D")
    .replace(/[đð]/g, "d")
    .replace(/[Š]/g, "S")
    .replace(/[š]/g, "s")
    .replace(/[Ž]/g, "Z")
    .replace(/[ž]/g, "z")
    .replace(/[ĆČ]/g, "C")
    .replace(/[ćč]/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchableText(value = "") {
  return normalizeAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, ""));
}

function compactWhitespace(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function parseIsoDate(date = "") {
  const match = date.match(/\b([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})\b/);
  if (!match || !MONTHS[match[1]]) return "";
  return `${match[3]}-${MONTHS[match[1]]}-${String(match[2]).padStart(2, "0")}`;
}

function packageTitle(pkg) {
  const match = pkg.match(/^PPP-(\d{4})-book(\d)$/);
  if (!match) return pkg;
  return `Public Papers of the Presidents of the United States: William J. Clinton (${match[1]}, Book ${
    match[2] === "1" ? "I" : "II"
  })`;
}

function packageRoot(pkg) {
  return path.join(CACHE_DIR, pkg, pkg);
}

function download(url, outPath) {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) return;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync("curl", ["-L", "--fail", "--retry", "3", "-o", outPath, url], { stdio: "inherit" });
}

function ensurePackage(pkg) {
  const root = packageRoot(pkg);
  const htmlDir = path.join(root, "html");
  if (fs.existsSync(htmlDir)) return root;

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = path.join(CACHE_DIR, `${pkg}.zip`);
  download(`${GOVINFO_PACKAGE_BASE}/${pkg}/zip/${pkg}.zip`, zipPath);

  const outDir = path.join(CACHE_DIR, pkg);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync("unzip", ["-q", zipPath, "-d", outDir], { stdio: "inherit" });
  return root;
}

function listDocumentHtmlFiles(root) {
  const htmlDir = path.join(root, "html");
  return fs
    .readdirSync(htmlDir)
    .filter((name) => /doc-pg.*\.htm$/i.test(name))
    .map((name) => path.join(htmlDir, name))
    .sort();
}

function parsePageHeader(text) {
  const match = text.match(/\[Pages?\s+(\d+)(?:-(\d+))?\]/);
  if (!match) return { sourcePdfPages: "", pageCount: 0, firstPage: Number.MAX_SAFE_INTEGER };
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  return {
    sourcePdfPages: start === end ? String(start) : `${start}-${end}`,
    pageCount: end >= start ? end - start + 1 : 0,
    firstPage: start
  };
}

function sourceOrderFor(granule, firstPage) {
  const match = granule.match(/doc-pg(\d+)(?:-(\d+))?/);
  if (!match) return firstPage;
  return Number(match[1]) + Number(match[2] || 0) / 100;
}

function titleFromHtml(html, collection) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return compactWhitespace(stripTags(match[1]).replace(collection, "").replace(/^\s*-\s*/, ""));
}

function matchedTerms(text) {
  const haystack = searchableText(text);
  return TERM_PATTERNS.filter(([, pattern]) => pattern.test(haystack)).map(([label]) => label);
}

function publicPaperForm(title = "") {
  if (/^The President's News Conference/i.test(title)) return "News Conference";
  if (/^News Conference/i.test(title)) return "News Conference";
  if (/^Remarks and/i.test(title)) return "Remarks";
  if (/^Remarks/i.test(title)) return "Remarks";
  if (/^Exchange With Reporters/i.test(title)) return "Exchange";
  if (/^Interview/i.test(title)) return "Interview";
  if (/^Statement/i.test(title) || /^White House Statement/i.test(title)) return "Statement";
  if (/^Joint Statement/i.test(title)) return "Joint Statement";
  if (/^Letter/i.test(title)) return "Letter";
  if (/^Message/i.test(title)) return "Message";
  if (/^The President's Radio Address/i.test(title) || /^Radio Address/i.test(title)) return "Radio Address";
  if (/^Address/i.test(title)) return "Address";
  if (/^Executive Order/i.test(title)) return "Executive Order";
  if (/^Proclamation/i.test(title)) return "Proclamation";
  if (/^Notice/i.test(title)) return "Notice";
  if (/^Memorandum/i.test(title)) return "Memorandum";
  if (/^Nomination/i.test(title)) return "Nomination";
  return "Public Papers Record";
}

function relevanceExclusion(record) {
  const title = record.title || "";
  const hits = record.matchedTerms || [];

  if (/Nomination for Five Ambassadorial Posts/i.test(title)) {
    return "Excluded as an ambassadorial nomination with only an incidental Slovenia hit.";
  }

  if (/Nomination for Posts at the Housing and Urban Development, Transportation, and State Departments/i.test(title)) {
    return "Excluded as a nominations record with only an incidental Croatia ambassadorial hit.";
  }

  if (
    hits.length === 1 &&
    hits.includes("dayton") &&
    /Cleveland City Club|Law Enforcement Community in London, Ohio|AmeriCorps Public Safety Forum|Thanksgiving Turkey Presentation Ceremony/i.test(
      title
    )
  ) {
    return "Excluded as a Dayton, Ohio false positive rather than a Balkans/Dayton peace-process record.";
  }

  if (hits.length === 1 && hits.includes("war crimes") && /Iraq|Thomas J\. Dodd/i.test(title)) {
    return "Excluded as an Iraq or general war-crimes false positive rather than a Balkans record.";
  }

  return "";
}

function snippetFor(text, terms) {
  const clean = compactWhitespace(stripTags(text));
  const lower = normalizeAscii(clean).toLowerCase();
  const needles = terms.flatMap((term) => term.split("/")).map((term) => term.trim()).filter(Boolean);
  const index = needles.reduce((best, term) => {
    const found = lower.indexOf(term);
    if (found < 0) return best;
    return best < 0 ? found : Math.min(best, found);
  }, -1);
  if (index < 0) return clean.slice(0, 360);
  const start = Math.max(0, index - 140);
  const end = Math.min(clean.length, index + 280);
  return `${start > 0 ? "..." : ""}${clean.slice(start, end)}${end < clean.length ? "..." : ""}`;
}

function sourceNoteFor(record) {
  const pageWord = record.pageCount === 1 ? "page" : "pages";
  return `Source: Government Publishing Office, GovInfo, ${record.collection}, ${record.identifier}. Public record. Public Papers source pagination, pp. ${record.sourcePdfPages}; ${record.pageCount} ${pageWord}.`;
}

function parseRecord(pkg, filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const preMatch = html.match(/<pre>([\s\S]*?)<\/pre>/i);
  const pre = preMatch ? preMatch[1] : html;
  const text = stripTags(pre);
  const collection = (text.match(/\[Public Papers[^\]]+\]/) || [""])[0].replace(/^\[|\]$/g, "");
  const date = (text.match(/\[([A-Z][a-z]+ \d{1,2}, \d{4})\]/) || [])[1] || "";
  const sortDate = parseIsoDate(date);
  const title = titleFromHtml(html, collection);
  const granule = path.basename(filePath, ".htm");
  const pages = parsePageHeader(text);
  const terms = matchedTerms(`${title}\n${text}`);
  const form = publicPaperForm(title);
  const year = sortDate.slice(0, 4);
  const identifier = `${pkg}; ${granule}`;
  const url = `https://www.govinfo.gov/app/details/${pkg}/${granule}`;
  const pdfUrl = `${GOVINFO_PACKAGE_BASE}/${pkg}/pdf/${granule}.pdf`;
  const htmlUrl = `${GOVINFO_PACKAGE_BASE}/${pkg}/html/${granule}.htm`;

  const record = {
    id: `public-papers-${granule.toLowerCase().replace(/^ppp-/, "")}`,
    pkg,
    granule,
    date,
    sortDate,
    sourceOrder: sourceOrderFor(granule, pages.firstPage),
    kind: form,
    documentType: "Public Papers Record",
    documentScope: "Public statement",
    publicPaperForm: form,
    title,
    identifier,
    collection: collection || packageTitle(pkg),
    repository: "Government Publishing Office, GovInfo",
    url,
    htmlUrl,
    pdfUrl,
    sourcePdfUrl: pdfUrl,
    sourcePdfPages: pages.sourcePdfPages,
    pageCount: pages.pageCount,
    localPdfPageCount: pages.pageCount,
    extractionStatus: "Direct GovInfo Public Papers granule; page count follows the GovInfo source page range.",
    subjects: terms,
    matchedTerms: terms,
    tags: ["Public Papers", "GovInfo", year, ...terms.slice(0, 4)].filter(Boolean),
    compilerUse: `Public Papers record with Balkans-related term hits (${terms.join(", ")}), inserted chronologically as public-record context for compiler consideration; not a recommendation for inclusion.`,
    snippet: snippetFor(text, terms)
  };

  record.sourceNote = sourceNoteFor(record);
  return record;
}

function byChronology(a, b) {
  return (
    (a.sortDate || "").localeCompare(b.sortDate || "") ||
    (a.sourceOrder || Number.MAX_SAFE_INTEGER) - (b.sourceOrder || Number.MAX_SAFE_INTEGER) ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function summarizeByYear(records) {
  const summary = {};
  for (const record of records) {
    const year = (record.sortDate || "").slice(0, 4) || "undated";
    if (!summary[year]) summary[year] = { records: 0, pages: 0 };
    summary[year].records += 1;
    summary[year].pages += record.pageCount || 0;
  }
  return summary;
}

function main() {
  const outPath = path.resolve(argValue("--out", DEFAULT_OUT));
  const rawHits = [];
  let scannedGranules = 0;

  for (const pkg of PACKAGES) {
    const root = ensurePackage(pkg);
    for (const filePath of listDocumentHtmlFiles(root)) {
      scannedGranules += 1;
      const record = parseRecord(pkg, filePath);
      if (record.matchedTerms.length) rawHits.push(record);
    }
  }

  const inDateHits = rawHits.filter((record) => record.sortDate >= "1993-01-20" && record.sortDate <= "1995-12-31");
  const excludedRecords = [];
  const selectedRecords = [];

  for (const record of inDateHits) {
    const exclusionReason = relevanceExclusion(record);
    if (exclusionReason) {
      excludedRecords.push({ ...record, exclusionReason });
    } else {
      selectedRecords.push(record);
    }
  }

  selectedRecords.sort(byChronology);
  excludedRecords.sort(byChronology);

  const selectedPages = selectedRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceCollectionUrl: SOURCE_COLLECTION_URL,
    packages: PACKAGES.map((pkg) => ({
      id: pkg,
      title: packageTitle(pkg),
      zipUrl: `${GOVINFO_PACKAGE_BASE}/${pkg}/zip/${pkg}.zip`,
      packageUrl: `https://www.govinfo.gov/app/details/${pkg}`
    })),
    searchWindow: {
      start: "1993-01-20",
      end: "1995-12-31",
      note: "Pre-inaugural and pre-administration Clinton Public Papers hits are retained only in raw hit counts, not in the selected chronological inventory."
    },
    searchTerms: TERM_PATTERNS.map(([label]) => label),
    summary: {
      scannedPackages: PACKAGES.length,
      scannedGranules,
      rawHits: rawHits.length,
      inDateHits: inDateHits.length,
      selectedRecords: selectedRecords.length,
      selectedPages,
      excludedRecords: excludedRecords.length,
      selectedByYear: summarizeByYear(selectedRecords),
      pageCountBasis:
        "GovInfo Public Papers source pagination from each granule's [Page] or [Pages] header; these counts match the cached GovInfo granule PDFs checked during development."
    },
    selectedRecords,
    excludedRecords: excludedRecords.map((record) => ({
      id: record.id,
      date: record.date,
      sortDate: record.sortDate,
      title: record.title,
      pkg: record.pkg,
      granule: record.granule,
      matchedTerms: record.matchedTerms,
      exclusionReason: record.exclusionReason,
      url: record.url
    })),
    rawHits: rawHits.map((record) => ({
      id: record.id,
      date: record.date,
      sortDate: record.sortDate,
      title: record.title,
      pkg: record.pkg,
      granule: record.granule,
      sourcePdfPages: record.sourcePdfPages,
      pageCount: record.pageCount,
      matchedTerms: record.matchedTerms,
      url: record.url
    }))
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main();
