#!/usr/bin/env node

const SCOUT_APP_URL = "https://therealjameswilson.github.io/nara-scout/app.js";
const QUERY =
  "(Memorandum of Conversation OR Memorandum of Telephone Conversation OR memcon OR telcon) AND (Bosnia OR Yugoslavia OR Sarajevo OR Dayton OR Milosevic OR Izetbegovic OR Srebrenica OR Croatia OR Holbrooke)";
const START_DATE = "1993";
const END_DATE = "1995";
const PER_COLLECTION_LIMIT = 25;
const MAX_PARALLEL = 8;

const WITHDRAWAL_RE = /withdraw(al)?\s*(sheet|notice|card)|NA\s*Form\s*1402[13]/i;

function extractStringConstant(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*'([^']+)'`));
  if (!match) throw new Error(`Could not extract ${name}`);
  return match[1];
}

function extractArrayConstant(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*'([^']+)'\\.split\\(','\\)`));
  if (!match) throw new Error(`Could not extract ${name}`);
  return match[1].split(",");
}

function sanitizeQuery(q) {
  return q.replace(/["\u201C\u201D]/g, "").replace(/\s+/g, " ").trim();
}

function classify(rec) {
  const title = (rec.title || "").toString();
  const desc = (rec.scopeAndContentNote || "").toString();
  const online = Array.isArray(rec.digitalObjects) && rec.digitalObjects.length > 0;
  const restrictions = (rec.accessRestriction && rec.accessRestriction.specificAccessRestrictions) || [];
  const restrictionTypes = restrictions.map((r) => (r.restriction || "").toString().toUpperCase());
  const hasFoia = restrictionTypes.some((r) => /FOIA/.test(r));
  const hasPra = restrictionTypes.some((r) => /PRA|PRESIDENTIAL.RECORDS/.test(r));
  const looksWithdrawal = WITHDRAWAL_RE.test(title) || WITHDRAWAL_RE.test(desc);

  let cat;
  if (looksWithdrawal) cat = "withdrawal";
  else if (hasFoia || hasPra) cat = "withdrawal";
  else if (online) cat = "declassified";
  else if (!desc.trim() || desc.trim().length < 20) cat = "unprocessed";
  else cat = "other";

  return {
    cat,
    online,
    objectCount: Array.isArray(rec.digitalObjects) ? rec.digitalObjects.length : 0,
    level: rec.levelOfDescription || ""
  };
}

function getRecord(hit) {
  return (hit._source && (hit._source.record || hit._source)) || hit;
}

function getAncestors(rec) {
  return (rec.ancestors || []).map((ancestor) => ({
    naId: String(ancestor.naId || ""),
    title: ancestor.title || ancestor.collectionTitle || "",
    level: ancestor.levelOfDescription || ""
  }));
}

function findAncestor(rec, pattern) {
  return getAncestors(rec).find((ancestor) => pattern.test(ancestor.level) || pattern.test(ancestor.title));
}

function firstDigitalUrl(rec) {
  const obj = Array.isArray(rec.digitalObjects) ? rec.digitalObjects[0] : null;
  if (!obj) return "";
  return obj.objectUrl || obj.url || obj.thumbnailUrl || "";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 80)}`);
  if (/^\s*</.test(text)) throw new Error(`HTML response from ${url}`);
  return JSON.parse(text);
}

async function fetchOne({ proxyUrl, apiKey, naraPath, naid }) {
  const params = new URLSearchParams();
  params.append("q", sanitizeQuery(QUERY));
  params.append("ancestorNaId", naid);
  params.append("startDate", START_DATE);
  params.append("endDate", END_DATE);
  params.append("limit", String(PER_COLLECTION_LIMIT));

  const url = `${proxyUrl.replace(/\/+$/, "")}${naraPath}?${params.toString()}`;
  try {
    const json = await fetchJson(url, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json"
      }
    });
    const body = json.body || json;
    const hits = (body.hits && body.hits.hits) || [];
    const totalRaw = body.hits && body.hits.total;
    const total = (totalRaw && (totalRaw.value ?? totalRaw)) || 0;
    return { naid, hits, total };
  } catch (error) {
    return { naid, hits: [], total: 0, error: error.message };
  }
}

async function mapLimit(items, limit, worker) {
  const queue = [...items];
  const results = [];
  const workers = Array(Math.min(limit, queue.length))
    .fill(0)
    .map(async () => {
      while (queue.length) {
        const item = queue.shift();
        results.push(await worker(item));
      }
    });
  await Promise.all(workers);
  return results;
}

async function main() {
  const appSource = await (await fetch(SCOUT_APP_URL)).text();
  const proxyUrl = extractStringConstant(appSource, "PROXY_URL");
  const apiKey = extractStringConstant(appSource, "API_KEY");
  const naraPath = extractStringConstant(appSource, "NARA_PATH");
  const clintonCollections = extractArrayConstant(appSource, "DEFAULT_CLINTON_COLLECTIONS");

  const collectionResults = await mapLimit(clintonCollections, MAX_PARALLEL, (naid) =>
    fetchOne({ proxyUrl, apiKey, naraPath, naid })
  );

  const merged = new Map();
  for (const result of collectionResults) {
    for (const hit of result.hits) {
      const rec = getRecord(hit);
      const naId = String(rec.naId || "");
      if (naId && !merged.has(naId)) merged.set(naId, rec);
    }
  }

  const records = [...merged.values()]
    .map((rec) => {
      const info = classify(rec);
      const series = findAncestor(rec, /series/i) || {};
      const collection = findAncestor(rec, /collection/i) || {};
      return {
        naId: String(rec.naId || ""),
        title: rec.title || "",
        description: rec.scopeAndContentNote || "",
        startYear: rec.coverageStartDate && rec.coverageStartDate.year,
        endYear: rec.coverageEndDate && rec.coverageEndDate.year,
        level: rec.levelOfDescription || "",
        category: info.cat,
        digitalObjects: info.objectCount,
        catalogUrl: rec.naId ? `https://catalog.archives.gov/id/${rec.naId}` : "",
        digitalUrl: firstDigitalUrl(rec),
        collection: collection.title || "",
        series: series.title || "",
        ancestors: getAncestors(rec)
      };
    })
    .filter((rec) => rec.category === "declassified")
    .sort((a, b) => {
      const yearA = Number(a.startYear || a.endYear || 9999);
      const yearB = Number(b.startYear || b.endYear || 9999);
      return yearA - yearB || a.title.localeCompare(b.title);
    });

  const report = {
    generatedAt: new Date().toISOString(),
    tool: "NARA Scout",
    toolUrl: "https://therealjameswilson.github.io/nara-scout/",
    query: QUERY,
    sanitizedQuery: sanitizeQuery(QUERY),
    years: { from: START_DATE, to: END_DATE },
    scope: {
      name: "All Clinton administration collections",
      collectionCount: clintonCollections.length
    },
    collectionResults: collectionResults.map((result) => ({
      naid: result.naid,
      total: result.total,
      hits: result.hits.length,
      error: result.error || null
    })),
    uniqueRecords: merged.size,
    declassifiedRecords: records.length,
    records
  };

  const outIndex = process.argv.indexOf("--out");
  if (outIndex >= 0 && process.argv[outIndex + 1]) {
    const fs = require("node:fs");
    fs.writeFileSync(process.argv[outIndex + 1], `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
