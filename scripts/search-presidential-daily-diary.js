#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");
const REPORT_PATH = path.join(ROOT, "reports", "presidential-daily-diary-search.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-pdd-ocr");
const CATALOG_PROXY = "https://catalog.archives.gov/proxy/records/search";
const CASE_NUMBER = "2010-0083-F";
const CATALOG_SEARCH_URL = `https://catalog.archives.gov/search?q=%22${CASE_NUMBER}%22&collectionIdentifier=WJC*`;
const CATALOG_API_URL = `${CATALOG_PROXY}?q=%22${CASE_NUMBER}%22&collectionIdentifier=WJC*&limit=100&page=1`;
const VOLUME_YEARS = new Set(["1993", "1994", "1995"]);

const MONTHS = {
  JANUARY: "01",
  FEBRUARY: "02",
  MARCH: "03",
  APRIL: "04",
  MAY: "05",
  JUNE: "06",
  JULY: "07",
  AUGUST: "08",
  SEPTEMBER: "09",
  OCTOBER: "10",
  NOVEMBER: "11",
  DECEMBER: "12"
};

const DISPLAY_MONTHS = {
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

const TOPIC_TERMS = [
  ["Bosnia", /\bBosnia\b/i],
  ["Bosnian", /\bBosnian\b/i],
  ["Herzegovina", /\bHerzegovina\b/i],
  ["Izetbegovic", /\bIzetbegovic\b/i],
  ["Tudjman", /\bTudjman\b/i],
  ["Milosevic", /\bMilosevic\b|\bMilo.evi/i],
  ["Yugoslavia", /\bYugoslav(?:ia|)\b/i],
  ["Croatia", /\bCroatia\b|\bCroatian\b/i],
  ["Serbia", /\bSerbia\b|\bSerbian\b|\bSerb\b/i],
  ["Sarajevo", /\bSarajevo\b/i],
  ["Srebrenica", /\bSrebrenica\b/i],
  ["Balkan", /\bBalkan\b/i],
  ["Dayton", /\bDayton\b/i],
  ["UNPROFOR", /\bUNPROFOR\b/i],
  ["IFOR", /\bIFOR\b/i],
  ["NATO", /\bNATO\b/i]
];

const PEOPLE_TERMS = [
  ["Alija Izetbegovic", /\bIzetbegovic\b/i],
  ["Franjo Tudjman", /\bTudjman\b/i],
  ["Slobodan Milosevic", /\bMilosevic\b|\bMilo.evi/i],
  ["Jacques Chirac", /Jacques\s+R?\.?\s*Chirac|President\s+Chirac|\bChirac\b/i],
  ["Francois Mitterrand", /\bMitterrand\b/i],
  ["John Major", /John\s+Major|Prime Minister\s+Major|Major,\s+Prime Minister/i],
  ["Helmut Kohl", /Helmut\s+Kohl|Chancellor\s+Kohl|Kohl,\s+Chancellor/i],
  ["Boris Yeltsin", /\bYeltsin\b/i],
  ["Willy Claes", /Willy\s+Claes|\bClaes\b/i],
  ["Boutros Boutros-Ghali", /Boutros[-\s]Ghali|Boutros-Gahli/i],
  ["Manfred Woerner", /Manfred\s+Woerner|Woerner/i]
];

const FOREIGN_LEADER_CONTEXT = new Map([
  ["1993-02-10", new Set(["Boris Yeltsin", "John Major", "Helmut Kohl", "Boutros Boutros-Ghali"])],
  ["1994-02-09", new Set(["John Major", "Helmut Kohl"])],
  ["1994-03-01", new Set(["Alija Izetbegovic", "Franjo Tudjman"])],
  ["1995-04-04", new Set(["John Major"])],
  ["1995-05-26", new Set(["Jacques Chirac", "John Major"])],
  ["1995-07-04", new Set(["John Major"])],
  ["1995-08-07", new Set(["John Major", "Jacques Chirac", "Helmut Kohl"])],
  ["1995-09-19", new Set(["Willy Claes"])]
]);

const EVENT_RE = /\b(The President|President)\b.*\b(talked|telephoned|met|meeting|participated|briefing|received|hosted|placed|joined)\b|\b(talked|telephoned|met|meeting|participated|briefing)\b/i;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "FRUS-Balkans-PDD/1.0" } }, (response) => {
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

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function downloadFile(url, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
      resolve();
      return;
    }
    https
      .get(url, { headers: { "User-Agent": "FRUS-Balkans-PDD/1.0" } }, (response) => {
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

function titleDates(title = "") {
  return [...title.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{2})/g)].map((match) => {
    const year = `19${match[3]}`;
    return {
      sortDate: `${year}-${String(Number(match[1])).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}`,
      year
    };
  });
}

function parseDiaryDate(text = "") {
  const monthNames = Object.keys(MONTHS).join("|");
  const match = text.match(new RegExp(`(${monthNames})\\s+(\\d{1,2}),\\s+(199[345])`, "i"));
  if (!match) return null;
  return `${match[3]}-${MONTHS[match[1].toUpperCase()]}-${String(Number(match[2])).padStart(2, "0")}`;
}

function displayDate(sortDate = "") {
  const [year, month, day] = sortDate.split("-");
  if (!year || !month || !day) return sortDate;
  return `${DISPLAY_MONTHS[month]} ${Number(day)}, ${year}`;
}

function matchingLabels(defs, text) {
  return defs.filter(([, regex]) => regex.test(text)).map(([label]) => label);
}

function eventBlocks(text = "") {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const blocks = [];
  let current = [];
  const startRe = /^(\d{1,2}:\d{2}|\d{3,5}\s+\d{1,2}:\d{2}|\d{1,2}[;:#]\d{2})\b/i;
  for (const line of lines) {
    if (startRe.test(line) && current.length) {
      blocks.push(current.join(" "));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join(" "));
  return blocks.map((block) => block.replace(/\s+/g, " ").trim());
}

function isNoise(block) {
  return /Majority Leader|major radio|Dayton, Ohio|MCSI Technologies|Business CEO|News Conference|joined Prime Minister Major for dessert|went to the East Room/i.test(
    block
  );
}

function isNatoMeeting(block) {
  return /\bNATO\b|North Atlantic Treaty Organization|NATO officials|Woerner|Claes/i.test(block);
}

function relationForReference(reference) {
  if (reference.matchBasis.includes("explicit topic")) return "Explicit diary topic";
  if (reference.matchBasis.includes("known conversation date")) return "Known conversation/date corroboration";
  return "Contextual call/meeting lead";
}

function selectReference({ date, block, topicLabels, peopleLabels }) {
  if (!date || !EVENT_RE.test(block) || isNoise(block)) return null;
  const strongTopics = topicLabels.filter((label) => !["NATO", "Dayton"].includes(label));
  const matchedPeople = new Set(peopleLabels);
  const basis = [];

  if (strongTopics.length) basis.push("explicit topic");
  if (topicLabels.includes("NATO") && isNatoMeeting(block)) basis.push("NATO/alliance meeting");

  const contextual = FOREIGN_LEADER_CONTEXT.get(date);
  if (contextual) {
    for (const person of matchedPeople) {
      if (contextual.has(person)) basis.push("known conversation date");
    }
  }

  if (!basis.length) return null;
  return [...new Set(basis)];
}

function eventTitle(reference) {
  const people = reference.people.length ? reference.people.join("; ") : reference.matchedTerms.join("; ");
  return `Presidential Daily Diary reference: ${people}`;
}

function sourceNote(record) {
  return `Source: National Archives Catalog, William J. Clinton Presidential Library, Presidential Daily Diary hardcopy, FOIA case ${CASE_NUMBER}, NAID ${record.naId}, digital object ${record.objectId}, source image p. ${record.pageNumber}.`;
}

function asResearchLead(reference) {
  return {
    id: reference.id,
    title: eventTitle(reference),
    kind: "Presidential Daily Diary reference",
    documentScope: "Schedule/call reference",
    date: reference.date,
    sortDate: reference.sortDate,
    repository: "National Archives Catalog / William J. Clinton Presidential Library",
    collection: "Presidential Daily Diary hardcopy",
    identifier: `FOIA ${CASE_NUMBER}; NAID ${reference.naId}; object ${reference.objectId}`,
    sourceFamily: "presidential-daily-diary",
    sourceFamilyLabel: "Presidential Daily Diary search",
    itemUrl: reference.catalogUrl,
    pdfUrl: reference.objectUrl,
    originalFile: reference.objectFilename,
    pageCount: 1,
    pageCountStatus: "source image",
    confidence: reference.confidence,
    score: reference.confidence === "high" ? 97 : 88,
    matchedTerms: reference.matchedTerms,
    sourceNoteDraft: sourceNote(reference),
    compilerUse:
      "Use as a Presidential Daily Diary call/meeting reference to reconcile known memcons, telcons, and possible no-document or withheld-record events.",
    targets: [
      {
        type: "NARA Catalog",
        relationship: "presidential-daily-diary-reference",
        staff: "Presidential Daily Diary",
        folderTitle: reference.fileUnitTitle,
        rank: 0
      }
    ]
  };
}

function addSourceCard(data, report) {
  const card = {
    id: "presidential-daily-diary-search",
    title: "Presidential Daily Diary Search",
    identifier: `FOIA ${CASE_NUMBER}`,
    institution: "National Archives Catalog / William J. Clinton Presidential Library",
    type: "Schedule / Call Log",
    priority: "Core",
    description: `OCR-searched FOIA ${CASE_NUMBER}: ${report.summary.inPeriodFileUnits} in-period Presidential Daily Diary hardcopy file units totaling ${report.summary.ocrPages} source images; selected ${report.summary.selectedReferences} Balkans-relevant call/meeting references.`,
    compilerUse:
      "Use to reconcile presidential calls and meetings against memcons, telcons, schedules, and no-document or withheld-record checks. References do not recommend inclusion.",
    url: "reports/presidential-daily-diary-search.json",
    tags: ["Presidential Daily Diary", "Calls", "Meetings", "NARA Catalog", CASE_NUMBER]
  };
  const byId = new Map((data.sources || []).map((source) => [source.id, source]));
  byId.set(card.id, { ...(byId.get(card.id) || {}), ...card });
  data.sources = [...byId.values()];
}

async function ocrObject(object, naId, pageNumber) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const base = `${naId}-${String(pageNumber).padStart(3, "0")}`;
  const imagePath = path.join(CACHE_DIR, `${base}.jpg`);
  const textPath = path.join(CACHE_DIR, `${base}.txt`);
  if (!fs.existsSync(textPath) || fs.statSync(textPath).size === 0) {
    await downloadFile(object.objectUrl, imagePath);
    let text = "";
    try {
      text = execFileSync("tesseract", [imagePath, "stdout", "--psm", "6"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 60000
      });
    } catch {
      text = "";
    }
    fs.writeFileSync(textPath, text);
  }
  return fs.readFileSync(textPath, "utf8");
}

async function main() {
  const search = await fetchJson(CATALOG_API_URL);
  const fileUnits = search.body.hits.hits
    .map((hit) => hit._source.record)
    .map((record) => ({ ...record, titleDateList: titleDates(record.title) }))
    .filter((record) => record.titleDateList.some((date) => VOLUME_YEARS.has(date.year)))
    .sort((a, b) => a.titleDateList[0].sortDate.localeCompare(b.titleDateList[0].sortDate));

  const rawMatches = [];
  const references = [];
  let ocrPages = 0;

  for (const fileUnit of fileUnits) {
    const detail = await fetchJson(`${CATALOG_PROXY}?naId=${fileUnit.naId}`);
    const record = detail.body.hits.hits[0]._source.record;
    const objects = record.digitalObjects || [];
    console.log(`Scanning Presidential Daily Diary NAID ${record.naId}: ${objects.length} source images.`);

    for (let index = 0; index < objects.length; index += 1) {
      const object = objects[index];
      const pageNumber = index + 1;
      const text = await ocrObject(object, record.naId, pageNumber);
      ocrPages += 1;
      const date = parseDiaryDate(text);
      if (!date) continue;

      for (const block of eventBlocks(text)) {
        const topicLabels = matchingLabels(TOPIC_TERMS, block);
        const peopleLabels = matchingLabels(PEOPLE_TERMS, block);
        if (!topicLabels.length && !peopleLabels.length) continue;

        rawMatches.push({
          naId: record.naId,
          pageNumber,
          objectId: object.objectId,
          objectUrl: object.objectUrl,
          objectFilename: object.objectFilename,
          date: displayDate(date),
          sortDate: date,
          matchedTerms: [...new Set([...topicLabels, ...peopleLabels])],
          snippet: block.slice(0, 900),
          fileUnitTitle: record.title
        });

        const matchBasis = selectReference({ date, block, topicLabels, peopleLabels });
        if (!matchBasis) continue;
        const matchedTerms = [...new Set([...topicLabels, ...peopleLabels])];
        const reference = {
          id: `pdd-${date}-${record.naId}-${object.objectId}-${references.length + 1}`,
          naId: record.naId,
          pageNumber,
          objectId: object.objectId,
          objectUrl: object.objectUrl,
          objectFilename: object.objectFilename,
          catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
          date: displayDate(date),
          sortDate: date,
          fileUnitTitle: record.title,
          matchedTerms,
          people: peopleLabels,
          topics: topicLabels,
          confidence: matchBasis.includes("explicit topic") || matchBasis.includes("NATO/alliance meeting") ? "high" : "medium",
          matchBasis,
          relationship: relationForReference({ matchBasis }),
          snippet: block.slice(0, 900)
        };
        reference.sourceNoteDraft = sourceNote(reference);
        references.push(reference);
      }
    }
  }

  const uniqueReferences = [...new Map(references.map((reference) => [reference.snippet + reference.sortDate, reference])).values()].sort(
    (a, b) => a.sortDate.localeCompare(b.sortDate) || a.pageNumber - b.pageNumber || a.snippet.localeCompare(b.snippet)
  );

  const report = {
    generatedAt: new Date().toISOString(),
    sourceUrl: CATALOG_SEARCH_URL,
    apiUrl: CATALOG_API_URL,
    missionBoundary:
      "This report identifies Presidential Daily Diary call and meeting references for compiler reconciliation. It does not recommend document inclusion and does not infer topic when the diary entry does not state one.",
    query: {
      caseNumber: CASE_NUMBER,
      collectionIdentifier: "WJC*",
      years: [1993, 1994, 1995]
    },
    summary: {
      catalogSearchHits: search.body.hits.total.value,
      inPeriodFileUnits: fileUnits.length,
      ocrPages,
      rawEventMatches: rawMatches.length,
      selectedReferences: uniqueReferences.length,
      highConfidenceReferences: uniqueReferences.filter((reference) => reference.confidence === "high").length,
      mediumConfidenceReferences: uniqueReferences.filter((reference) => reference.confidence === "medium").length
    },
    fileUnits: fileUnits.map((record) => ({
      naId: record.naId,
      title: record.title,
      catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
      titleDates: record.titleDateList.map((date) => date.sortDate)
    })),
    selectedReferences: uniqueReferences,
    researchLeads: uniqueReferences.map(asResearchLead),
    rawMatches
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  addSourceCard(data, report);
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)} with ${uniqueReferences.length} selected references.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
