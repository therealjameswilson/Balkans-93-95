#!/usr/bin/env node

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const execFile = promisify(childProcess.execFile);

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const BTF_REPORT_PATH = path.join(ROOT, "reports", "btf-marking-extraction.json");
const REPORT_PATH = path.join(ROOT, "reports", "extracted-marking-extraction.json");
const CACHE_DIR = path.join(ROOT, "tmp", "extracted-marking-cache");
const FORCE = process.env.EXTRACTED_MARKINGS_FORCE === "1";

const CLASSIFICATION_PATTERN =
  /\b(TOP\s+SECRET|SECRET|CONFIDENTIAL|UNCLASSIFIED|SENSITIVE|NOFORN|ORCON|NODIS|NODTS|EXDIS|WINTEL|CLASSIFIED\s+BY|DECLASSIFY\s+ON|DECL\s*[:.]?\s*OADR|DECLASSIFIED)\b/i;
const RELEASE_PATTERN = /\b(APPROVED\s+FOR\s+RELEASE|DECLASSIFIED|SANITIZED|RELEASED\s+IN\s+PART)\b/i;
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
  if (/\b(CLASSIFIED\s+BY|DECLASSIFY\s+ON|DECL\s*[:.]?\s*OADR|NOFORN|ORCON|NODIS|NODTS|EXDIS|WINTEL)\b/i.test(joined)) {
    return "medium";
  }
  if (releaseLines.length) return "release-stamp-only";
  return "none";
}

function parseMarkingText(text = "") {
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

  const classificationCandidates = [...new Set(classificationLines)].slice(0, 10);
  const releaseStampCandidates = [...new Set(releaseLines)].slice(0, 6);
  return {
    confidence: confidenceFor(classificationCandidates, releaseStampCandidates),
    level: classificationLevel(classificationCandidates),
    classificationCandidates,
    releaseStampCandidates,
    firstLines: lines.slice(0, 10).map((line) => snippet(line, 140))
  };
}

async function pdftotext(pdfPath) {
  try {
    const { stdout } = await execFile("pdftotext", ["-layout", "-f", "1", "-l", "1", pdfPath, "-"], {
      maxBuffer: 4 * 1024 * 1024
    });
    return stdout;
  } catch {
    return "";
  }
}

async function firstPagePng(pdfPath, prefix) {
  const existing = fs
    .readdirSync(path.dirname(prefix))
    .filter((file) => file.startsWith(path.basename(prefix)) && file.endsWith(".png"))
    .sort()[0];
  if (!FORCE && existing) return path.join(path.dirname(prefix), existing);
  await execFile("pdftoppm", ["-r", "200", "-f", "1", "-l", "1", "-png", pdfPath, prefix], {
    maxBuffer: 1024 * 1024
  });
  const generated = fs
    .readdirSync(path.dirname(prefix))
    .filter((file) => file.startsWith(path.basename(prefix)) && file.endsWith(".png"))
    .sort()[0];
  if (!generated) throw new Error(`pdftoppm did not create a PNG for ${pdfPath}`);
  return path.join(path.dirname(prefix), generated);
}

async function ocr(pdfPath, id) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const png = await firstPagePng(pdfPath, path.join(CACHE_DIR, `${id}-page`));
  const { stdout } = await execFile("tesseract", [png, "stdout", "--psm", "6"], {
    maxBuffer: 8 * 1024 * 1024
  });
  return stdout;
}

function sourceRecords() {
  const data = readJson(DATA_PATH);
  const btfIds = fs.existsSync(BTF_REPORT_PATH)
    ? new Set((readJson(BTF_REPORT_PATH).records || []).map((record) => record.id))
    : new Set();
  return (data.documents || [])
    .filter((record) => record.documentScope !== "Public statement")
    .filter((record) => /not yet transcribed/i.test(record.sourceNote || record.sourceNoteDraft || ""))
    .filter((record) => !btfIds.has(record.id))
    .filter((record) => /^documents\/extracted\//.test(record.pdfUrl || ""))
    .sort((a, b) => String(a.sortDate || "").localeCompare(String(b.sortDate || "")) || String(a.title || "").localeCompare(String(b.title || "")));
}

async function processRecord(record) {
  const pdfPath = path.join(ROOT, record.pdfUrl);
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
    pdfUrl: record.pdfUrl,
    sourcePdfUrl: record.sourcePdfUrl || "",
    ocrPage: 1,
    confidence: "error",
    level: "",
    classificationCandidates: [],
    releaseStampCandidates: [],
    firstLines: [],
    suggestedCompilerAction: "Open PDF and transcribe classification/handling markings manually."
  };

  try {
    const [textLayer, ocrText] = await Promise.all([pdftotext(pdfPath), ocr(pdfPath, record.id)]);
    const parsed = parseMarkingText(`${textLayer}\n${ocrText}`);
    Object.assign(result, parsed);
    result.suggestedCompilerAction =
      parsed.confidence === "high" || parsed.confidence === "medium"
        ? "Compare candidate against the extracted review PDF first page, then replace the generic placeholder in the FRUS-style source note."
        : "OCR/text extraction did not produce a reliable marking candidate; inspect the extracted review PDF manually.";
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

async function main() {
  const records = sourceRecords();
  const extracted = [];
  for (const [index, record] of records.entries()) {
    extracted.push(await processRecord(record));
    process.stderr.write(`Processed ${index + 1}/${records.length}\n`);
  }

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
      "First-page text-layer plus OCR audit of local extracted review PDFs. Candidates require human comparison against the PDF before final FRUS source-note text.",
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

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)} with ${records.length} extracted-PDF marking rows (${report.summary.withHighConfidenceMarking} high confidence).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
