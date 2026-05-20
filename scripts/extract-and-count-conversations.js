#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");
const REPORT_PATH = path.join(ROOT, "reports", "conversation-page-counts.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-93-95-conversation-pdfs");

const PACKETS = {
  bosnia20110964: {
    identifier: "2011-0964-M",
    collection: "Declassified Documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/36589",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/1e07f85597e7a0a171bbd0b1ad67cdf1.pdf",
    cacheName: "2011-0964-M-bosnia.pdf"
  },
  allied20130517: {
    identifier: "2013-0517-M",
    collection: "Declassified documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/101088",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/9a9ec5fd06f06d2069a286cf7c02fc03.pdf",
    cacheName: "2013-0517-M-allied-leaders.pdf"
  },
  yeltsin20140948: {
    identifier: "2014-0948-M / NAID 163545436",
    collection: "National Archives Catalog / Clinton NSC Records Management Office",
    itemUrl: "https://catalog.archives.gov/id/163545436",
    sourcePdfUrl: "https://s3.amazonaws.com/NARAprodstorage/lz/presidential-libraries/clinton/wjc-nscrm/7585721/7-YeltsinHydePark.pdf",
    cacheName: "2014-0948-M-yeltsin-hyde-park.pdf"
  }
};

const PACKET_EXTRACTS = [
  {
    id: "gore-izetbegovic-1993-03-26",
    packet: "bosnia20110964",
    pages: "3-7",
    date: "Mar 26, 1993",
    sortDate: "1993-03-26",
    kind: "Memcon",
    title: "Memorandum of Conversation - Vice President Gore and President Alija Izetbegovic",
    counterpart: "Al Gore; Alija Izetbegovic",
    subjects: ["Vance-Owen", "Bosnia and Herzegovina", "Bosnian Croat relations", "Eastern Bosnia"],
    compilerUse:
      "Vice-presidential conversation lead for the opening review, Vance-Owen implementation, and early safe-area concerns.",
    tags: ["Izetbegovic", "Gore", "Vance-Owen"],
    out: "documents/bosnia/1993-03-26-gore-izetbegovic-memcon.pdf"
  },
  {
    id: "izetbegovic-1993-09-08",
    packet: "bosnia20110964",
    pages: "10-15",
    date: "Sep 8, 1993",
    sortDate: "1993-09-08",
    kind: "Memcon",
    title: "Memorandum of Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Bosnia and Herzegovina", "Safe areas", "Negotiations", "Refugees"],
    compilerUse:
      "Presidential meeting lead for the 1993 Bosnia review after Vance-Owen and before the 1994 federation track.",
    tags: ["Izetbegovic", "Presidential diplomacy", "1993"]
  },
  {
    id: "izetbegovic-1994-09-25",
    packet: "bosnia20110964",
    pages: "18-25",
    date: "Sep 25, 1994",
    sortDate: "1994-09-25",
    kind: "Memcon",
    title: "Memorandum of Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Bosnia and Herzegovina", "Contact Group", "Federation", "Sanctions"],
    compilerUse:
      "Mid-1994 presidential meeting lead for Contact Group diplomacy and the Bosnian government's posture before Bihac.",
    tags: ["Izetbegovic", "Contact Group", "Federation"]
  },
  {
    id: "izetbegovic-tudjman-1994-12-05",
    packet: "bosnia20110964",
    pages: "27-29",
    date: "Dec 5, 1994",
    sortDate: "1994-12-05",
    kind: "Memcon",
    title: "Memorandum of Conversation - Presidents Izetbegovic and Tudjman",
    counterpart: "Alija Izetbegovic; Franjo Tudjman",
    subjects: ["Bosnia and Herzegovina", "Croatia", "Bihac", "Federation"],
    compilerUse:
      "Regional presidential meeting for the late-1994 Bihac crisis and the Bosniak-Croat federation relationship.",
    tags: ["Izetbegovic", "Tudjman", "Bihac", "Croatia"]
  },
  {
    id: "izetbegovic-1995-07-20",
    packet: "bosnia20110964",
    pages: "32-34",
    date: "Jul 20, 1995",
    sortDate: "1995-07-20",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Srebrenica", "Bosnia and Herzegovina", "Air strikes", "London meeting"],
    compilerUse:
      "Direct post-Srebrenica presidential call with the Bosnian president on air power and allied diplomacy.",
    tags: ["Izetbegovic", "Srebrenica", "Air power", "Telcon"]
  },
  {
    id: "izetbegovic-tudjman-1995-10-24",
    packet: "bosnia20110964",
    pages: "37-43",
    date: "Oct 24, 1995",
    sortDate: "1995-10-24",
    kind: "Memcon",
    title: "Memorandum of Conversation - Presidents Izetbegovic and Tudjman",
    counterpart: "Alija Izetbegovic; Franjo Tudjman",
    subjects: ["Dayton preparations", "Bosnia and Herzegovina", "Croatia", "Yeltsin"],
    compilerUse:
      "Pre-Dayton meeting that links Bosnian-Croatian coordination to Clinton's Hyde Park discussion with Yeltsin.",
    tags: ["Izetbegovic", "Tudjman", "Dayton", "Russia"]
  },
  {
    id: "quadrilateral-1995-12-14",
    packet: "bosnia20110964",
    pages: "47-50",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Quadrilateral Meeting with Tudjman, Izetbegovic, and Milosevic",
    counterpart: "Franjo Tudjman; Alija Izetbegovic; Slobodan Milosevic",
    subjects: ["Paris signing", "Dayton implementation", "IFOR", "Eastern Slavonia"],
    compilerUse:
      "Signing-day quadrilateral memcon for Dayton implementation, IFOR, Eastern Slavonia, and regional assurances.",
    tags: ["Paris signing", "Dayton", "Izetbegovic", "Milosevic", "Tudjman"]
  },
  {
    id: "tudjman-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "52-53",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Franjo Tudjman",
    counterpart: "Franjo Tudjman",
    subjects: ["Eastern Slavonia", "Dayton implementation", "Croatia", "War crimes"],
    compilerUse:
      "Signing-day Croatia pull-aside for Eastern Slavonia and implementation issues adjacent to the Bosnia settlement.",
    tags: ["Tudjman", "Croatia", "Paris signing", "Pull-aside"]
  },
  {
    id: "izetbegovic-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "55-57",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Paris signing", "Dayton implementation", "IFOR", "Sarajevo"],
    compilerUse:
      "Signing-day Bosnian pull-aside on IFOR safety, Sarajevo, federation politics, and implementation risks.",
    tags: ["Izetbegovic", "Paris signing", "Dayton", "Pull-aside"]
  },
  {
    id: "milosevic-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "59-61",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Slobodan Milosevic",
    counterpart: "Slobodan Milosevic",
    subjects: ["Paris signing", "Dayton implementation", "Sarajevo", "Federal Republic of Yugoslavia"],
    compilerUse:
      "Signing-day Milosevic pull-aside for implementation discipline, Sarajevo, and post-Dayton normalization pressure.",
    tags: ["Milosevic", "Paris signing", "Dayton", "Pull-aside"]
  },
  {
    id: "christopher-de-charette-1995-07-19",
    packet: "allied20130517",
    pages: "2-4",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Secretary Christopher and Foreign Minister de Charette",
    counterpart: "Herve de Charette",
    subjects: ["Bosnia", "Gorazde", "London meeting", "France"],
    compilerUse:
      "Secretary-level French telcon for the London meeting and allied negotiation over Gorazde after Srebrenica.",
    tags: ["Christopher", "de Charette", "France", "London meeting"]
  },
  {
    id: "kohl-1995-07-13",
    packet: "allied20130517",
    pages: "35-37",
    date: "Jul 13, 1995",
    sortDate: "1995-07-13",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Chancellor Helmut Kohl of Germany",
    counterpart: "Helmut Kohl",
    subjects: ["Srebrenica", "UNPROFOR", "Bosnia", "Chirac"],
    compilerUse:
      "Post-Srebrenica allied telcon with Kohl on UNPROFOR, Chirac's proposal, and German support.",
    tags: ["Germany", "Kohl", "Srebrenica", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-13",
    packet: "allied20130517",
    pages: "51-55",
    date: "Jul 13, 1995",
    sortDate: "1995-07-13",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Srebrenica", "UNPROFOR", "Bosnia", "Ground forces"],
    compilerUse:
      "Immediate Srebrenica crisis telcon with Chirac on ground-force options, UNPROFOR, and the arms embargo.",
    tags: ["France", "Chirac", "Srebrenica", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-19",
    packet: "allied20130517",
    pages: "66-71",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Gorazde", "Air strikes", "Bosnia", "London meeting"],
    compilerUse:
      "Allied telcon on the eve of the London meeting, warning options, air power, and French ground-force concerns.",
    tags: ["France", "Chirac", "Gorazde", "Air power"]
  },
  {
    id: "major-1995-07-19",
    packet: "allied20130517",
    pages: "76-83",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Prime Minister John Major of the United Kingdom",
    counterpart: "John Major",
    subjects: ["Gorazde", "UNPROFOR", "Bosnia", "Chirac"],
    compilerUse:
      "British telcon aligning positions after Clinton's Chirac call and before the London meeting.",
    tags: ["United Kingdom", "Major", "London meeting", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-20",
    packet: "allied20130517",
    pages: "93-95",
    date: "Jul 20, 1995",
    sortDate: "1995-07-20",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Gorazde", "Air strikes", "Bosnia", "London meeting"],
    compilerUse:
      "Follow-up Chirac telcon during the London meeting window on red lines, airstrikes, and Islamic-world reaction.",
    tags: ["France", "Chirac", "London meeting", "Air power"]
  },
  {
    id: "yeltsin-1995-10-23-hyde-park-one-on-one",
    packet: "yeltsin20140948",
    pages: "5-16",
    date: "Oct 23, 1995",
    sortDate: "1995-10-23",
    kind: "Memcon",
    title: "Memorandum of Conversation - Clinton-Yeltsin One-on-One at Hyde Park",
    counterpart: "Boris Yeltsin",
    subjects: ["Bosnia implementation force", "Russia-NATO", "IFOR", "CFE", "Hyde Park"],
    compilerUse:
      "Extracted one-on-one memcon for Russian participation in post-Dayton peace implementation and NATO command arrangements.",
    tags: ["Russia", "Yeltsin", "Hyde Park", "IFOR", "NAID 163545436"],
    markerPage: "1"
  },
  {
    id: "yeltsin-1995-10-23-hyde-park-lunch",
    packet: "yeltsin20140948",
    pages: "31-35",
    date: "Oct 23, 1995",
    sortDate: "1995-10-23",
    kind: "Memcon",
    title: "Memorandum of Conversation - Lunch with President Boris Yeltsin",
    counterpart: "Boris Yeltsin",
    subjects: ["Bosnia implementation force", "Russia-NATO", "IFOR", "Hyde Park"],
    compilerUse:
      "Extracted Hyde Park lunch memcon continuing the Bosnia implementation discussion after the one-on-one.",
    tags: ["Russia", "Yeltsin", "Hyde Park", "IFOR", "NAID 163545436"],
    markerPage: "18"
  }
];

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function expandRelativeOut(record) {
  return record.out || `documents/extracted/${record.sortDate}-${slug(record.id)}.pdf`;
}

function request(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Balkans-93-95 FRUS compiler page builder" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          const next = new URL(response.headers.location, url).toString();
          response.resume();
          request(next).then(resolve, reject);
          return;
        }
        resolve(response);
      })
      .on("error", reject);
  });
}

async function fetchText(url) {
  const response = await request(url);
  const chunks = [];
  for await (const chunk of response) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (response.statusCode !== 200) throw new Error(`HTTP ${response.statusCode} for ${url}`);
  if (/Cloudflare|Attention Required|Sorry, you have been blocked/i.test(text)) {
    throw new Error(`Blocked while fetching ${url}`);
  }
  return text;
}

async function download(url, targetPath) {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) return;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const response = await request(url);
  if (response.statusCode !== 200) throw new Error(`HTTP ${response.statusCode} for ${url}`);

  const file = fs.createWriteStream(targetPath);
  await new Promise((resolve, reject) => {
    response.pipe(file);
    response.on("error", reject);
    file.on("finish", resolve);
    file.on("error", reject);
  });
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, "-")
    .replace(/&nbsp;/g, " ");
}

function extractItemPdfUrl(html) {
  const fileMatch = html.match(/viewer\.html\?file=([^"']+?\.pdf)/i);
  if (fileMatch) return decodeURIComponent(fileMatch[1]);
  const directMatch = html.match(/https:\/\/clinton\.presidentiallibraries\.us\/files\/original\/[^"']+?\.pdf/i);
  return directMatch ? decodeHtml(directMatch[0]) : "";
}

function pageCount(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Could not find Pages in pdfinfo output for ${pdfPath}`);
  return Number(match[1]);
}

function extractPages(sourcePath, pages, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const pageArgs = String(pages)
    .split(",")
    .map((pageSpec) => pageSpec.trim())
    .filter(Boolean)
    .flatMap((pageSpec) => [sourcePath, pageSpec]);
  const args = ["--warning-exit-0", "--empty", "--pages", ...pageArgs, "--", outPath];
  const result = spawnSync("qpdf", args, { encoding: "utf8" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`qpdf failed for ${outPath}`);
  }
}

function asReportRecord(record) {
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    pageCount: record.pageCount,
    pdfUrl: record.pdfUrl,
    sourcePdfPages: record.sourcePdfPages || null,
    extractionStatus: record.extractionStatus || null
  };
}

function sourcePdfFor(packet) {
  return path.join(CACHE_DIR, packet.cacheName);
}

async function enrichDirectItem(record) {
  const html = await fetchText(record.url);
  const pdfUrl = extractItemPdfUrl(html);
  if (!pdfUrl) throw new Error(`Could not find PDF URL for ${record.id}: ${record.url}`);

  const pdfPath = path.join(CACHE_DIR, `${record.id}.pdf`);
  await download(pdfUrl, pdfPath);
  const pages = pageCount(pdfPath);
  return {
    ...record,
    pdfUrl,
    pageCount: pages,
    sourcePdfPages: `1-${pages}`,
    extractionStatus: "Item page exposes a single declassified memcon/telcon PDF; pageCount is the full PDF.",
    sourceNote:
      record.sourceNote ||
      `Source: Clinton Digital Library item page ${record.url}; direct embedded PDF ${pdfUrl}.`
  };
}

async function buildExtract(record) {
  const packet = PACKETS[record.packet];
  const sourcePdfPath = sourcePdfFor(packet);
  await download(packet.sourcePdfUrl, sourcePdfPath);

  const relativeOut = expandRelativeOut(record);
  const outPath = path.join(ROOT, relativeOut);
  const qpdfPages = record.markerPage ? `${record.pages},${record.markerPage}` : record.pages;
  extractPages(sourcePdfPath, qpdfPages, outPath);
  const localPages = pageCount(outPath);
  const markerPages = record.markerPage ? 1 : 0;
  const pages = localPages - markerPages;

  return {
    id: record.id,
    date: record.date,
    sortDate: record.sortDate,
    kind: record.kind,
    title: record.title,
    counterpart: record.counterpart,
    identifier: packet.identifier,
    collection: packet.collection,
    subjects: record.subjects,
    compilerUse: record.compilerUse,
    url: packet.itemUrl,
    pdfUrl: relativeOut,
    sourcePdfUrl: packet.sourcePdfUrl,
    sourcePdfPages: record.pages,
    pageCount: pages,
    localPdfPageCount: localPages,
    extractionStatus: record.markerPage
      ? `Extracted source pages ${record.pages} as the actual conversation and appended source marker page ${record.markerPage} as provenance.`
      : `Extracted source pages ${record.pages} from the packet as the actual conversation document.`,
    sourceNote: `Source: ${packet.collection}, ${packet.identifier}, ${packet.itemUrl}. Extracted from packet PDF pages ${record.pages}.`,
    tags: record.tags
  };
}

function replacePacketLeads(conversations, extracts) {
  const removeIds = new Set([
    "izetbegovic-milosevic-packet",
    "allied-leaders-packet",
    "yeltsin-1995-10-23-hyde-park"
  ]);
  const byId = new Map(conversations.filter((record) => !removeIds.has(record.id)).map((record) => [record.id, record]));

  for (const record of extracts) byId.set(record.id, record);

  return [...byId.values()].sort((a, b) => {
    const dateCompare = (a.sortDate || "").localeCompare(b.sortDate || "");
    return dateCompare || a.title.localeCompare(b.title);
  });
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const direct = [];

  for (const record of data.conversations) {
    if (!["Memcon", "Telcon"].includes(record.kind)) continue;
    if (!/^https:\/\/clinton\.presidentiallibraries\.us\/items\/show\//.test(record.url || "")) continue;
    direct.push(await enrichDirectItem(record));
  }

  const extracted = [];
  for (const record of PACKET_EXTRACTS) extracted.push(await buildExtract(record));

  data.conversations = replacePacketLeads(
    data.conversations.map((record) => direct.find((item) => item.id === record.id) || record),
    extracted
  );

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const conversationRecords = data.conversations.filter((record) => ["Memcon", "Telcon"].includes(record.kind));
  const pageTotal = conversationRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const report = {
    generatedAt: new Date().toISOString(),
    directItemCount: direct.length,
    extractedDocumentCount: extracted.length,
    conversationRecordCount: conversationRecords.length,
    pageTotal,
    direct: direct.map(asReportRecord),
    extracted: extracted.map(asReportRecord)
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
