#!/usr/bin/env node

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

const execFile = promisify(childProcess.execFile);

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const REPORT_PATH = path.join(ROOT, "reports", "btf-marking-extraction.json");
const CACHE_DIR = path.join(ROOT, "tmp", "btf-marking-cache");
const CONCURRENCY = Number(process.env.BTF_MARKINGS_CONCURRENCY || 3);
const LIMIT = Number(process.env.BTF_MARKINGS_LIMIT || 0);
const FORCE = process.env.BTF_MARKINGS_FORCE === "1";

const CLASSIFICATION_PATTERN =
  /\b(TOP\s+SECRET|SECRET|CONFIDENTIAL|UNCLASSIFIED|SENSITIVE|NOFORN|ORCON|NODIS|EXDIS|WINTEL|CLASSIFIED\s+BY|DECLASSIFY\s+ON|DECL\s*[:.]?\s*OADR|DECLASSIFIED)\b/i;
const RELEASE_PATTERN = /\b(APPROVED\s+FOR\s+RELEASE|HISTORICAL\s+COLLECTIONS|AR\s+70-14|DECLASSIFIED|SANITIZED|RELEASED\s+IN\s+PART)\b/i;
const LEVELS = [
  ["Top Secret", /\bTOP\s+SECRET\b/i],
  ["Secret", /\bSECRET\b/i],
  ["Confidential", /\bCONFIDENTIAL\b/i],
  ["Sensitive", /\bSENSITIVE\b/i],
  ["Unclassified", /\bUNCLASSIFIED\b/i]
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanLine(line = "") {
  return line
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function snippet(line = "", max = 180) {
  const cleaned = cleanLine(line);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}...`;
}

function classificationLevel(lines) {
  const text = lines.join(" ");
  const match = LEVELS.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : "";
}

function confidenceFor(classificationLines, releaseLines) {
  const joined = classificationLines.join(" ");
  if (/\b(TOP\s+SECRET|SECRET|CONFIDENTIAL|UNCLASSIFIED|SENSITIVE)\b/i.test(joined)) return "high";
  if (/\b(CLASSIFIED\s+BY|DECLASSIFY\s+ON|DECL\s*[:.]?\s*OADR|NOFORN|ORCON|NODIS|EXDIS|WINTEL)\b/i.test(joined)) {
    return "medium";
  }
  if (releaseLines.length) return "release-stamp-only";
  return "none";
}

function parseOcr(text = "") {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
  const classificationLines = [];
  const releaseLines = [];

  for (const line of lines) {
    if (CLASSIFICATION_PATTERN.test(line)) classificationLines.push(snippet(line));
    if (RELEASE_PATTERN.test(line)) releaseLines.push(snippet(line));
  }

  const uniqueClassification = [...new Set(classificationLines)].slice(0, 10);
  const uniqueRelease = [...new Set(releaseLines)].slice(0, 6);
  const level = classificationLevel(uniqueClassification);
  const confidence = confidenceFor(uniqueClassification, uniqueRelease);

  return {
    confidence,
    level,
    classificationCandidates: uniqueClassification,
    releaseStampCandidates: uniqueRelease,
    firstLines: lines.slice(0, 10).map((line) => snippet(line, 140))
  };
}

async function download(url, file) {
  if (!FORCE && fs.existsSync(file) && fs.statSync(file).size > 0) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed ${response.status} ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(file, buffer);
}

async function renderFirstPage(pdfPath, pngPrefix) {
  const pngPath = `${pngPrefix}-1.png`;
  if (!FORCE && fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) return pngPath;
  await execFile("pdftoppm", ["-r", "200", "-f", "1", "-l", "1", "-png", pdfPath, pngPrefix], {
    maxBuffer: 1024 * 1024
  });
  const generated = fs
    .readdirSync(path.dirname(pngPrefix))
    .filter((file) => file.startsWith(path.basename(pngPrefix)) && file.endsWith(".png"))
    .sort()[0];
  if (!generated) throw new Error(`pdftoppm did not create a PNG for ${pdfPath}`);
  return path.join(path.dirname(pngPrefix), generated);
}

async function ocrImage(pngPath) {
  const { stdout } = await execFile("tesseract", [pngPath, "stdout", "--psm", "6"], {
    maxBuffer: 8 * 1024 * 1024
  });
  return stdout;
}

async function processRecord(record, index, total) {
  const pdfPath = path.join(CACHE_DIR, `${record.id}.pdf`);
  const pngPrefix = path.join(CACHE_DIR, `${record.id}-page`);

  const result = {
    id: record.id,
    itemId: record.itemId || "",
    date: record.date,
    sortDate: record.sortDate,
    title: record.title,
    kind: record.kind,
    collection: record.collection,
    identifier: record.identifier,
    pageCount: record.pageCount,
    sourcePdfPages: record.sourcePdfPages,
    itemUrl: record.itemUrl || record.url,
    pdfUrl: record.sourcePdfUrl || record.pdfUrl,
    ocrPage: 1,
    confidence: "error",
    level: "",
    classificationCandidates: [],
    releaseStampCandidates: [],
    firstLines: [],
    suggestedCompilerAction: "Open PDF and transcribe classification/handling markings manually."
  };

  try {
    await download(result.pdfUrl, pdfPath);
    const pngPath = await renderFirstPage(pdfPath, pngPrefix);
    const text = await ocrImage(pngPath);
    const parsed = parseOcr(text);
    Object.assign(result, parsed);
    result.suggestedCompilerAction =
      parsed.confidence === "high" || parsed.confidence === "medium"
        ? "Compare OCR candidate against the PDF header/footer, then replace the generic placeholder in the FRUS-style source note."
        : "OCR did not produce a reliable marking candidate; inspect the PDF image manually before final source-note clearance.";
  } catch (error) {
    result.error = error.message;
  }

  if ((index + 1) % 20 === 0 || index + 1 === total) {
    process.stderr.write(`Processed ${index + 1}/${total}${os.EOL}`);
  }
  return result;
}

async function runPool(records) {
  const results = new Array(records.length);
  let next = 0;

  async function worker() {
    while (next < records.length) {
      const index = next;
      next += 1;
      results[index] = await processRecord(records[index], index, records.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, records.length) }, worker));
  return results;
}

async function main() {
  ensureDir(CACHE_DIR);
  const data = readJson(DATA_PATH);
  let records = (data.documents || []).filter((record) =>
    /CIA\/Balkan Task Force document harvest/i.test(record.sourceFamilyLabel || "")
  );
  records = records.filter((record) => /classification and handling markings not yet transcribed/i.test(record.sourceNote || ""));
  if (LIMIT > 0) records = records.slice(0, LIMIT);

  const extracted = await runPool(records);
  const byConfidence = extracted.reduce((acc, record) => {
    acc[record.confidence] = (acc[record.confidence] || 0) + 1;
    return acc;
  }, {});
  const byLevel = extracted.reduce((acc, record) => {
    const level = record.level || "No level candidate";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    method:
      "First-page OCR audit of CIA/Balkan Task Force PDFs using pdftoppm at 200 DPI and Tesseract psm 6. Candidates require human comparison against the PDF before final FRUS source-note text.",
    summary: {
      candidatesReviewed: records.length,
      withHighConfidenceMarking: byConfidence.high || 0,
      withMediumConfidenceMarking: byConfidence.medium || 0,
      releaseStampOnly: byConfidence["release-stamp-only"] || 0,
      noCandidate: byConfidence.none || 0,
      errors: byConfidence.error || 0,
      byConfidence,
      byLevel
    },
    records: extracted
  };

  writeJson(REPORT_PATH, report);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)} with ${records.length} BTF marking OCR rows (${report.summary.withHighConfidenceMarking} high confidence).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
