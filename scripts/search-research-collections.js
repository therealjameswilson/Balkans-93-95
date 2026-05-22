#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const DEFAULT_PLAN =
  "/Users/jameswilson/Downloads/FRUS Research Plan  The Balkans, 1993–1995 (Clinton Administration).md";
const DEFAULT_OUT = path.resolve(__dirname, "..", "reports", "research-collection-search.json");
const DEFAULT_PORT = 9225;
const CLINTON_BASE = "https://clinton.presidentiallibraries.us";
const PDF_CACHE = path.join("/private/tmp", "balkans-93-95-research-collection-pdfs");
const MAX_RESULTS_PER_QUERY = 40;
const MAX_TOPIC_RESULTS_PER_TARGET = 5;

const MONTHS = new Set(
  [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "jan",
    "feb",
    "mar",
    "apr",
    "jun",
    "jul",
    "aug",
    "sept",
    "sep",
    "oct",
    "nov",
    "dec"
  ]
);

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "file",
  "files",
  "fld",
  "flds",
  "folder",
  "folders",
  "loose",
  "general",
  "various",
  "not",
  "latest",
  "early",
  "late",
  "mid",
  "end"
]);

const REGION_RE =
  /\b(bosnia|bosnian|balkans?|yugoslav|yugoslavia|croatia|croatian|serbia|serbian|montenegro|macedonia|kosovo|gora[zž]de|bihac|biha[cć]|srebrenica|zepa|[zž]epa|sarajevo|dayton|ifor|unprofor|uncro|krajina|slavonia|milosevic|milo[sš]evi[cć]|izetbegovic|tudjman|holbrooke|contact group|safe areas?|air ?strikes?|arms embargo|vance[ -]?owen|pcdc|principals|deputies)\b/i;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanFolderTitle(title = "") {
  return title
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+\([^)]+\)$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTerms(value = "") {
  return normalize(value)
    .split(" ")
    .filter((term) => term.length > 2)
    .filter((term) => !STOP_WORDS.has(term))
    .filter((term) => !MONTHS.has(term));
}

function yearsInTitle(title = "") {
  const years = new Set((title.match(/\b(19|20)\d{2}\b/g) || []).map(Number));
  for (const match of title.matchAll(/\b\d{1,2}\/\d{1,2}\/(\d{2,4})\b/g)) {
    const raw = match[1];
    if (raw.length === 4) {
      years.add(Number(raw));
      continue;
    }
    const year = Number(raw);
    years.add(year >= 80 ? 1900 + year : 2000 + year);
  }
  return [...years];
}

function parsePlan(markdown) {
  const tiers = [];
  let currentTier = null;
  const targets = [];

  for (const line of markdown.split(/\r?\n/)) {
    const tierMatch = line.match(/^###\s+TIER\s+(\d+):\s+(.+)$/);
    if (tierMatch) {
      currentTier = {
        id: `tier-${tierMatch[1]}`,
        number: Number(tierMatch[1]),
        title: tierMatch[2].trim().replace(/\s+\(Ranks.+$/, "")
      };
      tiers.push(currentTier);
      continue;
    }

    const rowMatch = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*(?:\|\s*([^|]+?)\s*)?\|$/);
    if (!rowMatch) continue;
    const rank = Number(rowMatch[1]);
    if (!rank || rank > 200) continue;
    if (!currentTier) continue;

    const folderTitle = rowMatch[3].trim();
    targets.push({
      id: `rank-${String(rank).padStart(3, "0")}`,
      type: "ranked-folder",
      rank,
      tierId: currentTier.id,
      tier: currentTier.title,
      oaBox: rowMatch[2].trim(),
      folderTitle,
      cleanTitle: cleanFolderTitle(folderTitle),
      staff: rowMatch[4].trim(),
      rationale: (rowMatch[5] || "").trim()
    });
  }

  const supplemental = [];
  let inSupplemental = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^##\s+Cross-Cutting Subject Files/.test(line)) {
      inSupplemental = true;
      continue;
    }
    if (inSupplemental && /^##\s+/.test(line)) break;
    if (!inSupplemental || !line.startsWith("- **")) continue;
    const match = line.match(/^- \*\*([^*]+)\*\*\s+—\s+(.+)$/);
    if (!match) continue;
    const label = match[1].trim();
    const note = match[2].trim();
    const quoted = [...note.matchAll(/"([^"]+)"/g)].map((item) => item[1]);
    supplemental.push({
      id: `supplemental-${String(supplemental.length + 1).padStart(2, "0")}`,
      type: "supplemental-collection",
      label,
      folderTitle: quoted[0] || label,
      cleanTitle: cleanFolderTitle(quoted[0] || label),
      note,
      searchPhrases: quoted.length ? quoted : [label]
    });
  }

  return { tiers, targets, supplemental };
}

function queryVariants(target) {
  const values = new Set();
  const candidates = [target.cleanTitle, target.folderTitle, ...(target.searchPhrases || [])]
    .filter(Boolean)
    .map((value) => value.replace(/[“”]/g, '"').trim());

  for (const candidate of candidates) {
    const clean = cleanFolderTitle(candidate);
    if (clean) values.add(`"${clean}"`);
    const dashVariant = clean.replace(/[–—−]/g, "-");
    if (dashVariant && dashVariant !== clean) values.add(`"${dashVariant}"`);
    const slashDate = clean.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, "$1-$2-$3");
    if (slashDate && slashDate !== clean) values.add(`"${slashDate}"`);
  }

  const terms = significantTerms(target.cleanTitle || target.folderTitle);
  const shortOrGeneric = terms.length <= 1 && !REGION_RE.test(target.cleanTitle || target.folderTitle);
  if (!shortOrGeneric && terms.length > 1) {
    values.add(`"${terms.slice(0, 5).join(" ")}"`);
  }

  return [...values].slice(0, 3);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !this.pending.has(message.id)) return;
        const pending = this.pending.get(message.id);
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
      };
    });
  }

  call(method, params = {}, timeout = 25000) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function connectBrowser(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = targets.find((target) => target.type === "page" && target.url.startsWith(CLINTON_BASE));
  if (!page) throw new Error(`No Clinton Digital Library tab found on CDP port ${port}`);
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.call("Runtime.enable");
  return client;
}

async function browserFetch(client, url) {
  const expression = `(() => {
    const url = ${JSON.stringify(url)};
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      fetch(url, { signal: controller.signal })
        .then(async (response) => {
          const text = await response.text();
          resolve({ ok: response.ok, status: response.status, url: response.url, text });
        })
        .catch((error) => resolve({ ok: false, status: 0, url, error: String(error) }))
        .finally(() => clearTimeout(timer));
    });
  })()`;

  const result = await client.call(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    25000
  );
  return result.result.value;
}

function resultCount(html) {
  return (html.match(/class="result"/g) || []).length;
}

function parseResults(html) {
  const chunks = html.split(/<!-- Document\. -->/).slice(1);
  return chunks
    .map((chunk) => {
      const titleMatch = chunk.match(/<a href="([^"]+)" class="result-title">([\s\S]*?)<\/a>/);
      if (!titleMatch) return null;
      const pdfMatch = chunk.match(/<a href="(https:\/\/clinton\.presidentiallibraries\.us\/files\/original\/[^"]+\.pdf)"/);
      const altMatch = chunk.match(/<img[^>]+alt="([^"]*)"/);
      const typeMatch = chunk.match(/<span class="result-type">\(([^)]+)\)<\/span>/);
      return {
        title: decodeHtml(titleMatch[2].replace(/<[^>]+>/g, "").trim()),
        itemUrl: new URL(decodeHtml(titleMatch[1]), CLINTON_BASE).href,
        resultType: typeMatch ? decodeHtml(typeMatch[1]) : "",
        pdfUrl: pdfMatch ? decodeHtml(pdfMatch[1]) : "",
        originalFile: altMatch ? decodeHtml(altMatch[1]) : ""
      };
    })
    .filter(Boolean)
    .slice(0, MAX_RESULTS_PER_QUERY);
}

function scoreResult(target, result) {
  const targetTitle = normalize(target.cleanTitle || target.folderTitle);
  const rawTitle = normalize(target.folderTitle);
  const resultTitle = normalize(result.title);
  const allText = normalize([result.title, result.originalFile, result.pdfUrl].join(" "));
  const terms = significantTerms(target.cleanTitle || target.folderTitle);
  const matched = terms.filter((term) => allText.includes(term));
  const exactTitle = resultTitle === targetTitle || resultTitle === rawTitle;
  const containedTitle = targetTitle && (resultTitle.includes(targetTitle) || allText.includes(targetTitle));
  const targetHasRegion = REGION_RE.test(target.cleanTitle || target.folderTitle);
  const targetHasYear = /\b199[3-5]\b/.test(target.cleanTitle || target.folderTitle);
  const resultHasRegion = REGION_RE.test(result.title) || REGION_RE.test(result.originalFile);
  const years = yearsInTitle(result.title);
  const inVolumeYear = years.some((year) => year >= 1993 && year <= 1995);
  const outsideVolumeOnly = years.length > 0 && !inVolumeYear;
  const declassifiedRelease = /\/foia\/|\/Declassified\/|Bosnia-Declass|Croatia-Declass/i.test(
    result.originalFile + result.pdfUrl
  );
  const knownBalkansCollectionFile = /2008-0994-F|20080994F|2013-0687-F|20130687F/i.test(result.originalFile);

  let score = 0;
  if (result.pdfUrl) score += 20;
  if (exactTitle) score += 80;
  else if (targetTitle && resultTitle.includes(targetTitle)) score += 62;
  else if (targetTitle && allText.includes(targetTitle)) score += 54;
  else if (terms.length && matched.length === terms.length) score += 44;
  else if (matched.length >= Math.min(3, Math.max(2, terms.length))) score += 30;
  else score += matched.length * 6;

  if (/declassified|foia|2013-0185|bosnia-declass|croatia-declass/i.test(result.originalFile + result.pdfUrl)) score += 12;
  if (resultHasRegion) score += 8;
  if ((target.staff || "").split(/[\/, ]+/).some((name) => name.length > 4 && allText.includes(normalize(name)))) {
    score += 6;
  }

  const terseGeneric = terms.length <= 2 && !targetHasRegion && !targetHasYear;
  if (terseGeneric && !resultHasRegion && !(exactTitle && knownBalkansCollectionFile)) score -= 70;
  if (outsideVolumeOnly && !targetHasYear) score -= 65;
  if (!declassifiedRelease) score -= 35;

  let confidence = "low";
  if (score >= 92) confidence = "high";
  else if (score >= 72) confidence = "medium";

  let relationship = "topic-match";
  if (exactTitle || containedTitle) relationship = "exact-folder-title";
  else if (targetHasRegion && matched.length >= Math.min(3, terms.length)) relationship = "strong-subject-match";
  else if (resultHasRegion && matched.length) relationship = "regional-topic-match";

  return { score, confidence, relationship, declassifiedRelease, matchedTerms: matched, years };
}

function dedupeSelected(targets) {
  const files = new Map();

  for (const target of targets) {
    for (const hit of target.selected || []) {
      const key = hit.pdfUrl || hit.itemUrl;
      if (!key) continue;
      const existing = files.get(key);
      const ref = {
        id: target.id,
        type: target.type,
        rank: target.rank || null,
        tierId: target.tierId || null,
        tier: target.tier || "",
        oaBox: target.oaBox || "",
        folderTitle: target.folderTitle,
        staff: target.staff || "",
        score: hit.score,
        confidence: hit.confidence,
        relationship: hit.relationship
      };

      if (existing) {
        existing.targets.push(ref);
        if (hit.score > existing.score) {
          existing.score = hit.score;
          existing.confidence = hit.confidence;
          existing.bestTargetId = target.id;
        }
        continue;
      }

      files.set(key, {
        id: `research-file-${String(files.size + 1).padStart(3, "0")}`,
        title: hit.title,
        itemUrl: hit.itemUrl,
        pdfUrl: hit.pdfUrl,
        originalFile: hit.originalFile,
        resultType: hit.resultType,
        declassifiedRelease: hit.declassifiedRelease,
        score: hit.score,
        confidence: hit.confidence,
        bestTargetId: target.id,
        targets: [ref]
      });
    }
  }

  return [...files.values()].sort(
    (a, b) =>
      b.score - a.score ||
      ((a.targets[0] && a.targets[0].rank) || 9999) - ((b.targets[0] && b.targets[0].rank) || 9999) ||
      a.title.localeCompare(b.title)
  );
}

async function countPdfPages(file) {
  const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
  const match = info.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : null;
}

async function pageCountForPdf(url) {
  fs.mkdirSync(PDF_CACHE, { recursive: true });
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  const file = path.join(PDF_CACHE, `${hash}.pdf`);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} while downloading ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(file, buffer);
  }
  return countPdfPages(file);
}

function releaseControl(file) {
  const text = `${file.originalFile || ""} ${file.pdfUrl || ""}`;
  const pathMatch = text.match(/\/(20\d{2})-(\d{4})-([A-Z])(?:-[^/\s]+)?\//i);
  if (pathMatch) return `${pathMatch[1]}-${pathMatch[2]}-${pathMatch[3].toUpperCase()}`;
  const directMatch = text.match(/\b(20\d{2}-\d{4}-[A-Z])\b/i);
  return directMatch ? directMatch[1].toUpperCase() : "";
}

function sourceNoteDraft(file) {
  const first = file.targets[0] || {};
  const control = releaseControl(file);
  const locators = [
    "William J. Clinton Presidential Library, Clinton Digital Library",
    control ? `release/control ${control}` : "",
    "research-plan source: NSC European Affairs, Clinton Presidential Records, 2013-0185-M",
    first.oaBox ? `OA/box ${first.oaBox}` : "",
    first.folderTitle ? `folder target: ${first.folderTitle}` : "",
    file.itemUrl ? `item ${file.itemUrl.match(/\/items\/show\/([^/?#]+)/)?.[1] || ""}` : ""
  ].filter(Boolean);
  const pageClause = file.pageCount ? `Digitized PDF, ${file.pageCount} pages counted.` : "Digitized PDF; page count pending.";
  const original = file.originalFile ? ` Original file path/title supplied by the library: ${file.originalFile}.` : "";
  return `${locators.join(", ")}. ${pageClause}${original} Verify classification markings, drafting/clearance data, attachments, excisions, and whether the digitized file represents the whole archival folder or a released item within it.`;
}

async function main() {
  const planPath = argValue("--plan", DEFAULT_PLAN);
  const outPath = argValue("--out", DEFAULT_OUT);
  const port = Number(argValue("--port", DEFAULT_PORT));
  const noPages = process.argv.includes("--no-pages");
  const markdown = fs.readFileSync(planPath, "utf8");
  const parsed = parsePlan(markdown);
  const searchTargets = [...parsed.targets, ...parsed.supplemental];
  const client = await connectBrowser(port);

  try {
    let completed = 0;
    for (const target of searchTargets) {
      const queries = queryVariants(target);
      const allResults = [];
      const searches = [];
      for (const query of queries) {
        const url = `/solr-search?q=${encodeURIComponent(query)}`;
        const response = await browserFetch(client, url);
        const count = response.ok ? resultCount(response.text) : 0;
        const results = response.ok ? parseResults(response.text) : [];
        searches.push({ query, url: `${CLINTON_BASE}${url}`, ok: response.ok, status: response.status, count });
        allResults.push(...results.map((result) => ({ ...result, query })));
      }

      const scored = allResults
        .map((result) => ({ ...result, ...scoreResult(target, result) }))
        .filter((result) => result.pdfUrl)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

      const seen = new Set();
      target.searches = searches;
      target.hits = scored.filter((result) => {
        const key = result.pdfUrl || result.itemUrl;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const selected = target.hits.filter((result) => result.confidence !== "low");
      const exactMatches = selected.filter((result) => result.relationship === "exact-folder-title");
      const subjectMatches = selected.filter((result) => result.relationship !== "exact-folder-title");
      target.selected = [...exactMatches, ...subjectMatches.slice(0, MAX_TOPIC_RESULTS_PER_TARGET)];

      completed += 1;
      const label = target.rank ? `rank ${target.rank}` : target.id;
      process.stderr.write(
        `[${completed}/${searchTargets.length}] ${label}: ${target.folderTitle} -> ${target.selected.length} selected / ${target.hits.length} pdf hits\n`
      );
    }
  } finally {
    client.close();
  }

  const files = dedupeSelected(searchTargets);
  if (!noPages) {
    let counted = 0;
    for (const file of files) {
      try {
        file.pageCount = await pageCountForPdf(file.pdfUrl);
        file.pageCountStatus = "counted";
      } catch (error) {
        file.pageCount = null;
        file.pageCountStatus = error.message;
      }
      file.sourceNoteDraft = sourceNoteDraft(file);
      counted += 1;
      process.stderr.write(`[pdf ${counted}/${files.length}] ${file.pageCount || "?"} pp. ${file.title}\n`);
    }
  } else {
    for (const file of files) file.sourceNoteDraft = sourceNoteDraft(file);
  }

  const rankedTargets = parsed.targets.map((target) => ({
    id: target.id,
    type: target.type,
    rank: target.rank,
    tierId: target.tierId,
    tier: target.tier,
    oaBox: target.oaBox,
    folderTitle: target.folderTitle,
    cleanTitle: target.cleanTitle,
    staff: target.staff,
    rationale: target.rationale,
    searches: target.searches,
    pdfHitCount: target.hits.length,
    selectedFileCount: target.selected.length,
    selectedFileIds: target.selected
      .map((hit) => files.find((file) => file.pdfUrl === hit.pdfUrl)?.id)
      .filter(Boolean)
  }));

  const supplementalTargets = parsed.supplemental.map((target) => ({
    id: target.id,
    type: target.type,
    label: target.label,
    folderTitle: target.folderTitle,
    note: target.note,
    searches: target.searches,
    pdfHitCount: target.hits.length,
    selectedFileCount: target.selected.length,
    selectedFileIds: target.selected
      .map((hit) => files.find((file) => file.pdfUrl === hit.pdfUrl)?.id)
      .filter(Boolean)
  }));

  const summary = {
    rankedFolderTargets: rankedTargets.length,
    supplementalTargets: supplementalTargets.length,
    searchedTargets: searchTargets.length,
    rankedTargetsWithDigitizedFiles: rankedTargets.filter((target) => target.selectedFileCount).length,
    supplementalTargetsWithDigitizedFiles: supplementalTargets.filter((target) => target.selectedFileCount).length,
    uniqueDigitizedFiles: files.length,
    countedPages: files.reduce((sum, file) => sum + (file.pageCount || 0), 0),
    highConfidenceFiles: files.filter((file) => file.confidence === "high").length,
    mediumConfidenceFiles: files.filter((file) => file.confidence === "medium").length
  };

  const report = {
    generatedAt: new Date().toISOString(),
    sourcePlan: planPath,
    searchBase: CLINTON_BASE,
    cdpPort: port,
    collection: "NSC European Affairs, Clinton Presidential Records, 2013-0185-M",
    tiers: parsed.tiers,
    summary,
    rankedTargets,
    supplementalTargets,
    digitizedFiles: files
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
