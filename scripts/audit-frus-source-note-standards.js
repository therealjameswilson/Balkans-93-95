#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const REPORT_PATH = path.join(ROOT, "reports", "frus-source-note-standards-audit.json");

const OFFICIAL_STANDARD_BASIS = [
  {
    label: "About the Series: Editorial Methodology",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries",
    use: "The first footnote gives the document source, original classification, distribution, drafting information, background, and read-by evidence when known."
  },
  {
    label: "Volume XXXI Sources",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/sources",
    use: "The source essay organizes provenance by repository, record group or office file, lot file, Presidential Library collection, and source family."
  },
  {
    label: "Department of State memcon example",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/d72",
    use: "Published note gives Department of State file path, lot and folder, classification/handling, meeting place, drafting/clearance, and related-volume reference."
  },
  {
    label: "Presidential Library notes example",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/d73",
    use: "Published note gives Presidential Library collection and file path, classification status, drafting evidence, absence of a formal memcon, editorial transcription, and related-document references."
  },
  {
    label: "Read-status and copy-routing example",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/d78",
    use: "Published note adds copy-routing and stamped read-status information after source and classification."
  }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function noteFor(record = {}) {
  return normalize(record.sourceNote || record.sourceNoteDraft || "");
}

function sourceText(record = {}) {
  return [
    record.repository,
    record.collection,
    record.identifier,
    record.url,
    record.pdfUrl,
    record.sourcePdfUrl,
    record.sourceFamilyLabel,
    record.sourceSeries,
    record.documentScope
  ]
    .filter(Boolean)
    .join(" ");
}

function expectedRepository(record = {}) {
  const source = sourceText(record);
  if (record.documentScope === "Public statement" || /govinfo\.gov|Public Papers/i.test(source)) {
    return {
      label: "Government Publishing Office, GovInfo",
      pattern: /Government Publishing Office,\s*GovInfo/i
    };
  }
  if (/catalog\.archives\.gov|NARAprodstorage|National Archives/i.test(source)) {
    return {
      label: "National Archives and Records Administration, National Archives Catalog",
      pattern: /National Archives and Records Administration.*National Archives Catalog/i
    };
  }
  if (/foia\.state\.gov|FOIA Virtual Reading Room|Department of State/i.test(source)) {
    return {
      label: "Department of State, FOIA Virtual Reading Room",
      pattern: /Department of State.*FOIA Virtual Reading Room/i
    };
  }
  if (/clinton\.presidentiallibraries\.us|Clinton|Bosnian Declassified Records|201\d-\d{4}-[MF]/i.test(source)) {
    return {
      label: "William J. Clinton Presidential Library, Clinton Presidential Records",
      pattern: /William J\. Clinton Presidential Library.*Clinton Presidential Records/i
    };
  }
  return {
    label: "repository/source family",
    pattern: /Source:\s+[^.]+/i
  };
}

function hasControlLocator(record = {}, note = "") {
  const locatorPattern =
    /\b(?:OA\/ID|BTF item|item \d+|NAID \d+|case [A-Z0-9-]+|document [A-Z0-9-]+|PPP-\d{4}|Lot \d{2}D\d+|20\d{2}-\d{4}-[MF]|[A-Z]-\d{8,}|C\d{8}|FL-\d{4}-\d+)\b/i;
  if (locatorPattern.test(note)) return true;

  const identifier = normalize(record.identifier || "").replace(/\s+\/\s+/g, "; ");
  if (identifier && note.includes(identifier)) return true;

  return false;
}

function hasClassificationOrPublicStatus(record = {}, note = "") {
  if (record.documentScope === "Public statement") return /Public record\./i.test(note);
  return /(?:Top Secret|Secret|Confidential|Unclassified|No classification marking|Classification (?:and handling markings|marking) not yet transcribed|Classification and transmission metadata not yet transcribed|classification[^.]+not yet verified|Nodis|Exdis|Eyes Only|Sensitive)/i.test(
    note
  );
}

function hasPageAccounting(record = {}, note = "") {
  if (record.documentScope === "Public statement") {
    return /Public Papers source pagination,\s*pp\.\s*[^;]+;\s*\d+\s+pages?\./i.test(note);
  }
  if (/^(documents\/|\.\/documents\/)/.test(record.pdfUrl || "")) {
    return /Extracted from source packet PDF,\s*pp\.\s*[^;]+;\s*\d+\s+pages?\s+counted\./i.test(note);
  }
  return /Digital copy,\s*source PDF pp\.\s*[^;]+;\s*\d+\s+pages?\./i.test(note);
}

function hasSupplementalDetailOrQueue(record = {}, note = "") {
  if (record.documentScope === "Public statement") return true;
  return /(?:Drafted|cleared|Copied|Sent|received|distributed|notetaker|meeting took place|call took place|saw the|read the|stamped notation|attached|not attached|not found|not yet verified|not yet transcribed|editor transcribed|classification and handling markings)/i.test(
    note
  );
}

function auditRecord(record = {}, family = "chronology") {
  const note = noteFor(record);
  const expected = expectedRepository(record);
  const checks = {
    sourcePrefix: /^Source:\s+/i.test(note),
    noRawUrl: !/https?:\/\//i.test(note),
    repositoryPath: expected.pattern.test(note),
    collectionOrControlLocator: hasControlLocator(record, note),
    classificationOrPublicStatus: hasClassificationOrPublicStatus(record, note),
    pageAccounting: hasPageAccounting(record, note),
    annotationSheet: !record.annotationSheet || /annotation sheet/i.test(note),
    supplementalDetailOrQueue: hasSupplementalDetailOrQueue(record, note)
  };

  const pass =
    checks.sourcePrefix &&
    checks.noRawUrl &&
    checks.repositoryPath &&
    checks.collectionOrControlLocator &&
    checks.classificationOrPublicStatus &&
    checks.pageAccounting &&
    checks.annotationSheet &&
    checks.supplementalDetailOrQueue;

  return {
    id: record.id,
    family,
    title: record.title,
    date: record.date,
    sortDate: record.sortDate,
    expectedRepository: expected.label,
    checks,
    pass,
    openClassificationOrHandling: /not yet transcribed/i.test(note),
    sourceNote: note
  };
}

function count(records, predicate) {
  return records.filter(predicate).length;
}

function sample(records, limit = 25) {
  return records.slice(0, limit).map((record) => ({
    id: record.id,
    family: record.family,
    date: record.date || record.sortDate || "",
    title: record.title,
    failedChecks: Object.entries(record.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
  }));
}

function main() {
  const data = readJson(DATA_PATH);
  const chronology = (data.documents || []).map((record) => auditRecord(record, "chronology"));
  const conversations = (data.conversations || []).map((record) => auditRecord(record, "conversation-cross-reference"));
  const records = [...chronology, ...conversations];
  const failures = records.filter((record) => !record.pass);

  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This audit checks whether draft provenance notes follow published FRUS first-footnote order. It does not clear the notes for publication or decide which records belong in the volume.",
    publishedFrusOrder:
      "Repository and collection/file locator first; original classification and handling status next; then distribution, drafting/clearance, place/time, read-status, attachments, annotations, excisions, and related-document evidence as verified from the record. Digital page and extraction accounting are retained here as a compiler-review layer.",
    officialStandardBasis: OFFICIAL_STANDARD_BASIS,
    summary: {
      totalRecords: records.length,
      chronologyRecords: chronology.length,
      conversationCrossReferences: conversations.length,
      sourcePrefixPass: count(records, (record) => record.checks.sourcePrefix),
      noRawUrlPass: count(records, (record) => record.checks.noRawUrl),
      repositoryPathPass: count(records, (record) => record.checks.repositoryPath),
      collectionOrControlLocatorPass: count(records, (record) => record.checks.collectionOrControlLocator),
      classificationOrPublicStatusPass: count(records, (record) => record.checks.classificationOrPublicStatus),
      pageAccountingPass: count(records, (record) => record.checks.pageAccounting),
      annotationSheetPass: count(records, (record) => record.checks.annotationSheet),
      supplementalDetailOrQueuePass: count(records, (record) => record.checks.supplementalDetailOrQueue),
      publishedFrusOrderPass: count(records, (record) => record.pass),
      provenanceFailures: failures.length,
      classificationOrHandlingNotTranscribed: count(records, (record) => record.openClassificationOrHandling)
    },
    unresolvedRecords: {
      provenanceFailures: sample(failures, 100),
      classificationOrHandlingNotTranscribed: records
        .filter((record) => record.openClassificationOrHandling)
        .slice(0, 200)
        .map((record) => record.id)
    }
  };

  writeJson(REPORT_PATH, report);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)}: ${report.summary.publishedFrusOrderPass}/${report.summary.totalRecords} records pass, ${report.summary.provenanceFailures} provenance failures.`
  );
}

main();
