#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(ROOT, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function pageWord(count) {
  return Number(count) === 1 ? "page" : "pages";
}

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizedIdentifier(identifier = "") {
  return clean(identifier).replace(/\s+\/\s+/g, "; ");
}

function itemIdFromUrl(url = "") {
  const itemMatch = url.match(/\/items\/show\/([^/?#]+)/);
  if (itemMatch) return `item ${itemMatch[1]}`;
  const catalogMatch = url.match(/\/id\/([^/?#]+)/);
  if (catalogMatch) return `NAID ${catalogMatch[1]}`;
  return "";
}

function repositoryFor(record = {}) {
  const sourceUrl = `${record.url || ""} ${record.pdfUrl || ""} ${record.sourcePdfUrl || ""}`;
  if (record.documentScope === "Public statement" || /govinfo\.gov/i.test(sourceUrl)) {
    return "Government Publishing Office, GovInfo";
  }
  if (/catalog\.archives\.gov|NARAprodstorage/i.test(sourceUrl) || /National Archives/i.test(record.repository || "")) {
    return "National Archives and Records Administration, National Archives Catalog";
  }
  if (/foia\.state\.gov/i.test(sourceUrl) || /Department of State/i.test(record.repository || "")) {
    return "Department of State, FOIA Virtual Reading Room";
  }
  if (/clinton\.presidentiallibraries\.us/i.test(sourceUrl) || /Clinton/i.test(record.repository || "")) {
    return "William J. Clinton Presidential Library";
  }
  return record.repository || "Repository not yet verified";
}

function sourceStem(record = {}) {
  const repo = repositoryFor(record);
  const parts = [repo];

  if (repo === "William J. Clinton Presidential Library") {
    parts.push("Clinton Presidential Records");
  }

  const collection =
    repo === "National Archives and Records Administration, National Archives Catalog"
      ? clean(record.collection || "").replace(/^National Archives Catalog\s*\/\s*/i, "")
      : record.collection;
  if (collection) parts.push(collection);
  if (record.identifier) parts.push(normalizedIdentifier(record.identifier));

  const locator = itemIdFromUrl(record.url || record.pdfUrl || record.sourcePdfUrl || "");
  const joined = parts.join(", ");
  if (locator && !joined.includes(locator)) parts.push(locator);

  return parts.filter(Boolean).join(", ");
}

function oldClassification(record = {}) {
  const note = record.sourceNote || record.sourceNoteDraft || "";
  const match = note.match(/\b(Top Secret|Secret|Confidential|No classification marking)(?:; [^.]+)?\./i);
  return match ? clean(match[0]) : "";
}

function classificationSentence(record = {}) {
  if (record.documentScope === "Public statement") return "Public record.";
  if (record.classification && /not yet transcribed|verify/i.test(record.classification)) {
    return "Classification marking not yet transcribed.";
  }
  if (record.classification) return `${record.classification}.`;
  return oldClassification(record) || "Classification and handling markings not yet transcribed.";
}

function sourcePaginationSentence(record = {}) {
  const pages = record.pageCount ? `${record.pageCount} ${pageWord(record.pageCount)}` : "page count pending";

  if (record.documentScope === "Public statement") {
    return `Public Papers source pagination, pp. ${record.sourcePdfPages || "pending"}; ${pages}.`;
  }

  if (/^(documents\/|\.\/documents\/)/.test(record.pdfUrl || "")) {
    const annotation = record.annotationSheet ? " Source packet p. 1 is appended as an annotation sheet in the local review PDF." : "";
    return `Extracted from source packet PDF, pp. ${record.sourcePdfPages || record.pages || "pending"}; ${pages} counted.${annotation}`;
  }

  if (record.sourcePdfPages || record.pageCount) {
    return `Digital copy, source PDF pp. ${record.sourcePdfPages || `1-${record.pageCount}`}; ${pages}.`;
  }

  return "Digital locator recorded; source pagination pending.";
}

function chronologySourceNote(record = {}) {
  return `Source: ${sourceStem(record)}. ${classificationSentence(record)} ${sourcePaginationSentence(record)}`;
}

function researchFileSourceNote(file = {}) {
  const target = (file.targets && file.targets[0]) || {};
  const parts = [
    "William J. Clinton Presidential Library",
    "Clinton Presidential Records",
    target.staff || "research collection",
    "2013-0185-M",
    target.oaBox ? `OA/ID ${target.oaBox}` : "",
    target.folderTitle ? `folder "${target.folderTitle}"` : "",
    file.identifier ? `release/control ${file.identifier}` : "",
    file.itemUrl ? itemIdFromUrl(file.itemUrl) : ""
  ].filter(Boolean);
  const pages = file.pageCount ? `${file.pageCount} ${pageWord(file.pageCount)}` : "page count pending";
  return `Source: ${parts.join(", ")}. Digital release file; ${pages}. Classification, drafting/clearance, attachments, excisions, and folder/item boundary not yet verified.`;
}

function sourceCrosscheckNote(file = {}) {
  const parts = [
    "National Archives and Records Administration",
    "National Archives Catalog",
    file.sourceSeries || file.sourceFamilyLabel,
    file.identifier
  ].filter(Boolean);
  const locator = file.itemUrl ? itemIdFromUrl(file.itemUrl) : "";
  if (locator && !parts.join(", ").includes(locator)) parts.push(locator);
  const pages = file.pageCount ? `${file.pageCount} ${pageWord(file.pageCount)}` : "page count pending";
  return `Source: ${parts.join(", ")}. Digital source-family lead; ${pages}. Folder/case file, document date, classification, distribution, annotations, attachments, and excisions not yet verified.`;
}

function stateFoiaNote(file = {}) {
  const parts = [
    "Department of State",
    "FOIA Virtual Reading Room",
    file.caseNumber ? `case ${file.caseNumber}` : "",
    file.messageNumber ? `document ${file.messageNumber}` : file.identifier
  ].filter(Boolean);
  const pages = file.pageCount ? `${file.pageCount} ${pageWord(file.pageCount)}` : "page count pending";
  const cableLine = [file.classification, file.channel, file.from && file.to ? `${file.from} to ${file.to}` : "", file.date].filter(Boolean).join("; ");
  return `Source: ${parts.join(", ")}. ${cableLine || "Classification and transmission metadata not yet transcribed."}. Direct FOIA PDF; ${pages}. Cable number, TAGS/SUBJECT, drafting/clearance, addressees, attachments, distribution, and excisions not yet verified.`;
}

function findingAidNote(target = {}) {
  const parts = [
    "William J. Clinton Presidential Library",
    "Clinton Presidential Records",
    "National Security Council",
    "2013-0185-M",
    target.staffOrOffice || "folder list",
    target.oaBox ? `OA/ID ${target.oaBox}` : "",
    target.folderTitle ? `folder "${target.folderTitle}"` : "",
    target.findingAidPart && target.findingAidPage ? `finding aid ${target.findingAidPart}, p. ${target.findingAidPage}` : ""
  ].filter(Boolean);
  return `Source: ${parts.join(", ")}. Folder-level lead; exact title, withdrawal sheets, restriction/declassification markers, document dates, attachments, annotations, and item-level provenance require onsite verification.`;
}

function normalizeData() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  data.volume.sourceNoteStandard =
    "FRUS-style source notes follow Office of the Historian practice: repository and collection/file locator first; classification and handling markings next; then drafting/clearance, meeting/place, attachments, annotations, excisions, and related-document notes as verified from the record.";

  for (const record of data.documents || []) {
    record.sourceNote = chronologySourceNote(record);
  }
  const sourceNoteByDocumentId = new Map((data.documents || []).map((record) => [record.id, record.sourceNote]));
  for (const record of data.conversations || []) {
    record.sourceNote = sourceNoteByDocumentId.get(record.id) || chronologySourceNote(record);
  }

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);
  return data.documents?.length || 0;
}

function normalizeReports(data) {
  const touched = [];
  const sourceNoteById = new Map((data.documents || []).map((record) => [record.id, record.sourceNote]));

  const documentReportPath = "reports/document-page-counts.json";
  if (fs.existsSync(path.join(ROOT, documentReportPath))) {
    const report = readJson(documentReportPath);
    for (const record of [...(report.extracted || []), ...(report.directTalbott || [])]) {
      if (sourceNoteById.has(record.id)) record.sourceNote = sourceNoteById.get(record.id);
    }
    writeJson(documentReportPath, report);
    touched.push(documentReportPath);
  }

  const conversationReportPath = "reports/conversation-page-counts.json";
  if (fs.existsSync(path.join(ROOT, conversationReportPath))) {
    const report = readJson(conversationReportPath);
    for (const record of report.records || []) {
      if (sourceNoteById.has(record.id)) record.sourceNote = sourceNoteById.get(record.id);
    }
    writeJson(conversationReportPath, report);
    touched.push(conversationReportPath);
  }

  const publicPapersPath = "reports/public-papers-balkans-search.json";
  if (fs.existsSync(path.join(ROOT, publicPapersPath))) {
    const report = readJson(publicPapersPath);
    for (const record of report.selectedRecords || []) {
      if (sourceNoteById.has(record.id)) record.sourceNote = sourceNoteById.get(record.id);
    }
    writeJson(publicPapersPath, report);
    touched.push(publicPapersPath);
  }

  const researchPath = "reports/research-collection-search.json";
  if (fs.existsSync(path.join(ROOT, researchPath))) {
    const report = readJson(researchPath);
    for (const file of report.digitizedFiles || []) file.sourceNoteDraft = researchFileSourceNote(file);
    writeJson(researchPath, report);
    touched.push(researchPath);
  }

  const crossPath = "reports/source-crosscheck-potential-documents.json";
  if (fs.existsSync(path.join(ROOT, crossPath))) {
    const report = readJson(crossPath);
    for (const file of report.potentialDocuments || []) file.sourceNoteDraft = sourceCrosscheckNote(file);
    writeJson(crossPath, report);
    touched.push(crossPath);
  }

  const statePath = "reports/state-foia-balkans-search.json";
  if (fs.existsSync(path.join(ROOT, statePath))) {
    const report = readJson(statePath);
    for (const file of report.stateFoiaDocuments || []) file.sourceNoteDraft = stateFoiaNote(file);
    writeJson(statePath, report);
    touched.push(statePath);
  }

  const libraryPath = "reports/clinton-library-visit-plan.json";
  if (fs.existsSync(path.join(ROOT, libraryPath))) {
    const report = readJson(libraryPath);
    for (const target of report.pullTargets || []) target.sourceNoteLead = findingAidNote(target);
    for (const target of report.followOnTargets || []) target.sourceNoteLead = findingAidNote(target);
    report.sourceNoteStandard =
      "Folder leads follow FRUS source-note order where possible: repository, collection/control number, OA/ID locator, finding-aid part and page, then verified markings and item-level metadata after onsite review.";
    writeJson(libraryPath, report);
    touched.push(libraryPath);
  }

  return touched;
}

function main() {
  const documents = normalizeData();
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const reports = normalizeReports(data);
  console.log(`Normalized ${documents} chronology source notes and ${reports.length} report files.`);
}

main();
