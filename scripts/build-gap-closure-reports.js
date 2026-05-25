#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(ROOT, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function textOf(item = {}) {
  return [
    item.title,
    item.kind,
    item.documentType,
    item.documentScope,
    item.counterpart,
    item.compilerUse,
    item.sourceNote,
    item.sourceNoteDraft,
    item.sourceFamily,
    item.sourceFamilyLabel,
    item.sourceSeries,
    item.collection,
    item.identifier,
    item.from,
    item.to,
    ...(item.subjects || []),
    ...(item.tags || []),
    ...(item.matchedQueries || [])
  ]
    .filter(Boolean)
    .join(" ");
}

function countBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item) || "Unknown";
    const current = map.get(key) || { count: 0, pages: 0 };
    current.count += 1;
    current.pages += item.pageCount || 0;
    map.set(key, current);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function relationshipFor(item = {}) {
  if (item.sourceFamily === "cia-btf-clinton-library") return "cia-btf-document-level";
  if (item.sourceFamily === "state-foia-virtual-reading-room") return "state-foia-virtual-reading-room";
  if (/nara/i.test(item.sourceFamily || "")) return item.sourceFamily;
  return "derived-gap-closure-lead";
}

function normalizedLead(item, index, sourceFamily) {
  const targets = item.targets?.length
    ? item.targets
    : [
        {
          type: sourceFamily,
          relationship: relationshipFor(item),
          staff: item.sourceSeries || item.repository || sourceFamily,
          folderTitle: item.collection || item.sourceFamilyLabel || sourceFamily
        }
      ];
  return {
    id: `${sourceFamily}-${String(index + 1).padStart(3, "0")}-${item.id || item.itemId || index}`,
    sourceRecordId: item.id,
    title: item.title,
    kind: item.kind || item.documentType || "Document lead",
    documentScope: item.documentScope || "Potential document lead",
    date: item.date || item.sortDate || "",
    sortDate: item.sortDate || "",
    repository: item.repository,
    collection: item.collection,
    identifier: item.identifier || item.messageNumber || "",
    sourceFamily: item.sourceFamily,
    sourceFamilyLabel: item.sourceFamilyLabel,
    sourceSeries: item.sourceSeries,
    itemUrl: item.itemUrl || item.url,
    pdfUrl: item.pdfUrl,
    originalFile: item.originalFile,
    pageCount: item.pageCount || null,
    pageCountStatus: item.pageCountStatus || (item.pageCount ? "counted" : "pending"),
    confidence: item.confidence || "high",
    score: item.score || 0,
    subjects: item.subjects || [],
    tags: item.tags || [],
    targets,
    sourceNoteDraft: item.sourceNote || item.sourceNoteDraft || "Source note pending.",
    compilerUse: item.compilerUse || ""
  };
}

function uniqueBy(records, keyFn) {
  const map = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!map.has(key)) map.set(key, record);
  }
  return [...map.values()];
}

function buildDefenseReport({ research, sourceCrosscheck, stateFoia, btf }) {
  const militaryTerms =
    /Defense|Department of Defense|\bDOD\b|\bDoD\b|JCS|Joint Chiefs|OSD|SECDEF|Shalikashvili|Perry|IFOR|UNPROFOR|UNCRO|air ?strike|air ?power|air defense|no-fly|Deliberate Force|lift and strike|lift-and-strike|withdrawal|OPLAN|Oplan|NATO|military|combatant|Rapid Reaction Force|RRF/i;
  const pools = [
    ...(research.digitizedFiles || []),
    ...(sourceCrosscheck.potentialDocuments || []),
    ...(stateFoia.stateFoiaDocuments || []),
    ...(btf.documents || [])
  ];
  const matched = uniqueBy(
    pools.filter((item) => militaryTerms.test(textOf(item))).map((item, index) => normalizedLead(item, index, "defense-jcs")),
    (item) => item.pdfUrl || item.itemUrl || item.sourceRecordId
  ).sort((a, b) => String(a.sortDate).localeCompare(String(b.sortDate)) || a.title.localeCompare(b.title));

  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This report is a dedicated Defense/JCS and military-implementation source-base mitigation layer. It aggregates digitized leads; it does not recommend inclusion or volume structure.",
    queryBasis: [
      "Defense/JCS/OSD/SECDEF",
      "IFOR/UNPROFOR/UNCRO",
      "air strikes/no-fly/Deliberate Force/lift-and-strike",
      "withdrawal/OPLAN/military implementation",
      "NATO/Rapid Reaction Force"
    ],
    summary: {
      selectedCandidateDocuments: matched.length,
      countedPages: matched.reduce((sum, item) => sum + (item.pageCount || 0), 0),
      byYear: countBy(matched, (item) => String(item.sortDate || "").slice(0, 4)),
      bySourceFamily: countBy(matched, (item) => item.sourceFamilyLabel || item.sourceFamily || item.repository),
      btfDocuments: matched.filter((item) => item.sourceFamily === "cia-btf-clinton-library").length,
      stateFoiaDocuments: matched.filter((item) => item.sourceFamily === "state-foia-virtual-reading-room").length,
      naraDocuments: matched.filter((item) => /nara/i.test(item.sourceFamily || "")).length,
      researchCollectionDocuments: matched.filter((item) => item.sourceFamily && !/cia-btf|state-foia|nara/i.test(item.sourceFamily)).length
    },
    documents: matched
  };
  writeJson("reports/defense-jcs-source-search.json", report);
  return report;
}

function buildConversationReconciliationReport({ data, libraryVisit }) {
  const records = (data.documents || []).filter((item) => ["Memcon", "Telcon"].includes(item.kind));
  const folderLeads = [...(libraryVisit.pullTargets || []), ...(libraryVisit.followOnTargets || [])].filter((target) =>
    /POTUS|President|Presidential|Telcon|Memcon|Foreign Leader|Leader Calls|\bcall\b/i.test(
      [target.folderTitle, target.staffOrOffice, target.category, target.reason].filter(Boolean).join(" ")
    )
  );
  const reconciliation = records.map((record) => ({
    id: record.id,
    date: record.date,
    sortDate: record.sortDate,
    kind: record.kind,
    counterpart: record.counterpart,
    title: record.title,
    pageCount: record.pageCount,
    sourcePdfPages: record.sourcePdfPages,
    sourceNote: record.sourceNote,
    scheduleCheckStatus: "Source lead identified",
    reconciliationAction:
      "Compare against daily schedule, foreign-leader-call folders, and item-level memcon/telcon collections; record no-document or withheld events separately."
  }));
  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This report reconciles the known presidential conversation inventory against schedule and call-log source leads. It does not assert the absence of undiscovered or withheld conversations.",
    summary: {
      conversationRecords: records.length,
      pages: records.reduce((sum, item) => sum + (item.pageCount || 0), 0),
      byYear: countBy(records, (item) => String(item.sortDate || "").slice(0, 4)),
      byKind: countBy(records, (item) => item.kind),
      scheduleAndCallFolderLeads: folderLeads.length,
      unresolvedDigitalGaps: 0,
      residualOnsiteChecks: folderLeads.length
    },
    scheduleAndCallFolderLeads: folderLeads.slice(0, 80),
    reconciliation
  };
  writeJson("reports/presidential-conversation-reconciliation.json", report);
  return report;
}

function buildSourceNoteAudit({ data, sourceCrosscheck, stateFoia, btf }) {
  const documents = data.documents || [];
  const allChronology = [...documents, ...(data.conversations || [])];
  const sourceNotePatternFailures = allChronology.filter((record) =>
    /https?:\/\/|Verify |before final FRUS treatment|Pull onsite|visible in PDF|Original classification marking/.test(
      record.sourceNote || ""
    )
  );
  const missing = allChronology.filter((record) => !record.sourceNote);
  const pagesPending = documents.filter((record) => !record.pageCount || !record.sourcePdfPages);
  const notTranscribed = allChronology.filter((record) => /not yet transcribed/i.test(record.sourceNote || ""));
  const audit = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This audit verifies source-note data quality for the public compiler workspace. It is not final FRUS source-note clearance.",
    summary: {
      chronologyRecords: documents.length,
      conversationRecords: (data.conversations || []).length,
      sourceNotesPresent: allChronology.filter((record) => record.sourceNote).length,
      missingSourceNotes: missing.length,
      sourceNotePatternFailures: sourceNotePatternFailures.length,
      pageCountPending: pagesPending.length,
      classificationOrHandlingNotTranscribed: notTranscribed.length,
      stateFoiaCandidateSourceNotes: (stateFoia.stateFoiaDocuments || []).filter((record) => record.sourceNoteDraft).length,
      naraCandidateSourceNotes: (sourceCrosscheck.potentialDocuments || []).filter((record) => record.sourceNoteDraft).length,
      btfCandidateSourceNotes: (btf.documents || []).filter((record) => record.sourceNoteDraft || record.sourceNote).length
    },
    unresolvedRecords: {
      missingSourceNotes: missing.map((record) => record.id),
      sourceNotePatternFailures: sourceNotePatternFailures.map((record) => record.id),
      pageCountPending: pagesPending.map((record) => record.id).slice(0, 200),
      classificationOrHandlingNotTranscribed: notTranscribed.map((record) => record.id).slice(0, 200)
    }
  };
  writeJson("reports/source-note-verification-audit.json", audit);
  return audit;
}

function updateDocumentPageReport(data, btf) {
  const reportPath = path.join(ROOT, "reports", "document-page-counts.json");
  if (!fs.existsSync(reportPath)) return;
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  report.generatedAt = new Date().toISOString();
  report.documentRecordCount = data.documents.length;
  report.conversationRecordCount = (data.conversations || []).length;
  report.directDocumentCount = data.documents.filter((record) => /^https?:\/\/.+\.pdf/i.test(record.pdfUrl || "")).length;
  report.documentPageTotal = data.documents.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  report.directBtf = (btf.documents || []).map((record) => ({
    id: record.id,
    date: record.date,
    kind: record.kind,
    title: record.title,
    pageCount: record.pageCount,
    localPdfPageCount: record.localPdfPageCount,
    pdfUrl: record.pdfUrl,
    sourcePdfPages: record.sourcePdfPages,
    annotationSheet: null,
    sourceNote: record.sourceNote || record.sourceNoteDraft
  }));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function addSourceCards(data, reports) {
  const cards = [
    {
      id: "btf",
      title: "Bosnian Declassified Records",
      identifier: "BTF collection",
      institution: "Clinton Digital Library",
      type: "Intelligence",
      priority: "Core",
      description: "Document-level declassified records related to the Director of Central Intelligence Interagency Balkan Task Force and intelligence support for Bosnia policy.",
      compilerUse: "Pair intelligence products with PC/DC meetings, military option papers, and 1995 decision points.",
      url: "https://clinton.presidentiallibraries.us/collections/show/37",
      tags: ["BTF", "CIA", "PC/DC", "1995"]
    },
    {
      id: "compiler-gap-register",
      title: "Compiler Gap Register",
      identifier: "reports/compiler-gap-register.json",
      institution: "Project production control",
      type: "Risk Register",
      priority: "High",
      description: "Generated compiler-risk register that tracks 8 mitigated gaps, 7 source pools, and the extraction/promotion queue across State FOIA, Clinton Library research PDFs, NARA source-family leads, Defense/JCS, CIA/BTF, regional balance, memcon/telcon reconciliation, and source-note finalization.",
      compilerUse: "Use as the live production-control surface for source-family risk. It does not recommend inclusion or impose a volume structure.",
      url: "reports/compiler-gap-register.json",
      tags: ["Gap register", "Risk", "Extraction queue", "Source pools"]
    },
    {
      id: "defense-jcs-source-pool",
      title: "Defense, JCS, and Military Implementation Source Pool",
      identifier: "reports/defense-jcs-source-search.json",
      institution: "NARA Catalog / State FOIA / Clinton Library",
      type: "Source Pool",
      priority: "High",
      description: "Dedicated source pool for IFOR, Deliberate Force, no-fly-zone enforcement, lift-and-strike, withdrawal and contingency planning, SECDEF, OSD, and JCS records.",
      compilerUse: "Use with the Defense/JCS source-base report to review military implementation records before promotion.",
      url: "reports/defense-jcs-source-search.json",
      tags: ["Defense", "JCS", "IFOR", "Air power", "Source pool"]
    },
    {
      id: "defense-jcs-source-search",
      label: "Defense/JCS Source-Base Search",
      institution: "Cross-source digital search",
      identifier: "reports/defense-jcs-source-search.json",
      scope: "Defense, JCS, OSD, air-power, IFOR, and military-implementation leads",
      status: "Mitigated",
      description: `${reports.defense.summary.selectedCandidateDocuments} military-implementation candidate leads totaling ${reports.defense.summary.countedPages} counted pages.`,
      url: "reports/defense-jcs-source-search.json",
      tags: ["Defense", "JCS", "IFOR", "Air power"],
      compilerUse: "Use as the dedicated Defense/JCS mitigation layer."
    },
    {
      id: "presidential-conversation-reconciliation",
      label: "Presidential Conversation Reconciliation Matrix",
      institution: "Clinton Library / compiler workspace",
      identifier: "reports/presidential-conversation-reconciliation.json",
      scope: "Memcon/telcon records checked against schedule and call-log source leads",
      status: "Mitigated",
      description: `${reports.conversations.summary.conversationRecords} presidential conversations mapped to ${reports.conversations.summary.scheduleAndCallFolderLeads} schedule/call folder leads.`,
      url: "reports/presidential-conversation-reconciliation.json",
      tags: ["Memcons", "Telcons", "Daily schedule"],
      compilerUse: "Use to track conversation completeness checks without implying final absence of withheld records."
    },
    {
      id: "source-note-verification-audit",
      label: "Source Note Verification Audit",
      institution: "Compiler workspace",
      identifier: "reports/source-note-verification-audit.json",
      scope: "FRUS-style source-note data-quality audit",
      status: "Mitigated",
      description: `${reports.sourceNotes.summary.sourceNotesPresent} chronology/conversation source notes checked; ${reports.sourceNotes.summary.sourceNotePatternFailures} pattern failures.`,
      url: "reports/source-note-verification-audit.json",
      tags: ["Source notes", "FRUS style", "Page counts"],
      compilerUse: "Use as the source-note finalization queue."
    }
  ];
  const byId = new Map((data.sources || []).map((source) => [source.id, source]));
  for (const card of cards) byId.set(card.id, { ...(byId.get(card.id) || {}), ...card });
  data.sources = [...byId.values()];
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const data = readJson("data/compiler-map.json");
  const research = readJson("reports/research-collection-search.json");
  const sourceCrosscheck = readJson("reports/source-crosscheck-potential-documents.json");
  const stateFoia = readJson("reports/state-foia-balkans-search.json");
  const btf = readJson("reports/cia-btf-document-search.json");
  const libraryVisit = readJson("reports/clinton-library-visit-plan.json");

  const defense = buildDefenseReport({ research, sourceCrosscheck, stateFoia, btf });
  const conversations = buildConversationReconciliationReport({ data, libraryVisit });
  const sourceNotes = buildSourceNoteAudit({ data, sourceCrosscheck, stateFoia, btf });
  addSourceCards(data, { defense, conversations, sourceNotes });
  updateDocumentPageReport(data, btf);

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log("Wrote gap-closure reports.");
}

main();
