const DATA_URL = "data/compiler-map.json";
const REPORT_URLS = {
  documents: "reports/document-page-counts.json",
  conversations: "reports/conversation-page-counts.json",
  nara: "reports/nara-scout-memcon-telcon-search.json",
  talbott: "reports/strobe-talbott-manifest-search.json",
  researchCollections: "reports/research-collection-search.json",
  publicPapers: "reports/public-papers-balkans-search.json",
  sourceCrosscheck: "reports/source-crosscheck-potential-documents.json",
  stateFoia: "reports/state-foia-balkans-search.json",
  btfDocuments: "reports/cia-btf-document-search.json",
  defenseJcs: "reports/defense-jcs-source-search.json",
  conversationReconciliation: "reports/presidential-conversation-reconciliation.json",
  sourceNoteAudit: "reports/source-note-verification-audit.json",
  presidentialDailyDiary: "reports/presidential-daily-diary-search.json",
  gapRegister: "reports/compiler-gap-register.json",
  libraryVisit: "reports/clinton-library-visit-plan.json"
};

const state = {
  filter: "All",
  search: "",
  conversationScope: "Declassified",
  conversationFocus: "All",
  conversationKind: "All",
  conversationYear: "All",
  conversationMonth: "All",
  conversationSearch: "",
  researchRelationship: "All",
  researchSearch: "",
  libraryPriority: "Critical + High",
  librarySearch: "",
  pddConfidence: "All",
  pddSearch: "",
  stateFoiaRoute: "All",
  stateFoiaSearch: "",
  promotionPriority: "All",
  promotionSource: "All",
  promotionSearch: "",
  defenseJcsTopic: "All",
  defenseJcsSource: "All",
  defenseJcsSearch: "",
  naraCrosscheckSource: "All",
  naraCrosscheckYear: "All",
  naraCrosscheckSearch: ""
};

const nodes = {
  totalSources: document.querySelector("#total-sources"),
  totalConversations: document.querySelector("#total-conversations"),
  totalPages: document.querySelector("#total-pages"),
  totalSourceRanges: document.querySelector("#total-source-ranges"),
  status: document.querySelector("#volume-status"),
  auditRoot: document.querySelector("#audit-root"),
  coverageRoot: document.querySelector("#coverage-root"),
  counterpartRoot: document.querySelector("#counterpart-root"),
  gapSummaryRoot: document.querySelector("#gap-summary-root"),
  gapRoot: document.querySelector("#gap-root"),
  sourcePoolRoot: document.querySelector("#source-pool-root"),
  extractionQueueRoot: document.querySelector("#extraction-queue-root"),
  promotionSearch: document.querySelector("#promotion-search"),
  promotionPriorityFilters: document.querySelector("#promotion-priority-filters"),
  promotionSource: document.querySelector("#promotion-source"),
  promotionReset: document.querySelector("#promotion-reset"),
  promotionExport: document.querySelector("#promotion-export"),
  promotionSummary: document.querySelector("#promotion-summary"),
  promotionRoot: document.querySelector("#promotion-root"),
  pddSummaryRoot: document.querySelector("#pdd-summary-root"),
  pddSearch: document.querySelector("#pdd-search"),
  pddConfidenceFilters: document.querySelector("#pdd-confidence-filters"),
  pddReset: document.querySelector("#pdd-reset"),
  pddExport: document.querySelector("#pdd-export"),
  pddReferenceSummary: document.querySelector("#pdd-reference-summary"),
  pddReferencesRoot: document.querySelector("#pdd-references-root"),
  stateFoiaSummaryRoot: document.querySelector("#state-foia-summary-root"),
  stateFoiaSearch: document.querySelector("#state-foia-search"),
  stateFoiaRouteFilters: document.querySelector("#state-foia-route-filters"),
  stateFoiaReset: document.querySelector("#state-foia-reset"),
  stateFoiaExport: document.querySelector("#state-foia-export"),
  stateFoiaReferenceSummary: document.querySelector("#state-foia-reference-summary"),
  stateFoiaReferencesRoot: document.querySelector("#state-foia-references-root"),
  defenseJcsSummaryRoot: document.querySelector("#defense-jcs-summary-root"),
  defenseJcsSearch: document.querySelector("#defense-jcs-search"),
  defenseJcsTopic: document.querySelector("#defense-jcs-topic"),
  defenseJcsSource: document.querySelector("#defense-jcs-source"),
  defenseJcsReset: document.querySelector("#defense-jcs-reset"),
  defenseJcsExport: document.querySelector("#defense-jcs-export"),
  defenseJcsReferenceSummary: document.querySelector("#defense-jcs-reference-summary"),
  defenseJcsReferencesRoot: document.querySelector("#defense-jcs-references-root"),
  naraCrosscheckSummaryRoot: document.querySelector("#nara-crosscheck-summary-root"),
  naraCrosscheckSearch: document.querySelector("#nara-crosscheck-search"),
  naraCrosscheckSource: document.querySelector("#nara-crosscheck-source"),
  naraCrosscheckYear: document.querySelector("#nara-crosscheck-year"),
  naraCrosscheckReset: document.querySelector("#nara-crosscheck-reset"),
  naraCrosscheckExport: document.querySelector("#nara-crosscheck-export"),
  naraCrosscheckReferenceSummary: document.querySelector("#nara-crosscheck-reference-summary"),
  naraCrosscheckReferencesRoot: document.querySelector("#nara-crosscheck-references-root"),
  librarySummaryRoot: document.querySelector("#library-summary-root"),
  libraryPlanRoot: document.querySelector("#library-plan-root"),
  libraryCallslipsRoot: document.querySelector("#library-callslips-root"),
  librarySearch: document.querySelector("#library-search"),
  libraryPriorityFilters: document.querySelector("#library-priority-filters"),
  libraryReset: document.querySelector("#library-reset"),
  libraryExport: document.querySelector("#library-export"),
  libraryTargetSummary: document.querySelector("#library-target-summary"),
  libraryTargetsRoot: document.querySelector("#library-targets-root"),
  frusMethodRoot: document.querySelector("#frus-method-root"),
  readinessRoot: document.querySelector("#readiness-root"),
  sourceNoteRoot: document.querySelector("#source-note-root"),
  sourceNoteQueueRoot: document.querySelector("#source-note-queue-root"),
  conversationRoot: document.querySelector("#conversation-root"),
  conversationSearch: document.querySelector("#conversation-search"),
  conversationScopeFilters: document.querySelector("#conversation-scope-filters"),
  conversationFocus: document.querySelector("#conversation-focus"),
  conversationKind: document.querySelector("#conversation-kind"),
  conversationYear: document.querySelector("#conversation-year"),
  conversationMonth: document.querySelector("#conversation-month"),
  chronologyIndexRoot: document.querySelector("#chronology-index-root"),
  conversationReset: document.querySelector("#conversation-reset"),
  conversationViewLink: document.querySelector("#conversation-view-link"),
  conversationExport: document.querySelector("#conversation-export"),
  conversationMdExport: document.querySelector("#conversation-md-export"),
  conversationSummary: document.querySelector("#conversation-summary"),
  researchSummaryRoot: document.querySelector("#research-summary-root"),
  researchTierRoot: document.querySelector("#research-tier-root"),
  researchSupplementalRoot: document.querySelector("#research-supplemental-root"),
  researchSearch: document.querySelector("#research-search"),
  researchRelationshipFilters: document.querySelector("#research-relationship-filters"),
  researchReset: document.querySelector("#research-reset"),
  researchExport: document.querySelector("#research-export"),
  researchFileSummary: document.querySelector("#research-file-summary"),
  researchFilesRoot: document.querySelector("#research-files-root"),
  researchTargetsRoot: document.querySelector("#research-targets-root"),
  sourceFilters: document.querySelector("#source-filters"),
  sourceSearch: document.querySelector("#source-search"),
  sourcesRoot: document.querySelector("#sources-root"),
  queueRoot: document.querySelector("#queue-root")
};

function textMatch(source) {
  const haystack = [
    source.title,
    source.label,
    source.identifier,
    source.institution,
    source.description,
    source.compilerUse,
    source.type,
    source.status,
    source.scope,
    ...(source.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.search.toLowerCase());
}

function byPriority(a, b) {
  const order = { Anchor: 0, Core: 1, High: 2, Contextual: 3 };
  return (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || sourceTitle(a).localeCompare(sourceTitle(b));
}

function priorityClass(priority) {
  return (priority || "").toLowerCase();
}

function sourceTitle(source = {}) {
  return source.title || source.label || source.id || "Untitled source";
}

function sourceTypeLabel(source = {}) {
  return source.type || source.status || "Report";
}

function createTagRow(tags = []) {
  const row = document.createElement("div");
  row.className = "tag-row";

  for (const tag of tags) {
    const item = document.createElement("span");
    item.className = "tag";
    item.textContent = tag;
    row.append(item);
  }

  return row;
}

function conversationRecords(data) {
  return (data.documents || data.conversations || []).slice();
}

function conversationSubsetRecords(data) {
  return (data.conversations || []).filter((record) => ["Memcon", "Telcon"].includes(record.kind));
}

function sumPages(records) {
  return records.reduce((sum, record) => sum + (record.pageCount || 0), 0);
}

function sortByValueDesc(entries) {
  return entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function groupCounts(records, labelFor) {
  const groups = new Map();
  for (const record of records) {
    const label = labelFor(record) || "Unsorted";
    const item = groups.get(label) || { label, count: 0, pages: 0 };
    item.count += 1;
    item.pages += record.pageCount || 0;
    groups.set(label, item);
  }
  return [...groups.values()];
}

function isDirectPdf(record) {
  return /^https?:\/\/.+\.pdf(?:[?#].*)?$/i.test(record.pdfUrl || "");
}

function isExtractedDocument(record) {
  return /^(documents\/|\.\/documents\/)/.test(record.pdfUrl || "");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function itemIdFromUrl(url = "") {
  const itemMatch = url.match(/\/items\/show\/([^/?#]+)/);
  if (itemMatch) return `item ${itemMatch[1]}`;

  const catalogMatch = url.match(/\/id\/([^/?#]+)/);
  if (catalogMatch) return `NAID ${catalogMatch[1]}`;

  return "";
}

function repositoryLabel(record) {
  const sourceUrl = `${record.url || ""} ${record.sourcePdfUrl || ""}`;
  if (/catalog\.archives\.gov|NARAprodstorage/i.test(sourceUrl)) {
    return "National Archives and Records Administration, National Archives Catalog";
  }

  if (/govinfo\.gov/i.test(sourceUrl)) {
    return record.repository || "Government Publishing Office, GovInfo";
  }

  if (/foia\.state\.gov/i.test(sourceUrl)) {
    return record.repository || "Department of State, FOIA Virtual Reading Room";
  }

  if (record.repository) return record.repository;

  return "William J. Clinton Presidential Library, Clinton Digital Library";
}

function normalizedIdentifier(identifier = "") {
  return identifier.replace(/\s+\/\s+/g, "; ");
}

function locatorLabel(record) {
  const itemId = itemIdFromUrl(record.url);
  const control = normalizedIdentifier(record.identifier);
  if (itemId && control.includes(itemId)) return "";
  return itemId;
}

function sentenceCase(value = "") {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function sourcePdfLabel(record) {
  if (isDirectPdf(record)) {
    return `digital copy, source PDF pp. ${record.sourcePdfPages || `1-${record.pageCount || "?"}`}`;
  }

  if (record.sourcePdfPages) {
    return `extracted from source packet PDF, pp. ${record.sourcePdfPages}; document-level PDF prepared for review`;
  }

  return "digital locator recorded; source pagination pending";
}

function localExtractLabel(record) {
  if (!isExtractedDocument(record)) return isDirectPdf(record) ? "direct PDF" : "PDF locator";
  if (!record.localPdfPageCount) return "local extracted PDF";
  return `${record.localPdfPageCount} local PDF pages, including annotation sheet when present`;
}

function sourceNoteDraft(record) {
  if (record.sourceNote) return record.sourceNote;

  const control = normalizedIdentifier(record.identifier);
  const itemId = locatorLabel(record);
  const citationStem = [repositoryLabel(record), record.collection, control, itemId].filter(Boolean).join(", ");
  const sourcePdf = sentenceCase(sourcePdfLabel(record));
  const marking =
    record.documentScope === "Public statement"
      ? "Public record."
      : "Classification and handling markings not yet transcribed.";

  return `Source: ${citationStem}. ${marking} ${sourcePdf}.`;
}

function citationOpenItems(record) {
  if (record.documentScope === "Public statement") {
    return [
      "official GovInfo title and date",
      "Public Papers source pagination",
      "speaker, place, and event context",
      "editorial note and transcript status",
      "whether the record is presidential text, exchange, joint statement, or press secretary statement"
    ].join("; ");
  }

  const items = [
    "classification/handling controls",
    record.kind === "Telcon" ? "call metadata and notetakers" : "meeting place/time, participants, and notetakers",
    "drafting, clearance, approval, and distribution lines",
    "principal annotations, attachments not printed, and related documents",
    "excisions and withheld-text accounting"
  ];
  return items.join("; ");
}

function citationRows(record) {
  if (record.documentScope === "Public statement") {
    return [
      {
        label: "Repository / custody",
        value: repositoryLabel(record),
        status: "Ready"
      },
      {
        label: "Collection / control",
        value: [record.collection, normalizedIdentifier(record.identifier)].filter(Boolean).join(", "),
        status: "Ready"
      },
      {
        label: "Record locator",
        value: [record.granule, record.url].filter(Boolean).join("; "),
        status: "Ready"
      },
      {
        label: "PDF / page range",
        value: `direct GovInfo granule PDF, pp. ${record.sourcePdfPages || `1-${record.pageCount || "?"}`}; ${pageLabel(
          record.pageCount
        )} counted from Public Papers pagination.`,
        status: "Ready"
      },
      {
        label: "Publication metadata",
        value: `${record.publicPaperForm || record.kind || "Public Papers record"}; ${record.date}. Verify official title, date, speaker/place, transcript status, and editorial note against GovInfo.`,
        status: "Check"
      },
      {
        label: "FRUS treatment note",
        value:
          "Public record rather than a declassified archival document; use only as chronological public context unless the compiler chooses otherwise.",
        status: "Ready"
      }
    ];
  }

  const metadataLabel = record.kind === "Telcon" ? "Call metadata" : record.kind === "Memcon" ? "Meeting metadata" : "Document metadata";
  const metadataValue =
    record.kind === "Telcon" || record.kind === "Memcon"
      ? `${record.kind}; ${record.date}; counterpart: ${record.counterpart || "not recorded"}. Verify place, exact time, participants, and time zone against the PDF.`
      : `${record.kind || "Document"}; ${record.date}. Verify drafter/addressee, office symbols, exact date, distribution, and attachments against the PDF.`;

  return [
    {
      label: "Repository / custody",
      value: repositoryLabel(record),
      status: "Ready"
    },
    {
      label: "Collection / control",
      value: [record.collection, normalizedIdentifier(record.identifier)].filter(Boolean).join(", "),
      status: "Ready"
    },
    {
      label: "Record locator",
      value: [locatorLabel(record), record.url].filter(Boolean).join("; "),
      status: "Ready"
    },
    {
      label: "PDF / page range",
      value: `${sourcePdfLabel(record)}; ${pageLabel(record.pageCount)} counted as document text; ${localExtractLabel(record)}.`,
      status: "Ready"
    },
    {
      label: "Classification / handling",
      value: "Extract from original markings in the PDF header or face sheet, then place immediately after the source locator.",
      status: "PDF"
    },
    {
      label: "Drafting / clearance / distribution",
      value:
        "Capture drafter, notetaker, clearance, approval, distribution, sent/received, and read-status lines where present.",
      status: "PDF"
    },
    {
      label: metadataLabel,
      value: metadataValue,
      status: "Check"
    },
    {
      label: "Annotations / attachments",
      value: "Check for marginalia, handwritten action notes, attached tabs, and documents that should be noted as attached but not printed.",
      status: "PDF"
    },
    {
      label: "Declassification accounting",
      value: `Retain ${pageLabel(record.pageCount)} and source pp. ${record.sourcePdfPages || "pending"}; note annotation-sheet page, excisions, deletion counts, and wholly withheld cross-references after review.`,
      status: "Partial"
    }
  ];
}

function renderStats(data) {
  const documents = conversationRecords(data);

  nodes.totalSources.textContent = data.sources.length.toString();
  nodes.totalConversations.textContent = documents.length.toString();
  nodes.totalPages.textContent = sumPages(documents).toString();
  nodes.totalSourceRanges.textContent = documents.filter((record) => record.sourcePdfPages).length.toString();
  if (nodes.status) nodes.status.textContent = data.volume.status;
}

function auditCard(title, value, detail, meta) {
  const card = document.createElement("article");
  card.className = "audit-card";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const stat = document.createElement("p");
  stat.className = "audit-stat";
  stat.textContent = value;

  const body = document.createElement("p");
  body.textContent = detail;

  card.append(heading, stat, body);

  if (meta) {
    const note = document.createElement("p");
    note.className = "audit-meta";
    note.textContent = meta;
    card.append(note);
  }

  return card;
}

function renderAudit(data, reports = {}) {
  const documents = conversationRecords(data);
  const conversations = conversationSubsetRecords(data);
  const direct = documents.filter(isDirectPdf);
  const extracted = documents.filter(isExtractedDocument);
  const pending = documents.filter((record) => !record.pageCount);
  const memcons = documents.filter((record) => record.kind === "Memcon");
  const telcons = documents.filter((record) => record.kind === "Telcon");
  const packetAnnotated = documents.filter((record) => record.annotationSheet);
  const denseYear = sortByValueDesc(
    groupCounts(documents, (record) => (record.sortDate || "").slice(0, 4)).map((item) => ({
      label: item.label,
      value: item.count,
      pages: item.pages
    }))
  )[0];
  const naraRecords = reports.nara?.declassifiedRecords || reports.nara?.records?.length || 0;
  const naraUnique = reports.nara?.uniqueRecords || 0;
  const talbottHits = reports.talbott?.matchedCount || reports.talbott?.records?.length || 0;
  const talbottRows = reports.talbott?.rowCount || 0;
  const talbottStandalone = reports.talbott?.summary?.selectedStandaloneRecords || reports.talbott?.buckets?.inVolumeContext || 0;
  const talbottStandalonePages = reports.talbott?.summary?.selectedStandalonePages || 0;
  const publicStatements = documents.filter((record) => record.documentScope === "Public statement").length;
  const publicStatementPages = documents
    .filter((record) => record.documentScope === "Public statement")
    .reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const publicPaperRecords = reports.publicPapers?.summary?.selectedRecords || publicStatements;
  const publicPaperRows = reports.publicPapers?.summary?.scannedGranules || 0;
  const sourceCrosscheckRecords = reports.sourceCrosscheck?.summary?.addedPotentialDocuments || 0;
  const sourceCrosscheckPages = reports.sourceCrosscheck?.summary?.countedPages || 0;
  const stateFoiaRecords = reports.stateFoia?.summary?.selectedCandidateDocuments || 0;
  const stateFoiaPages = reports.stateFoia?.summary?.countedPages || 0;
  const btfRecords = reports.btfDocuments?.summary?.inPeriodDocuments || 0;
  const btfPages = reports.btfDocuments?.summary?.countedPages || 0;
  const defenseRecords = reports.defenseJcs?.summary?.selectedCandidateDocuments || 0;
  const sourceNoteFailures = reports.sourceNoteAudit?.summary?.sourceNotePatternFailures ?? null;
  const openGaps = reports.gapRegister?.summary?.open || 0;

  nodes.auditRoot.replaceChildren(
    auditCard(
      "Document Evidence",
      `${formatNumber(documents.length)} records`,
      `${formatNumber(sumPages(documents))} counted pages: ${formatNumber(memcons.length)} memcons, ${formatNumber(telcons.length)} telcons, and ${formatNumber(publicStatements)} Clinton Public Papers records remain visible inside the broader chronology.`,
      `${pending.length} records still need page counts.`
    ),
    auditCard(
      "PDF Coverage",
      `${formatNumber(direct.length + extracted.length)} PDFs`,
      `${formatNumber(direct.length)} direct PDFs and ${formatNumber(extracted.length)} extracted packet documents.`,
      `${formatNumber(packetAnnotated.length)} extracted PDFs append source packet page 1 as an annotation sheet.`
    ),
    auditCard(
      "Discovery Sweeps",
      `${formatNumber(naraRecords + talbottHits + publicPaperRecords + sourceCrosscheckRecords + stateFoiaRecords + btfRecords)} leads`,
      `${formatNumber(naraRecords)} declassified NARA Scout records from ${formatNumber(naraUnique)} unique hits; ${formatNumber(talbottHits)} Strobe Talbott full-text hits from ${formatNumber(talbottRows)} rows; ${formatNumber(publicPaperRecords)} Clinton Public Papers records from ${formatNumber(publicPaperRows)} GovInfo granules; ${formatNumber(sourceCrosscheckRecords)} NARA source-family potential documents; ${formatNumber(stateFoiaRecords)} State FOIA candidates; ${formatNumber(btfRecords)} CIA/BTF documents.`,
      `${formatNumber(talbottStandalone)} reviewed Talbott standalone records total ${formatNumber(talbottStandalonePages)} pages; Public Papers add ${formatNumber(publicStatementPages)} counted pages; NARA source-family leads add ${formatNumber(sourceCrosscheckPages)} pages; State FOIA candidates add ${formatNumber(stateFoiaPages)} pages; CIA/BTF adds ${formatNumber(btfPages)} pages.`
    ),
    auditCard(
      "Open Risks",
      formatNumber(openGaps),
      denseYear
        ? `${formatNumber(denseYear.value)} documents and ${formatNumber(denseYear.pages)} pages cluster in ${denseYear.label}; ${formatNumber(conversations.length)} records remain in the memcon/telcon subset.`
        : "No document dates available.",
      `${formatNumber(defenseRecords)} Defense/JCS leads; source-note pattern failures: ${sourceNoteFailures === null ? "pending" : formatNumber(sourceNoteFailures)}.`
    )
  );

  renderCoverage(documents);
  renderCounterparts(documents);
}

function renderCoverage(conversations) {
  const byYear = groupCounts(conversations, (record) => (record.sortDate || "").slice(0, 4)).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  const byKind = groupCounts(conversations, (record) => record.kind).sort((a, b) => a.label.localeCompare(b.label));
  const maxPages = Math.max(...byYear.map((item) => item.pages), ...byKind.map((item) => item.pages), 1);

  const heading = document.createElement("h3");
  heading.textContent = "Coverage by Year and Form";
  const list = document.createElement("div");
  list.className = "coverage-list";

  for (const item of [...byYear, ...byKind]) {
    const row = document.createElement("div");
    row.className = "coverage-row";
    const label = document.createElement("span");
    label.textContent = item.label;
    const meter = document.createElement("span");
    meter.className = "coverage-meter";
    meter.style.setProperty("--meter-width", `${Math.max(8, (item.pages / maxPages) * 100)}%`);
    const value = document.createElement("span");
    value.textContent = `${formatNumber(item.count)} records / ${formatNumber(item.pages)} pages`;
    row.append(label, meter, value);
    list.append(row);
  }

  nodes.coverageRoot.replaceChildren(heading, list);
}

function renderCounterparts(conversations) {
  const groups = groupCounts(conversations, (record) => record.counterpart || record.documentScope || record.kind)
    .sort((a, b) => b.count - a.count || b.pages - a.pages || a.label.localeCompare(b.label))
    .slice(0, 10);

  const heading = document.createElement("h3");
  heading.textContent = "People / Form Index";
  const list = document.createElement("div");
  list.className = "counterpart-list";

  for (const item of groups) {
    const row = document.createElement("div");
    row.className = "counterpart-row";
    const label = document.createElement("span");
    label.textContent = item.label;
    const value = document.createElement("span");
    value.textContent = `${formatNumber(item.count)} / ${formatNumber(item.pages)} pp.`;
    row.append(label, value);
    list.append(row);
  }

  nodes.counterpartRoot.replaceChildren(heading, list);
}

function renderCompilerGaps(report = {}) {
  if (!report) {
    nodes.gapSummaryRoot.replaceChildren(
      auditCard("Gap Register", "Pending", "The compiler gap register has not loaded.", "")
    );
    return;
  }

  const summary = report.summary || {};
  const metrics = report.metrics || {};
  nodes.gapSummaryRoot.replaceChildren(
    auditCard(
      "Tracked Gaps",
      formatNumber(summary.gaps),
      `${formatNumber(summary.mitigated)} mitigated by a reproducible layer or queue; ${formatNumber(summary.open)} remain open.`,
      `${formatNumber(summary.critical)} critical, ${formatNumber(summary.high)} high, ${formatNumber(summary.medium)} medium.`
    ),
    auditCard(
      "Candidate Leads",
      formatNumber(summary.candidateLeads),
      `${formatNumber(metrics.candidateLeadPages)} counted pages in research and candidate source layers are available for compiler review.`,
      "Candidate leads are not selection recommendations."
    ),
    auditCard(
      "Extraction Queue",
      formatNumber(summary.extractionQueue),
      "Prioritized follow-up items combine research-plan PDFs, State FOIA candidates, NARA source-family leads, and Presidential Daily Diary references.",
      "Promotion to chronology requires duplicate and source-note review."
    ),
    auditCard(
      "Archival Core",
      formatNumber(metrics.archivalChronologyRecords),
      `${formatNumber(metrics.publicStatementRecords)} Public Papers records are separated from the declassified archival chronology.`,
      "This prevents public statements from masking source-family gaps."
    )
  );

  nodes.gapRoot.replaceChildren();
  for (const gap of report.gaps || []) {
    const card = document.createElement("article");
    card.className = "gap-card";

    const top = document.createElement("div");
    top.className = "source-top";
    const heading = document.createElement("h3");
    heading.textContent = gap.title;
    const badges = document.createElement("div");
    badges.className = "conversation-badges";
    const severity = document.createElement("span");
    severity.className = `priority ${priorityClass(gap.severity)}`;
    severity.textContent = gap.severity;
    const status = document.createElement("span");
    status.className = `source-type ${gap.status === "Open" ? "packet" : "direct"}`;
    status.textContent = gap.status;
    badges.append(severity, status);
    top.append(heading, badges);

    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = gap.area;

    const risk = document.createElement("p");
    risk.textContent = gap.risk;

    const mitigation = document.createElement("p");
    mitigation.className = "audit-meta";
    mitigation.textContent = `Mitigation: ${gap.mitigation}`;

    const details = document.createElement("details");
    details.className = "source-note-details";
    const summaryNode = document.createElement("summary");
    summaryNode.textContent = "Evidence and next actions";
    const evidence = document.createElement("ul");
    for (const item of gap.evidence || []) {
      const li = document.createElement("li");
      li.textContent = item;
      evidence.append(li);
    }
    const actions = document.createElement("ol");
    for (const item of gap.nextActions || []) {
      const li = document.createElement("li");
      li.textContent = item;
      actions.append(li);
    }
    details.append(summaryNode, evidence, actions);

    card.append(top, meta, risk, mitigation, details);
    nodes.gapRoot.append(card);
  }

  renderSourcePools(report);
  renderExtractionQueue(report);
  renderPromotionPriorityFilters(report);
  renderPromotionSourceOptions(report);
  renderPromotionQueue(report);
}

function renderSourcePools(report = {}) {
  const heading = document.createElement("h3");
  heading.textContent = "Source Pools";
  const list = document.createElement("div");
  list.className = "research-tier-list";

  for (const pool of report.sourcePools || []) {
    const row = document.createElement("div");
    row.className = "research-tier-row";
    const label = document.createElement("strong");
    label.textContent = pool.label;
    const detail = document.createElement("span");
    detail.textContent = `${pool.status}: ${formatNumber(pool.currentLeads)} leads; ${pool.countedPages ? `${formatNumber(pool.countedPages)} counted pages. ` : ""}${pool.remainingRisk}`;
    row.append(label, detail);
    list.append(row);
  }

  nodes.sourcePoolRoot.replaceChildren(heading, list);
}

function renderExtractionQueue(report = {}) {
  const heading = document.createElement("h3");
  heading.textContent = "Promotion Queue";
  const list = document.createElement("div");
  list.className = "research-supplemental-list";

  for (const item of (report.extractionQueue || []).slice(0, 18)) {
    const row = document.createElement("div");
    row.className = "research-supplemental-row";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("span");
    detail.textContent = `${item.priority} | ${item.sourceFamily}${item.pageCount ? ` | ${pageLabel(item.pageCount)}` : ""}. ${item.nextAction}`;
    row.append(title, detail);
    list.append(row);
  }

  nodes.extractionQueueRoot.replaceChildren(heading, list);
}

function promotionItems(report = {}) {
  return (report.extractionQueue || []).slice();
}

function promotionPriorityOrder(value = "") {
  return { High: 0, Medium: 1, Low: 2 }[value] ?? 9;
}

function promotionTextMatch(item = {}) {
  if (!state.promotionSearch) return true;
  const haystack = [item.priority, item.sourceFamily, item.title, item.reason, item.nextAction, item.date, item.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(state.promotionSearch.toLowerCase());
}

function filteredPromotionItems(report = {}) {
  return promotionItems(report)
    .filter((item) => state.promotionPriority === "All" || item.priority === state.promotionPriority)
    .filter((item) => state.promotionSource === "All" || item.sourceFamily === state.promotionSource)
    .filter(promotionTextMatch)
    .sort((a, b) => {
      return (
        promotionPriorityOrder(a.priority) - promotionPriorityOrder(b.priority) ||
        String(a.sourceFamily || "").localeCompare(String(b.sourceFamily || "")) ||
        String(a.date || "9999").localeCompare(String(b.date || "9999")) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function renderPromotionPriorityFilters(report = {}) {
  if (!nodes.promotionPriorityFilters) return;
  const priorities = ["All", ...new Set(promotionItems(report).map((item) => item.priority).filter(Boolean).sort((a, b) => promotionPriorityOrder(a) - promotionPriorityOrder(b)))];
  renderButtonGroup(nodes.promotionPriorityFilters, priorities, state.promotionPriority, (value) => {
    state.promotionPriority = value;
    renderPromotionPriorityFilters(report);
    renderPromotionQueue(report);
  });
}

function renderPromotionSourceOptions(report = {}) {
  if (!nodes.promotionSource) return;
  const sources = ["All", ...new Set(promotionItems(report).map((item) => item.sourceFamily).filter(Boolean).sort())];
  if (!sources.includes(state.promotionSource)) state.promotionSource = "All";
  renderSelect(nodes.promotionSource, sources, state.promotionSource, (value) => {
    state.promotionSource = value;
    renderPromotionQueue(report);
  });
}

function renderPromotionQueue(report = {}) {
  if (!nodes.promotionRoot) return;
  const items = filteredPromotionItems(report);
  const total = promotionItems(report).length;
  nodes.promotionSummary.textContent = `Showing ${formatNumber(items.length)} of ${formatNumber(
    total
  )} extraction and promotion leads from the compiler gap register.`;
  nodes.promotionRoot.replaceChildren();

  if (!items.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No promotion queue items match the current filters.";
    row.append(cell);
    nodes.promotionRoot.append(row);
    return;
  }

  for (const item of items) {
    const row = document.createElement("tr");

    const priorityCell = document.createElement("td");
    const priority = document.createElement("span");
    priority.className = `priority ${priorityClass(item.priority)}`;
    priority.textContent = item.priority || "Priority";
    priorityCell.append(priority);

    const sourceCell = document.createElement("td");
    sourceCell.textContent = item.sourceFamily || "Source family pending";

    const leadCell = document.createElement("td");
    const title = item.url ? document.createElement("a") : document.createElement("strong");
    title.textContent = item.title || "Untitled lead";
    if (item.url) {
      title.href = item.url;
      title.rel = "noreferrer";
      title.className = "queue-record-title";
    }
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [item.date, item.pageCount ? pageLabel(item.pageCount) : ""].filter(Boolean).join(" | ");
    leadCell.append(title, meta);

    const reasonCell = document.createElement("td");
    reasonCell.textContent = item.reason || "Review reason pending.";

    const actionCell = document.createElement("td");
    actionCell.textContent = item.nextAction || "Review source, duplicate status, document boundaries, and source-note metadata.";

    row.append(priorityCell, sourceCell, leadCell, reasonCell, actionCell);
    nodes.promotionRoot.append(row);
  }
}

function exportPromotionQueue(report = {}) {
  const fields = ["priority", "sourceFamily", "title", "date", "pageCount", "reason", "nextAction", "url"];
  const rows = filteredPromotionItems(report).map((item) => fields.map((field) => item[field] || ""));
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-promotion-queue.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function pddReferences(report = {}) {
  return (report.researchLeads || report.selectedReferences || []).slice();
}

function pddReferenceText(reference) {
  return [
    reference.title,
    reference.date,
    reference.confidence,
    reference.identifier,
    reference.collection,
    reference.repository,
    reference.fileUnitTitle,
    reference.originalFile,
    reference.sourceNoteDraft,
    reference.compilerUse,
    ...(reference.matchedTerms || []),
    ...((reference.targets || []).map((target) => [target.folderTitle, target.staff, target.relationship].join(" ")))
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filteredPddReferences(report = {}) {
  return pddReferences(report)
    .filter((reference) => state.pddConfidence === "All" || sentenceCase(reference.confidence) === state.pddConfidence)
    .filter((reference) => !state.pddSearch || pddReferenceText(reference).includes(state.pddSearch.toLowerCase()))
    .sort((a, b) => {
      const confidenceOrder = { high: 0, medium: 1, low: 2 };
      return (
        String(a.sortDate || "").localeCompare(String(b.sortDate || "")) ||
        (confidenceOrder[a.confidence] ?? 9) - (confidenceOrder[b.confidence] ?? 9) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function pddReferenceLabel(reference = {}) {
  return String(reference.title || "Presidential Daily Diary reference").replace(/^Presidential Daily Diary reference:\s*/i, "");
}

function pddPersonTokens(reference = {}) {
  return (reference.matchedTerms || [])
    .flatMap((term) => String(term).split(/[;/,]|\band\b/i))
    .map((term) => term.trim().split(/\s+/).filter(Boolean).pop())
    .filter((term) => term && term.length > 2 && !/bosnia|bosnian|serbia|serbian|un|ifor/i.test(term))
    .map((term) => term.toLowerCase());
}

function pddKnownConversationMatches(reference = {}, data = {}) {
  const tokens = pddPersonTokens(reference);
  if (!tokens.length) return [];
  return conversationRecords(data)
    .filter(isConversationRecord)
    .filter((record) => record.sortDate === reference.sortDate)
    .filter((record) => {
      const haystack = [record.title, record.counterpart, ...(record.tags || []), ...(record.subjects || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.some((token) => haystack.includes(token));
    });
}

function pddReconciliationAction(reference, data) {
  const matches = pddKnownConversationMatches(reference, data);
  if (matches.length) {
    return {
      status: "Known chronology match",
      detail: matches.map((record) => `${record.kind}: ${record.counterpart || record.title}`).join(" | "),
      matches
    };
  }

  return {
    status: "Schedule-only lead",
    detail: "Check daily schedule, call-log, and foreign-leader-call folders for a no-document event, withheld record, or non-Balkans reference before closing.",
    matches: []
  };
}

function renderPddSummary(report = {}, data = {}) {
  const refs = pddReferences(report);
  const high = refs.filter((reference) => reference.confidence === "high").length;
  const medium = refs.filter((reference) => reference.confidence === "medium").length;
  const matched = refs.filter((reference) => pddKnownConversationMatches(reference, data).length).length;
  const uniqueImages = new Set(refs.map((reference) => reference.pdfUrl).filter(Boolean)).size;

  nodes.pddSummaryRoot.replaceChildren(
    auditCard(
      "Diary References",
      formatNumber(refs.length),
      `${formatNumber(high)} high-confidence and ${formatNumber(medium)} medium-confidence call/meeting references from FOIA 2010-0083-F.`,
      `${formatNumber(report.summary?.ocrPages)} OCR pages searched across ${formatNumber(report.summary?.inPeriodFileUnits)} in-period file units.`
    ),
    auditCard(
      "Known Matches",
      formatNumber(matched),
      "References with same-date known memcon/telcon matches are flagged for reconciliation against the chronology.",
      "Unmatched references are schedule-only leads, not absence claims."
    ),
    auditCard(
      "Source Images",
      formatNumber(uniqueImages),
      "Each row links the source image and NARA Catalog file-unit page used for the lead.",
      "Use source images to verify exact time, context, and OCR false positives."
    )
  );
}

function renderPddConfidenceFilters(report = {}, data = {}) {
  const confidences = ["All", "High", "Medium", "Low"].filter(
    (confidence) => confidence === "All" || pddReferences(report).some((reference) => sentenceCase(reference.confidence) === confidence)
  );

  renderButtonGroup(nodes.pddConfidenceFilters, confidences, state.pddConfidence, (value) => {
    state.pddConfidence = value;
    renderPddConfidenceFilters(report, data);
    renderPddReferences(report, data);
  });
}

function renderPddReferences(report = {}, data = {}) {
  const references = filteredPddReferences(report);
  const totalReferences = pddReferences(report).length;
  nodes.pddReferenceSummary.textContent = `Showing ${formatNumber(references.length)} of ${formatNumber(
    totalReferences
  )} Presidential Daily Diary call/meeting references.`;
  nodes.pddReferencesRoot.replaceChildren();

  if (!references.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = "No Presidential Daily Diary references match the current filters.";
    row.append(cell);
    nodes.pddReferencesRoot.append(row);
    return;
  }

  for (const reference of references) {
    const action = pddReconciliationAction(reference, data);
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = reference.date || "Date pending";

    const referenceCell = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = pddReferenceLabel(reference);
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [
      sentenceCase(reference.confidence || "confidence pending"),
      (reference.matchedTerms || []).join("; "),
      reference.identifier
    ]
      .filter(Boolean)
      .join(" | ");
    referenceCell.append(title, meta);

    const reconciliationCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `citation-status ${action.matches.length ? "ready" : "check"}`;
    status.textContent = action.status;
    const detail = document.createElement("p");
    detail.className = "queue-record-meta";
    detail.textContent = action.detail;
    reconciliationCell.append(status, detail);
    if (action.matches.length) {
      const links = document.createElement("div");
      links.className = "queue-link-list";
      for (const match of action.matches) {
        const link = document.createElement("a");
        link.className = "source-link";
        link.href = stableChronologyRecordUrl(match);
        link.textContent = `Open ${match.kind}`;
        links.append(link);
      }
      reconciliationCell.append(links);
    }

    const sourceCell = document.createElement("td");
    const links = document.createElement("div");
    links.className = "queue-link-list";
    for (const [label, url] of [
      ["Open source image", reference.pdfUrl],
      ["Open Catalog file unit", reference.itemUrl]
    ]) {
      if (!url) continue;
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = url;
      link.rel = "noreferrer";
      link.textContent = label;
      links.append(link);
    }
    const note = document.createElement("p");
    note.className = "queue-record-meta";
    note.textContent = reference.sourceNoteDraft || "";
    sourceCell.append(links, note);

    row.append(dateCell, referenceCell, reconciliationCell, sourceCell);
    nodes.pddReferencesRoot.append(row);
  }
}

function exportPddReferences(report = {}, data = {}) {
  const fields = [
    "date",
    "reference",
    "confidence",
    "matchedTerms",
    "identifier",
    "reconciliationStatus",
    "reconciliationDetail",
    "knownChronologyLinks",
    "sourceImage",
    "catalogFileUnit",
    "sourceNoteDraft",
    "compilerUse"
  ];
  const rows = filteredPddReferences(report).map((reference) => {
    const action = pddReconciliationAction(reference, data);
    return [
      reference.date,
      pddReferenceLabel(reference),
      reference.confidence,
      (reference.matchedTerms || []).join("; "),
      reference.identifier,
      action.status,
      action.detail,
      action.matches.map(stableChronologyRecordUrl).join("; "),
      reference.pdfUrl,
      reference.itemUrl,
      reference.sourceNoteDraft,
      reference.compilerUse
    ];
  });
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-presidential-daily-diary-references.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function renderPresidentialDailyDiary(report = {}, data = {}) {
  if (!report || !nodes.pddSummaryRoot) return;
  renderPddSummary(report, data);
  renderPddConfidenceFilters(report, data);
  renderPddReferences(report, data);
}

function stateFoiaDocuments(report = {}) {
  return (report.stateFoiaDocuments || []).slice();
}

function stateFoiaRouteLabel(record = {}) {
  return [record.from, record.to].filter(Boolean).join(" to ") || "Route pending";
}

function stateFoiaRouteBucket(record = {}) {
  const route = stateFoiaRouteLabel(record);
  if (/BELGRADE/i.test(route)) return "Belgrade";
  if (/ZAGREB/i.test(route)) return "Zagreb";
  if (/SARAJEVO/i.test(route)) return "Sarajevo";
  if (/USNATO|NATO/i.test(route)) return "USNATO / NATO";
  if (/USUN|United Nations|UN\b/i.test(route)) return "USUN / UN";
  if (/MOSCOW/i.test(route)) return "Moscow";
  if (/TOSEC|SECSTATE|S\/S/i.test(route)) return "Secretary / TOSEC";
  if (/STATE/i.test(route)) return "State outgoing";
  return "Other";
}

function stateFoiaText(record = {}) {
  return [
    record.title,
    record.kind,
    record.date,
    record.identifier,
    record.caseNumber,
    record.messageNumber,
    record.classification,
    record.releasedecision,
    record.doctype,
    record.from,
    record.to,
    record.sourceSeries,
    record.sourceNoteDraft,
    record.compilerUse,
    ...(record.matchedQueries || []),
    ...((record.targets || []).map((target) => [target.staff, target.folderTitle, target.relationship].join(" ")))
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filteredStateFoiaDocuments(report = {}) {
  return stateFoiaDocuments(report)
    .filter((record) => state.stateFoiaRoute === "All" || stateFoiaRouteBucket(record) === state.stateFoiaRoute)
    .filter((record) => !state.stateFoiaSearch || stateFoiaText(record).includes(state.stateFoiaSearch.toLowerCase()))
    .sort((a, b) => {
      return (
        String(a.sortDate || "").localeCompare(String(b.sortDate || "")) ||
        stateFoiaRouteBucket(a).localeCompare(stateFoiaRouteBucket(b)) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function renderStateFoiaSummary(report = {}) {
  const summary = report.summary || {};
  const records = stateFoiaDocuments(report);
  const routes = new Set(records.map(stateFoiaRouteBucket));
  const pages = records.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const classified = records.filter((record) => /^(S|C|SECRET|CONFIDENTIAL)$/i.test(record.classification || "")).length;

  nodes.stateFoiaSummaryRoot.replaceChildren(
    auditCard(
      "Candidate Records",
      formatNumber(records.length),
      `${formatNumber(summary.totalHitsAcrossQueries)} total API hits across ${formatNumber(summary.queryPacks)} targeted search packs; ${formatNumber(summary.fetchedRows)} rows fetched for screening.`,
      "Candidate layer only; not a volume selection list."
    ),
    auditCard(
      "Counted Pages",
      formatNumber(pages || summary.countedPages),
      `${formatNumber(summary.uniqueBalkansPdfRows)} unique Balkans PDF rows; ${formatNumber(records.length)} high-confidence candidates retained.`,
      "Direct State FOIA PDFs are linked for document-boundary and duplicate review."
    ),
    auditCard(
      "Routes",
      formatNumber(routes.size),
      `${formatNumber(classified)} records carry Secret or Confidential metadata in the State FOIA row.`,
      "Route buckets help separate embassy, mission, and Washington traffic before promotion."
    )
  );
}

function renderStateFoiaRouteFilters(report = {}) {
  const preferred = [
    "All",
    "Belgrade",
    "Zagreb",
    "Sarajevo",
    "USNATO / NATO",
    "USUN / UN",
    "Moscow",
    "Secretary / TOSEC",
    "State outgoing",
    "Other"
  ];
  const buckets = new Set(stateFoiaDocuments(report).map(stateFoiaRouteBucket));
  const routes = preferred.filter((route) => route === "All" || buckets.has(route));

  renderButtonGroup(nodes.stateFoiaRouteFilters, routes, state.stateFoiaRoute, (value) => {
    state.stateFoiaRoute = value;
    renderStateFoiaRouteFilters(report);
    renderStateFoiaDocuments(report);
  });
}

function stateFoiaReviewAction(record = {}) {
  const cableParts = [
    record.messageNumber ? `message ${record.messageNumber}` : "",
    record.classification ? `classification ${record.classification}` : "",
    record.releasedecision ? `release ${record.releasedecision}` : ""
  ]
    .filter(Boolean)
    .join("; ");
  return `${cableParts || "State FOIA metadata recorded"}. Verify cable number, TAGS/SUBJECT, from/to line, addressees, drafting/clearance, distribution, attachments, excisions, and duplicate status before chronology promotion.`;
}

function renderStateFoiaDocuments(report = {}) {
  const records = filteredStateFoiaDocuments(report);
  const totalRecords = stateFoiaDocuments(report).length;
  nodes.stateFoiaReferenceSummary.textContent = `Showing ${formatNumber(records.length)} of ${formatNumber(
    totalRecords
  )} State FOIA cable/memorandum candidates.`;
  nodes.stateFoiaReferencesRoot.replaceChildren();

  if (!records.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No State FOIA candidates match the current filters.";
    row.append(cell);
    nodes.stateFoiaReferencesRoot.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = record.date || "Date pending";

    const titleCell = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = record.title;
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [record.identifier, record.caseNumber, pageLabel(record.pageCount)].filter(Boolean).join(" | ");
    titleCell.append(title, meta);

    const routeCell = document.createElement("td");
    const route = document.createElement("span");
    route.className = "source-type direct";
    route.textContent = stateFoiaRouteBucket(record);
    const routeMeta = document.createElement("p");
    routeMeta.className = "queue-record-meta";
    routeMeta.textContent = stateFoiaRouteLabel(record);
    routeCell.append(route, routeMeta);

    const reviewCell = document.createElement("td");
    const action = document.createElement("p");
    action.className = "queue-record-meta";
    action.textContent = stateFoiaReviewAction(record);
    const queries = document.createElement("p");
    queries.className = "queue-record-meta";
    queries.textContent = `Matched: ${(record.matchedQueries || []).join("; ") || "State FOIA search pack"}`;
    reviewCell.append(action, queries);

    const linkCell = document.createElement("td");
    const links = document.createElement("div");
    links.className = "queue-link-list";
    for (const [label, url] of [
      ["Open PDF", record.pdfUrl],
      ["Open FOIA result", record.itemUrl]
    ]) {
      if (!url) continue;
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = url;
      link.rel = "noreferrer";
      link.textContent = label;
      links.append(link);
    }
    const note = document.createElement("p");
    note.className = "queue-record-meta";
    note.textContent = record.sourceNoteDraft || "";
    linkCell.append(links, note);

    row.append(dateCell, titleCell, routeCell, reviewCell, linkCell);
    nodes.stateFoiaReferencesRoot.append(row);
  }
}

function exportStateFoiaDocuments(report = {}) {
  const fields = [
    "date",
    "title",
    "routeBucket",
    "from",
    "to",
    "classification",
    "releaseDecision",
    "caseNumber",
    "messageNumber",
    "identifier",
    "pageCount",
    "matchedQueries",
    "pdfUrl",
    "foiaResultUrl",
    "sourceSeries",
    "sourceNoteDraft",
    "compilerReview"
  ];
  const rows = filteredStateFoiaDocuments(report).map((record) => [
    record.date,
    record.title,
    stateFoiaRouteBucket(record),
    record.from,
    record.to,
    record.classification,
    record.releasedecision,
    record.caseNumber,
    record.messageNumber,
    record.identifier,
    record.pageCount,
    (record.matchedQueries || []).join("; "),
    record.pdfUrl,
    record.itemUrl,
    record.sourceSeries,
    record.sourceNoteDraft,
    stateFoiaReviewAction(record)
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-state-foia-cable-review-queue.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function renderStateFoiaQueue(report = {}) {
  if (!report || !nodes.stateFoiaSummaryRoot) return;
  renderStateFoiaSummary(report);
  renderStateFoiaRouteFilters(report);
  renderStateFoiaDocuments(report);
}

function defenseJcsDocuments(report = {}) {
  return (report.documents || []).slice();
}

function defenseJcsSourceLabel(record = {}) {
  const explicit = record.sourceFamilyLabel || record.sourceFamily;
  if (explicit && explicit !== "Unknown") return explicit;
  if ((record.targets || []).some((target) => target.type === "ranked-folder" || target.relationship === "exact-folder-title")) {
    return "Clinton Digital Library research plan";
  }
  return record.repository || "Other source family";
}

function defenseJcsTopic(record = {}) {
  const text = [
    record.title,
    record.kind,
    record.documentScope,
    record.sourceFamilyLabel,
    record.sourceSeries,
    record.compilerUse,
    ...(record.tags || []),
    ...(record.subjects || [])
  ]
    .filter(Boolean)
    .join(" ");
  if (/IFOR|Implementation Force|implementation/i.test(text)) return "IFOR / implementation";
  if (/UNPROFOR|withdrawal|redeployment/i.test(text)) return "UNPROFOR / withdrawal";
  if (/arms embargo|lift and strike|lift-and-strike/i.test(text)) return "Arms embargo / lift-strike";
  if (/air ?strike|air ?power|no-fly|NAC|NATO|Deliberate Force/i.test(text)) return "Air power / NATO";
  if (/JCS|Joint Chiefs|OSD|SECDEF|Perry|Shalikashvili|Defense/i.test(text)) return "JCS / OSD / Defense";
  if (/military|OPLAN|contingency|ground forces/i.test(text)) return "Military planning";
  return "Other military";
}

function defenseJcsText(record = {}) {
  return [
    record.title,
    record.kind,
    record.date,
    record.identifier,
    defenseJcsTopic(record),
    defenseJcsSourceLabel(record),
    record.sourceSeries,
    record.sourceNoteDraft,
    record.compilerUse,
    ...(record.tags || []),
    ...(record.subjects || []),
    ...((record.targets || []).map((target) => [target.staff, target.folderTitle, target.tier, target.oaBox].join(" ")))
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filteredDefenseJcsDocuments(report = {}) {
  return defenseJcsDocuments(report)
    .filter((record) => state.defenseJcsTopic === "All" || defenseJcsTopic(record) === state.defenseJcsTopic)
    .filter((record) => state.defenseJcsSource === "All" || defenseJcsSourceLabel(record) === state.defenseJcsSource)
    .filter((record) => !state.defenseJcsSearch || defenseJcsText(record).includes(state.defenseJcsSearch.toLowerCase()))
    .sort((a, b) => {
      return (
        String(a.sortDate || "9999").localeCompare(String(b.sortDate || "9999")) ||
        defenseJcsTopic(a).localeCompare(defenseJcsTopic(b)) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function renderDefenseJcsSummary(report = {}) {
  const summary = report.summary || {};
  const records = defenseJcsDocuments(report);
  const pages = records.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const topics = new Set(records.map(defenseJcsTopic));
  const sources = new Set(records.map(defenseJcsSourceLabel));
  const dated = records.filter((record) => record.sortDate).length;

  nodes.defenseJcsSummaryRoot.replaceChildren(
    auditCard(
      "Military Leads",
      formatNumber(records.length),
      `${formatNumber(pages || summary.countedPages)} counted pages across ${formatNumber(sources.size)} source families.`,
      "Aggregated from CIA/BTF, State FOIA, NARA, and Clinton Library research-plan layers."
    ),
    auditCard(
      "Topic Buckets",
      formatNumber(topics.size),
      "Filters separate IFOR, UNPROFOR withdrawal, air power/NATO, arms embargo, JCS/OSD, and planning leads.",
      "Use with PC/DC decision points and presidential-call chronology."
    ),
    auditCard(
      "Chronology Readiness",
      formatNumber(dated),
      `${formatNumber(records.length - dated)} leads still need exact document-date or source-boundary verification before promotion.`,
      "This section is a source-base review queue, not a selection list."
    )
  );
}

function renderDefenseJcsFilters(report = {}) {
  const topicOrder = [
    "All",
    "IFOR / implementation",
    "UNPROFOR / withdrawal",
    "Air power / NATO",
    "Arms embargo / lift-strike",
    "JCS / OSD / Defense",
    "Military planning",
    "Other military"
  ];
  const topicSet = new Set(defenseJcsDocuments(report).map(defenseJcsTopic));
  const topics = topicOrder.filter((topic) => topic === "All" || topicSet.has(topic));
  const sources = ["All", ...new Set(defenseJcsDocuments(report).map(defenseJcsSourceLabel).filter(Boolean).sort())];
  if (!topics.includes(state.defenseJcsTopic)) state.defenseJcsTopic = "All";
  if (!sources.includes(state.defenseJcsSource)) state.defenseJcsSource = "All";

  renderSelect(nodes.defenseJcsTopic, topics, state.defenseJcsTopic, (value) => {
    state.defenseJcsTopic = value;
    renderDefenseJcsDocuments(report);
  });
  renderSelect(nodes.defenseJcsSource, sources, state.defenseJcsSource, (value) => {
    state.defenseJcsSource = value;
    renderDefenseJcsDocuments(report);
  });
}

function renderDefenseJcsDocuments(report = {}) {
  const records = filteredDefenseJcsDocuments(report);
  const total = defenseJcsDocuments(report).length;
  nodes.defenseJcsReferenceSummary.textContent = `Showing ${formatNumber(records.length)} of ${formatNumber(
    total
  )} Defense/JCS and military-implementation leads.`;
  nodes.defenseJcsReferencesRoot.replaceChildren();

  if (!records.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No Defense/JCS leads match the current filters.";
    row.append(cell);
    nodes.defenseJcsReferencesRoot.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = record.date || record.sortDate || "Date pending";

    const leadCell = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = record.title || "Untitled military lead";
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [record.kind, record.identifier, pageLabel(record.pageCount)].filter(Boolean).join(" | ");
    leadCell.append(title, meta);

    const topicCell = document.createElement("td");
    const topic = document.createElement("span");
    topic.className = "source-type direct";
    topic.textContent = defenseJcsTopic(record);
    topicCell.append(topic);

    const sourceCell = document.createElement("td");
    const source = document.createElement("strong");
    source.textContent = defenseJcsSourceLabel(record);
    const provenance = document.createElement("p");
    provenance.className = "queue-record-meta";
    provenance.textContent = record.sourceNoteDraft || "Source-note draft pending.";
    sourceCell.append(source, provenance);

    const linkCell = document.createElement("td");
    const links = document.createElement("div");
    links.className = "queue-link-list";
    for (const [label, url] of [
      ["Open PDF", record.pdfUrl],
      ["Open record", record.itemUrl],
      ["Original file", record.originalFile]
    ]) {
      if (!url) continue;
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = url;
      link.rel = "noreferrer";
      link.textContent = label;
      links.append(link);
    }
    linkCell.append(links);

    row.append(dateCell, leadCell, topicCell, sourceCell, linkCell);
    nodes.defenseJcsReferencesRoot.append(row);
  }
}

function exportDefenseJcsDocuments(report = {}) {
  const fields = [
    "date",
    "title",
    "topic",
    "sourceFamily",
    "kind",
    "identifier",
    "pageCount",
    "pdfUrl",
    "recordUrl",
    "originalFile",
    "sourceNoteDraft",
    "compilerUse"
  ];
  const rows = filteredDefenseJcsDocuments(report).map((record) => [
    record.date || record.sortDate,
    record.title,
    defenseJcsTopic(record),
    defenseJcsSourceLabel(record),
    record.kind,
    record.identifier,
    record.pageCount,
    record.pdfUrl,
    record.itemUrl,
    record.originalFile,
    record.sourceNoteDraft,
    record.compilerUse
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-defense-jcs-review-queue.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function renderDefenseJcsQueue(report = {}) {
  if (!report || !nodes.defenseJcsSummaryRoot) return;
  renderDefenseJcsSummary(report);
  renderDefenseJcsFilters(report);
  renderDefenseJcsDocuments(report);
}

function naraCrosscheckDocuments(report = {}) {
  return (report.potentialDocuments || []).slice();
}

function naraCrosscheckSourceLabel(record = {}) {
  return record.sourceFamilyLabel || record.sourceFamily || record.repository || "NARA source family";
}

function naraCrosscheckYear(record = {}) {
  const year = String(record.sortDate || "").slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "Date pending";
}

function naraCrosscheckReviewAction(record = {}) {
  const certainty = record.dateCertainty ? `date from ${record.dateCertainty}` : "date basis pending";
  const pages = pageLabel(record.pageCount);
  const confidence = record.confidence ? `${sentenceCase(record.confidence)} confidence` : "Confidence pending";
  return `${confidence}; ${certainty}; ${pages}. Verify document boundary inside the PDF, duplicate status against the chronology and other queues, classification and release markings, distribution, annotations, attachments, excisions, and exact FRUS source-note wording before promotion.`;
}

function naraCrosscheckText(record = {}) {
  return [
    record.title,
    record.kind,
    record.date,
    record.sortDate,
    record.identifier,
    record.naid,
    record.originalFile,
    record.repository,
    naraCrosscheckSourceLabel(record),
    record.sourceSeries,
    record.category,
    record.confidence,
    record.sourceNoteDraft,
    record.compilerUse,
    ...(record.sections || []),
    ...(record.otherTitles || []),
    ...((record.targets || []).map((target) => [target.staff, target.folderTitle, target.relationship, target.naid].join(" ")))
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filteredNaraCrosscheckDocuments(report = {}) {
  return naraCrosscheckDocuments(report)
    .filter((record) => state.naraCrosscheckSource === "All" || naraCrosscheckSourceLabel(record) === state.naraCrosscheckSource)
    .filter((record) => state.naraCrosscheckYear === "All" || naraCrosscheckYear(record) === state.naraCrosscheckYear)
    .filter(
      (record) =>
        !state.naraCrosscheckSearch || naraCrosscheckText(record).includes(state.naraCrosscheckSearch.toLowerCase())
    )
    .sort((a, b) => {
      return (
        String(a.sortDate || "9999").localeCompare(String(b.sortDate || "9999")) ||
        naraCrosscheckSourceLabel(a).localeCompare(naraCrosscheckSourceLabel(b)) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function renderNaraCrosscheckSummary(report = {}) {
  const summary = report.summary || {};
  const records = naraCrosscheckDocuments(report);
  const pages = records.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const families = groupCounts(records, naraCrosscheckSourceLabel).sort((a, b) => a.label.localeCompare(b.label));
  const skipped = summary.skipped ? Object.values(summary.skipped).reduce((sum, value) => sum + (value || 0), 0) : 0;
  const highConfidence = records.filter((record) => String(record.confidence || "").toLowerCase() === "high").length;
  const dated = records.filter((record) => record.sortDate).length;

  nodes.naraCrosscheckSummaryRoot.replaceChildren(
    auditCard(
      "Potential Leads",
      formatNumber(records.length || summary.addedPotentialDocuments),
      families.map((family) => `${formatNumber(family.count)} ${family.label}`).join("; "),
      "Candidate source-family layer only; not a volume selection list."
    ),
    auditCard(
      "Counted Pages",
      formatNumber(pages || summary.countedPages),
      `${formatNumber(summary.inputCandidates)} source-family candidates screened; ${formatNumber(skipped)} skipped as outside scope, duplicate, outside 1993-1995, or JPG-only.`,
      "Open each PDF before promotion to confirm the internal document boundary."
    ),
    auditCard(
      "Review Readiness",
      formatNumber(highConfidence),
      `${formatNumber(dated)} leads have sortable dates; all retained leads still need classification, handling, annotations, attachments, and excision checks.`,
      "Use this queue to find review work, not to decide inclusion."
    )
  );
}

function renderNaraCrosscheckFilters(report = {}) {
  const documents = naraCrosscheckDocuments(report);
  const sources = ["All", ...new Set(documents.map(naraCrosscheckSourceLabel).filter(Boolean).sort())];
  const years = ["All", ...new Set(documents.map(naraCrosscheckYear).filter(Boolean).sort())];
  if (!sources.includes(state.naraCrosscheckSource)) state.naraCrosscheckSource = "All";
  if (!years.includes(state.naraCrosscheckYear)) state.naraCrosscheckYear = "All";

  renderSelect(nodes.naraCrosscheckSource, sources, state.naraCrosscheckSource, (value) => {
    state.naraCrosscheckSource = value;
    renderNaraCrosscheckDocuments(report);
  });
  renderSelect(nodes.naraCrosscheckYear, years, state.naraCrosscheckYear, (value) => {
    state.naraCrosscheckYear = value;
    renderNaraCrosscheckDocuments(report);
  });
}

function renderNaraCrosscheckDocuments(report = {}) {
  const records = filteredNaraCrosscheckDocuments(report);
  const total = naraCrosscheckDocuments(report).length;
  nodes.naraCrosscheckReferenceSummary.textContent = `Showing ${formatNumber(records.length)} of ${formatNumber(
    total
  )} NARA source-family digitized leads.`;
  nodes.naraCrosscheckReferencesRoot.replaceChildren();

  if (!records.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No NARA source-family leads match the current filters.";
    row.append(cell);
    nodes.naraCrosscheckReferencesRoot.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = record.date || record.sortDate || "Date pending";

    const leadCell = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = record.title || "Untitled NARA source-family lead";
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [record.kind, record.identifier, pageLabel(record.pageCount), record.originalFile]
      .filter(Boolean)
      .join(" | ");
    leadCell.append(title, meta);

    const sourceCell = document.createElement("td");
    const source = document.createElement("span");
    source.className = "source-type collection";
    source.textContent = naraCrosscheckSourceLabel(record);
    const series = document.createElement("p");
    series.className = "queue-record-meta";
    series.textContent = record.sourceSeries || record.repository || "Source series pending.";
    sourceCell.append(source, series);

    const reviewCell = document.createElement("td");
    const action = document.createElement("p");
    action.className = "queue-record-meta";
    action.textContent = naraCrosscheckReviewAction(record);
    const compilerUse = document.createElement("p");
    compilerUse.className = "queue-record-meta";
    compilerUse.textContent = record.compilerUse || "";
    reviewCell.append(action, compilerUse);

    const linkCell = document.createElement("td");
    const links = document.createElement("div");
    links.className = "queue-link-list";
    for (const [label, url] of [
      ["Open PDF", record.pdfUrl],
      ["Open catalog record", record.itemUrl]
    ]) {
      if (!url) continue;
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = url;
      link.rel = "noreferrer";
      link.textContent = label;
      links.append(link);
    }
    const note = document.createElement("p");
    note.className = "queue-record-meta";
    note.textContent = record.sourceNoteDraft || "Source-note draft pending.";
    linkCell.append(links, note);

    row.append(dateCell, leadCell, sourceCell, reviewCell, linkCell);
    nodes.naraCrosscheckReferencesRoot.append(row);
  }
}

function exportNaraCrosscheckDocuments(report = {}) {
  const fields = [
    "date",
    "sortDate",
    "title",
    "sourceFamily",
    "sourceSeries",
    "identifier",
    "naid",
    "confidence",
    "dateCertainty",
    "pageCount",
    "pageCountStatus",
    "pdfUrl",
    "catalogUrl",
    "originalFile",
    "sourceNoteDraft",
    "compilerReview",
    "compilerUse"
  ];
  const rows = filteredNaraCrosscheckDocuments(report).map((record) => [
    record.date,
    record.sortDate,
    record.title,
    naraCrosscheckSourceLabel(record),
    record.sourceSeries,
    record.identifier,
    record.naid,
    record.confidence,
    record.dateCertainty,
    record.pageCount,
    record.pageCountStatus,
    record.pdfUrl,
    record.itemUrl,
    record.originalFile,
    record.sourceNoteDraft,
    naraCrosscheckReviewAction(record),
    record.compilerUse
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-nara-source-family-crosscheck-queue.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function renderNaraCrosscheckQueue(report = {}) {
  if (!report || !nodes.naraCrosscheckSummaryRoot) return;
  renderNaraCrosscheckSummary(report);
  renderNaraCrosscheckFilters(report);
  renderNaraCrosscheckDocuments(report);
}

function libraryTargets(report = {}) {
  return [...(report.pullTargets || []), ...(report.followOnTargets || [])];
}

function libraryPriorityMatch(target) {
  if (state.libraryPriority === "All") return true;
  if (state.libraryPriority === "Critical + High") return ["Critical", "High"].includes(target.priority);
  return target.priority === state.libraryPriority;
}

function libraryTextMatch(target) {
  if (!state.librarySearch) return true;
  const haystack = [
    target.priority,
    target.chronologyScope,
    target.oaBox,
    target.folderTitle,
    target.staffOrOffice,
    target.findingAidPart,
    target.findingAidPdf,
    target.findingAidPage,
    target.category,
    target.reason,
    target.onsiteAction,
    target.sourceNoteLead
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.librarySearch.toLowerCase());
}

function filteredLibraryTargets(report = {}) {
  return libraryTargets(report)
    .filter(libraryPriorityMatch)
    .filter(libraryTextMatch)
    .sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, "Follow-on": 3 };
      return (
        (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
        b.score - a.score ||
        (a.dateGuess || "9999").localeCompare(b.dateGuess || "9999") ||
        String(a.oaBox).localeCompare(String(b.oaBox)) ||
        a.folderTitle.localeCompare(b.folderTitle)
      );
    });
}

function renderLibrarySummary(report = {}) {
  const summary = report.summary || {};
  nodes.librarySummaryRoot.replaceChildren(
    auditCard(
      "Finding Aid Pages",
      formatNumber(summary.findingAidPages),
      `${formatNumber(summary.findingAidCount)} Clinton Library PDF finding aids processed from 2013-0185-M.`,
      `${formatNumber(summary.rawBalkansLineHits)} raw Balkans line hits kept for scoring.`
    ),
    auditCard(
      "Priority Pulls",
      formatNumber(summary.priorityPullTargets),
      `${formatNumber(summary.critical)} critical, ${formatNumber(summary.high)} high, and ${formatNumber(summary.medium)} medium folder targets.`,
      `${formatNumber(summary.callSlipBatches)} OA/ID call-slip batches.`
    ),
    auditCard(
      "Decision Process",
      formatNumber((summary.soderbergPcDcTargets || 0) + (summary.recordsManagementPcDcTargets || 0)),
      `${formatNumber(summary.soderbergPcDcTargets)} Soderberg PC/DC note targets and ${formatNumber(summary.recordsManagementPcDcTargets)} Records Management PC/DC targets.`,
      "Use these to test the committee chronology before broader subject pulls."
    ),
    auditCard(
      "Conversation Leads",
      formatNumber(summary.presidentialConversationFolderTargets),
      "POTUS memcon/telcon and foreign-leader-call folders remain separated from the selected chronology.",
      "Verify duplicates, restrictions, and source-note metadata onsite."
    ),
    auditCard(
      "Mission Boundary",
      "Onsite",
      "The plan ranks folder pulls to save Clinton Library time; it does not select documents for the FRUS volume.",
      report.sourceNoteStandard || "Folder-level provenance requires onsite verification."
    )
  );
}

function renderLibraryVisitPlan(report = {}) {
  const heading = document.createElement("h3");
  heading.textContent = "First-Day Pull Sequence";
  const list = document.createElement("div");
  list.className = "research-tier-list";

  for (const item of report.visitPlan || []) {
    const row = document.createElement("div");
    row.className = "research-tier-row";
    const label = document.createElement("strong");
    label.textContent = `${item.rank}. ${item.timeBlock}: ${item.objective}`;
    const detail = document.createElement("span");
    detail.textContent = `OA/ID ${item.callSlips.join(", ")} | ${formatNumber(item.targetCount)} priority targets. ${item.action}`;
    row.append(label, detail);
    list.append(row);
  }

  nodes.libraryPlanRoot.replaceChildren(heading, list);
}

function renderLibraryCallSlips(report = {}) {
  const heading = document.createElement("h3");
  heading.textContent = "Top Call-Slip Batches";
  const list = document.createElement("div");
  list.className = "research-supplemental-list";

  for (const batch of (report.callSlipBatches || []).slice(0, 18)) {
    const row = document.createElement("div");
    row.className = "research-supplemental-row";
    const label = document.createElement("strong");
    label.textContent = `${batch.rank}. OA/ID ${batch.oaBox} | ${batch.staffOrOffice || "folder list"}`;
    const detail = document.createElement("span");
    const samples = (batch.sampleFolders || []).slice(0, 3).join(" | ");
    detail.textContent = `${formatNumber(batch.targetCount)} targets: ${formatNumber(batch.priorities?.Critical)} critical, ${formatNumber(batch.priorities?.High)} high, ${formatNumber(batch.priorities?.Medium)} medium. ${samples}`;
    row.append(label, detail);
    list.append(row);
  }

  nodes.libraryCallslipsRoot.replaceChildren(heading, list);
}

function renderLibraryPriorityFilters(report = {}) {
  const priorities = ["Critical + High", "Critical", "High", "Medium", "Follow-on", "All"].filter(
    (priority) => priority === "Critical + High" || priority === "All" || libraryTargets(report).some((target) => target.priority === priority)
  );

  renderButtonGroup(nodes.libraryPriorityFilters, priorities, state.libraryPriority, (value) => {
    state.libraryPriority = value;
    renderLibraryPriorityFilters(report);
    renderLibraryTargets(report);
  });
}

function renderLibraryTargets(report = {}) {
  const targets = filteredLibraryTargets(report);
  const totalTargets = libraryTargets(report).length;
  nodes.libraryTargetSummary.textContent = `Showing ${formatNumber(targets.length)} of ${formatNumber(
    totalTargets
  )} Clinton Library finding-aid targets.`;
  nodes.libraryTargetsRoot.replaceChildren();

  if (!targets.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "No Clinton Library pull targets match the current filters.";
    row.append(cell);
    nodes.libraryTargetsRoot.append(row);
    return;
  }

  for (const target of targets) {
    const row = document.createElement("tr");
    const values = [
      `${target.priority}${target.chronologyScope ? ` / ${target.chronologyScope}` : ""}`,
      target.oaBox,
      target.folderTitle,
      target.staffOrOffice || "folder list",
      `${target.findingAidPart}, p. ${target.findingAidPage}`,
      target.onsiteAction
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    nodes.libraryTargetsRoot.append(row);
  }
}

function exportLibraryTargets(report = {}) {
  const fields = [
    "priority",
    "chronologyScope",
    "score",
    "oaBox",
    "folderTitle",
    "staffOrOffice",
    "category",
    "findingAidPart",
    "findingAidPdf",
    "findingAidPage",
    "findingAidLine",
    "dateGuess",
    "reason",
    "onsiteAction",
    "sourceNoteLead"
  ];
  const rows = filteredLibraryTargets(report).map((target) => fields.map((field) => target[field] || ""));
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "balkans-93-95-clinton-library-pull-targets.csv";
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function renderClintonLibraryVisit(report) {
  if (!report) {
    nodes.librarySummaryRoot.replaceChildren(
      auditCard("Clinton Library", "Pending", "The onsite finding-aid visit plan has not loaded.", "")
    );
    return;
  }

  renderLibrarySummary(report);
  renderLibraryVisitPlan(report);
  renderLibraryCallSlips(report);
  renderLibraryPriorityFilters(report);
  renderLibraryTargets(report);
}

function methodCard(title, status, detail, measure) {
  const card = document.createElement("article");
  card.className = "frus-method-card";

  const top = document.createElement("div");
  top.className = "method-card-top";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const badge = document.createElement("span");
  badge.className = `readiness-status ${status.toLowerCase().replace(/\s+/g, "-")}`;
  badge.textContent = status;
  top.append(heading, badge);

  const body = document.createElement("p");
  body.textContent = detail;

  const foot = document.createElement("p");
  foot.className = "audit-meta";
  foot.textContent = measure;

  card.append(top, body, foot);
  return card;
}

function readinessRow(label, status, count, detail) {
  const row = document.createElement("div");
  row.className = "readiness-row";

  const labelWrap = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = label;
  const note = document.createElement("p");
  note.textContent = detail;
  labelWrap.append(name, note);

  const countItem = document.createElement("span");
  countItem.className = "readiness-count";
  countItem.textContent = count;

  const statusItem = document.createElement("span");
  statusItem.className = `readiness-status ${status.toLowerCase().replace(/\s+/g, "-")}`;
  statusItem.textContent = status;

  row.append(labelWrap, countItem, statusItem);
  return row;
}

function renderFrusMethod(data, reports = {}) {
  const documents = conversationRecords(data);
  const conversations = conversationSubsetRecords(data);
  const direct = documents.filter(isDirectPdf);
  const extracted = documents.filter(isExtractedDocument);
  const sourceNotes = documents.filter((record) => record.sourceNote);
  const sourceRanges = documents.filter((record) => record.sourcePdfPages);
  const inferredDates = documents.filter((record) => record.dateCertainty === "inferred");
  const dateYears = groupCounts(documents, (record) => (record.sortDate || "").slice(0, 4)).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  const dateMeasure = dateYears.map((item) => `${item.label}: ${item.count}`).join(" / ");

  nodes.frusMethodRoot.replaceChildren(
    methodCard(
      "Mission Boundary",
      "Set",
      "This page is not a proposed FRUS selection list and does not suggest how the volume should be structured.",
      "It inventories declassified and public U.S. records for chronological consideration by the compiler."
    ),
    methodCard(
      "Chronological Inventory",
      "Ready",
      "Records are ordered by document date, not by release packet or item discovery order; inferred dates are labeled.",
      dateMeasure
    ),
    methodCard(
      "Source Note Drafts",
      "Partial",
      "Each card starts its draft note in FRUS order: repository, collection/control number, record locator, PDF source pages, then original-document metadata to verify.",
      `${sourceNotes.length}/${documents.length} draft source notes; ${sourceRanges.length}/${documents.length} source page ranges.`
    ),
    methodCard(
      "Declassification Accounting",
      "Partial",
      "Packet PDFs are reduced to the pages of each memo or record, with the packet first page appended as an annotation sheet; public statements retain GovInfo source pagination.",
      `${sumPages(documents)} counted pages; ${direct.length} direct PDFs; ${extracted.length} extracted PDFs; ${inferredDates.length} inferred-date records; ${conversations.length} memcon/telcon records.`
    )
  );

  renderReadinessPanel(data);
  renderSourceNotePanel(data);
  renderSourceNoteQueue(data, reports);
}

function renderReadinessPanel(data) {
  const documents = conversationRecords(data);
  const withPdfs = documents.filter((record) => record.pdfUrl);
  const withDates = documents.filter((record) => record.sortDate);
  const withPages = documents.filter((record) => record.pageCount);
  const withSourceRanges = documents.filter((record) => record.sourcePdfPages);
  const withCompilerUse = documents.filter((record) => record.compilerUse);
  const withAnnotation = documents.filter((record) => isExtractedDocument(record) && record.annotationSheet);
  const anchorSources = data.sources.filter((source) => ["Anchor", "Core"].includes(source.priority));
  const publicStatements = documents.filter((record) => record.documentScope === "Public statement");

  const heading = document.createElement("h3");
  heading.textContent = "Inventory Readiness";
  const list = document.createElement("div");
  list.className = "readiness-list";
  list.append(
    readinessRow(
      "Document-level PDFs",
      withPdfs.length === documents.length ? "Ready" : "Gap",
      `${withPdfs.length}/${documents.length}`,
      "Every listed record should resolve to a direct or extracted PDF."
    ),
    readinessRow(
      "Chronological ordering",
      withDates.length === documents.length ? "Ready" : "Gap",
      `${withDates.length}/${documents.length}`,
      "Records sort by document date; undated records use a labeled best-fit chronology."
    ),
    readinessRow(
      "Page counts and source ranges",
      withPages.length === documents.length && withSourceRanges.length === documents.length ? "Ready" : "Gap",
      `${withPages.length}/${documents.length}`,
      "Supports page accounting, extraction checks, and declassification review notes."
    ),
    readinessRow(
      "Packet annotation sheets",
      withAnnotation.length === documents.filter(isExtractedDocument).length ? "Ready" : "Gap",
      `${withAnnotation.length}/${documents.filter(isExtractedDocument).length}`,
      "Every packet-extracted PDF appends the source packet first page after the document pages."
    ),
    readinessRow(
      "Public Papers metadata",
      publicStatements.length ? "Ready" : "Seeded",
      publicStatements.length.toString(),
      "GovInfo Public Papers records use official source pagination and publication metadata rather than declassification fields."
    ),
    readinessRow(
      "Inventory relevance note",
      withCompilerUse.length === documents.length ? "Ready" : "Partial",
      `${withCompilerUse.length}/${documents.length}`,
      "Each record notes why it is relevant to the chronological inventory, without recommending inclusion."
    ),
    readinessRow(
      "Anchor and core source trails",
      "Seeded",
      `${anchorSources.length}/${data.sources.length}`,
      "Prioritized sources keep the completeness search tied to Clinton Library, NARA, State FOIA, and GovInfo release paths."
    )
  );

  nodes.readinessRoot.replaceChildren(heading, list);
}

function renderSourceNotePanel(data) {
  const documents = conversationRecords(data);
  const locatorReady = documents.filter((record) => record.collection && record.identifier && (record.url || record.pdfUrl)).length;
  const pageReady = documents.filter((record) => record.pageCount && record.sourcePdfPages).length;
  const metadataReady = documents.filter((record) => record.date && record.kind).length;
  const publicStatements = documents.filter((record) => record.documentScope === "Public statement").length;
  const heading = document.createElement("h3");
  heading.textContent = "Source Note Worklist";
  const list = document.createElement("div");
  list.className = "source-note-list";
  list.append(
    readinessRow(
      "Source and locator stem",
      "Ready",
      `${locatorReady}/${documents.length}`,
      "Draft notes begin with repository, collection, control number, and item or NAID in the order used by FRUS source notes."
    ),
    readinessRow(
      "PDF page accounting",
      pageReady === documents.length ? "Ready" : "Partial",
      `${pageReady}/${documents.length}`,
      "The cards preserve source packet pages, counted document pages, annotation sheets, and whether the displayed PDF is direct or locally extracted."
    ),
    readinessRow(
      "Classification / handling controls",
      "Next",
      "PDF/OCR",
      "For declassified records, extract markings from the PDF header or face sheet; Public Papers records instead require GovInfo publication metadata checks."
    ),
    readinessRow(
      "Public Papers publication metadata",
      publicStatements ? "Ready" : "Seeded",
      publicStatements.toString(),
      "GovInfo records carry public title, date, source pagination, and granule locators for the public-statement layer."
    ),
    readinessRow(
      "Drafting / clearance / distribution",
      "Next",
      "PDF/OCR",
      "Record drafter, clearance, approval, distribution, notetaker, sent/received, and read-status lines where the original carries them."
    ),
    readinessRow(
      "Meeting / call metadata",
      "Partial",
      `${metadataReady}/${documents.length}`,
      "Each lead has date and form; for conversations, verify place, exact time, participants, and time zone against the PDF text."
    ),
    readinessRow(
      "Annotations, attachments, excisions",
      "Next",
      "Manual",
      "Add marginalia, attached-but-not-printed tabs, related documents, deletion counts, and wholly withheld cross-references in the final note."
    )
  );

  nodes.sourceNoteRoot.replaceChildren(heading, list);
}

function hasUntranscribedSourceNote(record) {
  return /not yet transcribed/i.test(record.sourceNote || sourceNoteDraft(record) || "");
}

function sourceNoteQueuePriority(record) {
  const haystack = [record.kind, record.documentScope, record.sourceFamilyLabel, record.sourceSeries, record.title].join(" ");
  if (isConversationRecord(record)) return { rank: 1, label: "Conversations" };
  if (/NSC Summary|Principals|Deputies|PC\/DC|P\/DC|PCDC/i.test(haystack)) return { rank: 2, label: "PC/DC" };
  if (/State FOIA|Cable|Dissent|Telegram|Department of State/i.test(haystack)) return { rank: 3, label: "State" };
  if (/Intelligence|CIA|BTF|Balkan Task Force|Estimate/i.test(haystack)) return { rank: 4, label: "Intelligence" };
  if (/Policy|Memorandum|Presidential Memo|Diplomatic Letter|Paper/i.test(haystack)) {
    return { rank: 5, label: "Policy" };
  }
  return { rank: 6, label: "Other" };
}

function sourceNoteQueueAction(record) {
  if (isConversationRecord(record)) {
    return "Transcribe classification and handling markings; verify participants, place, exact time, notetaker, distribution, attachments, excisions, and any related call-log evidence.";
  }
  if (/State FOIA|Cable|Dissent|Telegram|Department of State/i.test([record.kind, record.sourceFamilyLabel, record.title].join(" "))) {
    return "Transcribe classification, channel, cable number, TAGS/SUBJECT, from/to line, distribution, drafting or clearance, attachments, and deletion/excision counts.";
  }
  if (/Intelligence|CIA|BTF|Estimate/i.test([record.documentScope, record.sourceFamilyLabel, record.sourceSeries, record.kind].join(" "))) {
    return "Transcribe classification and handling controls; verify product office, distribution, attachments, excisions, and whether the item duplicates another release.";
  }
  return "Transcribe classification and handling markings; verify drafting, clearance, distribution, annotations, attachments, excisions, and source-page accounting.";
}

function stableChronologyRecordUrl(record) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  if (isPublicPaperRecord(record)) params.set("scope", "Public Papers");
  url.search = params.toString();
  url.hash = `record-${record.id}`;
  return url.toString();
}

function sourceNoteQueueRecords(data) {
  return conversationRecords(data)
    .filter((record) => record.documentScope !== "Public statement")
    .filter(hasUntranscribedSourceNote)
    .sort((a, b) => {
      const priorityA = sourceNoteQueuePriority(a);
      const priorityB = sourceNoteQueuePriority(b);
      return (
        priorityA.rank - priorityB.rank ||
        String(a.sortDate || "").localeCompare(String(b.sortDate || "")) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    });
}

function exportSourceNoteQueue(data) {
  const fields = [
    "priority",
    "date",
    "kind",
    "title",
    "identifier",
    "collection",
    "sourceFamily",
    "pageCount",
    "sourcePdfPages",
    "reviewPdf",
    "recordLink",
    "sourceNoteDraft",
    "compilerCheck"
  ];
  const rows = sourceNoteQueueRecords(data).map((record) => [
    sourceNoteQueuePriority(record).label,
    record.date,
    record.kind,
    record.title,
    record.identifier,
    record.collection,
    record.sourceFamilyLabel || record.sourceFamily,
    record.pageCount,
    record.sourcePdfPages,
    record.pdfUrl,
    stableChronologyRecordUrl(record),
    sourceNoteDraft(record),
    sourceNoteQueueAction(record)
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile("balkans-93-95-source-note-finalization-queue.csv", `${csv}\n`, "text/csv;charset=utf-8");
}

function sourceNoteQueueLinks(record) {
  const links = document.createElement("div");
  links.className = "queue-link-list";

  for (const [label, url] of [
    ["Open record", stableChronologyRecordUrl(record)],
    ["Review PDF", record.pdfUrl],
    ["Source packet", distinctSourcePacketUrl(record)]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  return links;
}

function renderSourceNoteQueue(data, reports = {}) {
  if (!nodes.sourceNoteQueueRoot) return;
  const records = sourceNoteQueueRecords(data);
  const auditTotal = reports.sourceNoteAudit?.summary?.classificationOrHandlingNotTranscribed ?? records.length;
  const byPriority = groupCounts(records, (record) => sourceNoteQueuePriority(record).label)
    .map((item) => `${item.label}: ${formatNumber(item.count)}`)
    .join(" / ");

  const header = document.createElement("div");
  header.className = "source-note-queue-header";
  const copy = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = "Source-Note Finalization Queue";
  const summary = document.createElement("p");
  summary.textContent = `${formatNumber(records.length)} chronology records still require classification/handling transcription before final FRUS source-note clearance. ${auditTotal !== records.length ? `The audit report counts ${formatNumber(auditTotal)} chronology/conversation rows including cross-reference rows. ` : ""}${byPriority}`;
  copy.append(heading, summary);

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "reset-button export-button";
  exportButton.textContent = "Export Queue CSV";
  exportButton.addEventListener("click", () => exportSourceNoteQueue(data));
  header.append(copy, exportButton);

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap source-note-queue-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th scope="col">Priority</th>
      <th scope="col">Date</th>
      <th scope="col">Record</th>
      <th scope="col">Source-note work</th>
      <th scope="col">Links</th>
    </tr>
  `;
  const tbody = document.createElement("tbody");

  for (const record of records) {
    const priority = sourceNoteQueuePriority(record);
    const row = document.createElement("tr");

    const priorityCell = document.createElement("td");
    priorityCell.textContent = priority.label;

    const dateCell = document.createElement("td");
    dateCell.textContent = record.date || "Date pending";

    const recordCell = document.createElement("td");
    const title = document.createElement("a");
    title.href = stableChronologyRecordUrl(record);
    title.textContent = record.title;
    title.className = "queue-record-title";
    const meta = document.createElement("p");
    meta.className = "queue-record-meta";
    meta.textContent = [record.kind, record.identifier, record.collection, pageLabel(record.pageCount)].filter(Boolean).join(" | ");
    recordCell.append(title, meta);

    const actionCell = document.createElement("td");
    actionCell.textContent = sourceNoteQueueAction(record);

    const linkCell = document.createElement("td");
    linkCell.append(sourceNoteQueueLinks(record));

    row.append(priorityCell, dateCell, recordCell, actionCell, linkCell);
    tbody.append(row);
  }

  table.append(thead, tbody);
  tableWrap.append(table);
  nodes.sourceNoteQueueRoot.replaceChildren(header, tableWrap);
}

function researchFiles(report = {}) {
  return [
    ...(report.digitizedFiles || []),
    ...(report.sourceCrosscheckFiles || []),
    ...(report.stateFoiaFiles || []),
    ...(report.btfFiles || []),
    ...(report.presidentialDailyDiaryFiles || [])
  ];
}

function relationshipLabel(value = "") {
  const labels = {
    "exact-folder-title": "Folder-title match",
    "strong-subject-match": "Subject lead",
    "regional-topic-match": "Regional lead",
    "topic-match": "Topic lead",
    "nara-catalog-7388808": "NARA 7388808 cross-check",
    "nara-scout-europe-scopes": "NARA Scout cross-check",
    "state-foia-virtual-reading-room": "State FOIA candidate",
    "cia-btf-document-level": "CIA/BTF document",
    "presidential-daily-diary-reference": "Presidential Daily Diary reference"
  };
  return labels[value] || value || "Unclassified";
}

function firstResearchTarget(file) {
  return (file.targets && file.targets[0]) || {};
}

function researchFileTextMatch(file) {
  if (!state.researchSearch) return true;
  const targets = (file.targets || [])
    .map((target) => [target.rank, target.oaBox, target.folderTitle, target.staff, target.tier, target.relationship].join(" "))
    .join(" ");
  const haystack = [
    file.title,
    file.originalFile,
    file.sourceNoteDraft,
    file.itemUrl,
    file.pdfUrl,
    file.identifier,
    file.sourceFamily,
    file.from,
    file.to,
    file.messageNumber,
    (file.matchedQueries || []).join(" "),
    targets
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(state.researchSearch.toLowerCase());
}

function filteredResearchFiles(report = {}) {
  return researchFiles(report)
    .filter((file) => {
      if (state.researchRelationship === "All") return true;
      return (file.targets || []).some((target) => relationshipLabel(target.relationship) === state.researchRelationship);
    })
    .filter(researchFileTextMatch)
    .sort((a, b) => {
      const targetA = firstResearchTarget(a);
      const targetB = firstResearchTarget(b);
      return (
        (targetA.rank || 9999) - (targetB.rank || 9999) ||
        b.score - a.score ||
        a.title.localeCompare(b.title)
      );
    });
}

function researchTargetsWithFiles(report = {}) {
  const fileById = new Map(researchFiles(report).map((file) => [file.id, file]));
  return (report.rankedTargets || []).map((target) => ({
    ...target,
    files: (target.selectedFileIds || []).map((id) => fileById.get(id)).filter(Boolean)
  }));
}

function renderResearchSummary(report = {}) {
  const summary = report.summary || {};
  const sourceCrosscheck = report.sourceCrosscheckSummary || {};
  const stateFoia = report.stateFoiaSummary || {};
  const btf = report.btfSummary || {};
  const presidentialDailyDiary = report.presidentialDailyDiarySummary || {};
  const exactFiles = researchFiles(report).filter((file) =>
    (file.targets || []).some((target) => target.relationship === "exact-folder-title")
  ).length;
  const totalFiles = researchFiles(report).length;
  const totalPages = researchFiles(report).reduce((sum, file) => sum + (file.pageCount || 0), 0);
  const baseFiles = summary.uniqueDigitizedFiles || (report.digitizedFiles || []).length;
  const basePages = summary.countedPages || (report.digitizedFiles || []).reduce((sum, file) => sum + (file.pageCount || 0), 0);
  const crosscheckFiles = sourceCrosscheck.addedPotentialDocuments || 0;
  const crosscheckPages = sourceCrosscheck.countedPages || 0;
  const stateFoiaFiles = stateFoia.selectedCandidateDocuments || 0;
  const stateFoiaPages = stateFoia.countedPages || 0;
  const btfFiles = btf.inPeriodDocuments || 0;
  const btfPages = btf.countedPages || 0;
  const pddFiles = presidentialDailyDiary.selectedReferences || 0;
  const pddPages = pddFiles;

  nodes.researchSummaryRoot.replaceChildren(
    auditCard(
      "Collection Targets",
      formatNumber(summary.rankedFolderTargets),
      `${formatNumber(summary.supplementalTargets)} supplemental collection leads from the research plan were searched alongside the ranked folders.`,
      report.collection || "NSC European Affairs, Clinton Presidential Records, 2013-0185-M"
    ),
    auditCard(
      "Digitized Files",
      formatNumber(totalFiles),
      `${formatNumber(baseFiles)} Clinton Digital Library research-plan leads, ${formatNumber(crosscheckFiles)} NARA source-family potential documents, ${formatNumber(stateFoiaFiles)} State FOIA candidates, ${formatNumber(btfFiles)} CIA/BTF documents, and ${formatNumber(pddFiles)} Presidential Daily Diary references.`,
      `${formatNumber(exactFiles)} files have folder-title matches.`
    ),
    auditCard(
      "Page Accounting",
      formatNumber(totalPages),
      `${formatNumber(basePages)} pages counted from the Clinton Digital Library sweep; ${formatNumber(crosscheckPages)} from NARA source-family leads; ${formatNumber(stateFoiaPages)} from State FOIA candidates; ${formatNumber(btfPages)} from CIA/BTF documents; ${formatNumber(pddPages)} source-image references from the Presidential Daily Diary.`,
      "Large folder PDFs and source-family leads are kept as research leads, not converted into chronology entries here."
    ),
    auditCard(
      "Source Check",
      formatNumber(crosscheckFiles + stateFoiaFiles + btfFiles + pddFiles),
      "Checked companion-page NARA source families, the Department of State FOIA Virtual Reading Room, the Clinton Library Bosnian Declassified Records collection, and the Presidential Daily Diary for in-period Balkans PDF/image leads.",
      "Research leads and document-level harvests only; this does not recommend inclusion or volume structure."
    ),
    auditCard(
      "Mission Boundary",
      "Separate",
      "This section maps research collections and online files. It does not recommend inclusion or impose the structure of the FRUS volume.",
      "The chronological document list remains a separate review surface."
    )
  );
}

function renderResearchTiers(report = {}) {
  const targets = researchTargetsWithFiles(report);
  const byTier = new Map(
    (report.tiers || []).map((tier) => [tier.id, { ...tier, targets: [], pages: 0, files: 0, seenFiles: new Set() }])
  );
  for (const target of targets) {
    const item = byTier.get(target.tierId);
    if (!item) continue;
    item.targets.push(target);
    for (const file of target.files) {
      if (item.seenFiles.has(file.id)) continue;
      item.seenFiles.add(file.id);
      item.files += 1;
      item.pages += file.pageCount || 0;
    }
  }

  const tierHeading = document.createElement("h3");
  tierHeading.textContent = "Ranked Collection Tiers";
  const tierList = document.createElement("div");
  tierList.className = "research-tier-list";

  for (const tier of byTier.values()) {
    const matched = tier.targets.filter((target) => target.files.length).length;
    const row = document.createElement("div");
    row.className = "research-tier-row";
    const label = document.createElement("strong");
    label.textContent = `Tier ${tier.number}: ${tier.title}`;
    const detail = document.createElement("span");
    detail.textContent = `${formatNumber(matched)}/${formatNumber(tier.targets.length)} targets with digitized files | ${formatNumber(tier.files)} files | ${formatNumber(tier.pages)} pages`;
    row.append(label, detail);
    tierList.append(row);
  }

  nodes.researchTierRoot.replaceChildren(tierHeading, tierList);
}

function renderResearchSupplemental(report = {}) {
  const heading = document.createElement("h3");
  heading.textContent = "Supplemental Collection Leads";
  const list = document.createElement("div");
  list.className = "research-supplemental-list";

  for (const item of report.supplementalTargets || []) {
    const row = document.createElement("div");
    row.className = "research-supplemental-row";
    const title = document.createElement("strong");
    title.textContent = item.label;
    const detail = document.createElement("span");
    detail.textContent = `${formatNumber(item.selectedFileCount)} selected files from ${formatNumber(item.pdfHitCount)} PDF search hits. ${item.note || ""}`;
    row.append(title, detail);
    list.append(row);
  }

  nodes.researchSupplementalRoot.replaceChildren(heading, list);
}

function renderResearchRelationshipFilters(report = {}) {
  const relationships = [
    "All",
    ...new Set(
      researchFiles(report)
        .flatMap((file) => (file.targets || []).map((target) => relationshipLabel(target.relationship)))
        .filter(Boolean)
        .sort()
    )
  ];

  renderButtonGroup(nodes.researchRelationshipFilters, relationships, state.researchRelationship, (value) => {
    state.researchRelationship = value;
    renderResearchRelationshipFilters(report);
    renderResearchFiles(report);
  });
}

function createResearchLinks(file) {
  const links = document.createElement("div");
  links.className = "conversation-links research-links";

  for (const [label, url] of [
    [isDirectPdf(file) ? "Open PDF" : "Open source", file.pdfUrl],
    ["Open record", file.itemUrl]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  return links;
}

function renderResearchFiles(report = {}) {
  const files = filteredResearchFiles(report);
  nodes.researchFilesRoot.replaceChildren();
  nodes.researchFileSummary.textContent = `Showing ${formatNumber(files.length)} of ${formatNumber(
    researchFiles(report).length
  )} digitized file leads, ${formatNumber(files.reduce((sum, file) => sum + (file.pageCount || 0), 0))} counted pages.`;

  if (!files.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No research collection files match the current filters.";
    nodes.researchFilesRoot.append(empty);
    return;
  }

  for (const file of files) {
    const target = firstResearchTarget(file);
    const card = document.createElement("article");
    card.className = "research-file-card";

    const body = document.createElement("div");
    const top = document.createElement("div");
    top.className = "conversation-top";
    const heading = document.createElement("h3");
    heading.textContent = file.title;
    const badges = document.createElement("div");
    badges.className = "conversation-badges";
    const relationship = document.createElement("span");
    relationship.className = "source-type collection";
    relationship.textContent = relationshipLabel(target.relationship);
    const confidence = document.createElement("span");
    confidence.className = `source-type ${file.confidence === "high" ? "direct" : "packet"}`;
    confidence.textContent = `${file.confidence || "unscored"} confidence`;
    badges.append(relationship, confidence);
    top.append(heading, badges);

    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [
      target.rank ? `Rank ${target.rank}` : target.type,
      file.date ? `Date ${file.date}` : "",
      file.identifier || "",
      target.oaBox ? `OA/box ${target.oaBox}` : "",
      target.staff,
      pageLabel(file.pageCount),
      target.folderTitle
    ]
      .filter(Boolean)
      .join(" | ");

    const sourceNote = document.createElement("details");
    sourceNote.className = "source-note-details";
    const summary = document.createElement("summary");
    summary.textContent = "FRUS-style provenance lead";
    const note = document.createElement("p");
    note.className = "source-note-draft";
    note.textContent = file.sourceNoteDraft || "Provenance lead pending.";
    sourceNote.append(summary, note);

    const original = document.createElement("p");
    original.className = "conversation-provenance";
    original.textContent = file.originalFile ? `Library file path/title: ${file.originalFile}` : "";

    body.append(top, meta, sourceNote);
    if (original.textContent) body.append(original);
    card.append(body, createResearchLinks(file));
    nodes.researchFilesRoot.append(card);
  }
}

function renderResearchTargets(report = {}) {
  nodes.researchTargetsRoot.replaceChildren();
  for (const target of researchTargetsWithFiles(report)) {
    const row = document.createElement("tr");
    const values = [
      target.rank,
      target.oaBox,
      target.folderTitle,
      target.staff,
      target.files.length
        ? `${formatNumber(target.files.length)} files / ${formatNumber(target.files.reduce((sum, file) => sum + (file.pageCount || 0), 0))} pages`
        : `${formatNumber(target.pdfHitCount)} PDF hits; no selected declassified in-period file`,
      target.files
        .slice(0, 3)
        .map((file) => file.title)
        .join(" | ")
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    nodes.researchTargetsRoot.append(row);
  }
}

function exportResearchFiles(report = {}) {
  const fields = [
    "title",
    "pageCount",
    "confidence",
    "date",
    "identifier",
    "sourceFamily",
    "relationship",
    "rank",
    "oaBox",
    "folderTarget",
    "staff",
    "itemUrl",
    "pdfUrl",
    "originalFile",
    "sourceNoteDraft"
  ];
  const rows = filteredResearchFiles(report).map((file) => {
    const target = firstResearchTarget(file);
    return [
      file.title,
      file.pageCount || "",
      file.confidence || "",
      file.date || "",
      file.identifier || "",
      file.sourceFamily || "",
      relationshipLabel(target.relationship),
      target.rank || "",
      target.oaBox || "",
      target.folderTitle || "",
      target.staff || "",
      file.itemUrl,
      file.pdfUrl,
      file.originalFile,
      file.sourceNoteDraft
    ];
  });
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "balkans-93-95-research-collection-files.csv";
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function renderResearchCollections(report) {
  if (!report) {
    nodes.researchSummaryRoot.replaceChildren(
      auditCard("Research Collections", "Pending", "The online research collection report has not loaded.", "")
    );
    return;
  }

  renderResearchSummary(report);
  renderResearchTiers(report);
  renderResearchSupplemental(report);
  renderResearchRelationshipFilters(report);
  renderResearchFiles(report);
  renderResearchTargets(report);
}

function combineResearchReports(researchCollections, sourceCrosscheck, stateFoia, btfDocuments, presidentialDailyDiary) {
  if (!researchCollections) return null;
  return {
    ...researchCollections,
    sourceCrosscheck,
    sourceCrosscheckSummary: sourceCrosscheck?.summary || null,
    sourceCrosscheckFiles: sourceCrosscheck?.potentialDocuments || [],
    stateFoia,
    stateFoiaSummary: stateFoia?.summary || null,
    stateFoiaFiles: stateFoia?.stateFoiaDocuments || [],
    btfDocuments,
    btfSummary: btfDocuments?.summary || null,
    btfFiles: btfDocuments?.documents || [],
    presidentialDailyDiary,
    presidentialDailyDiarySummary: presidentialDailyDiary?.summary || null,
    presidentialDailyDiaryFiles: presidentialDailyDiary?.researchLeads || []
  };
}

function byDateThenType(a, b) {
  return (a.sortDate || "").localeCompare(b.sortDate || "") || a.title.localeCompare(b.title);
}

function pageLabel(pageCount) {
  if (!pageCount) return "Pages pending";
  return pageCount === 1 ? "1 page" : `${pageCount} pages`;
}

function distinctSourcePacketUrl(record) {
  if (!record.sourcePdfUrl || record.sourcePdfUrl === record.pdfUrl) return "";
  return record.sourcePdfUrl;
}

const DEFAULT_CHRONOLOGY_STATE = {
  scope: "Declassified",
  focus: "All",
  kind: "All",
  year: "All",
  month: "All",
  search: ""
};

function chronologySearchParams() {
  const params = new URLSearchParams();
  if (state.conversationScope !== DEFAULT_CHRONOLOGY_STATE.scope) params.set("scope", state.conversationScope);
  if (state.conversationFocus !== DEFAULT_CHRONOLOGY_STATE.focus) params.set("focus", state.conversationFocus);
  if (state.conversationKind !== DEFAULT_CHRONOLOGY_STATE.kind) params.set("form", state.conversationKind);
  if (state.conversationYear !== DEFAULT_CHRONOLOGY_STATE.year) params.set("year", state.conversationYear);
  if (state.conversationMonth !== DEFAULT_CHRONOLOGY_STATE.month) params.set("month", state.conversationMonth);
  if (state.conversationSearch !== DEFAULT_CHRONOLOGY_STATE.search) params.set("q", state.conversationSearch);
  return params;
}

function chronologyUrl(record = null) {
  const url = new URL(window.location.href);
  const params = chronologySearchParams();
  url.search = params.toString();
  url.hash = record?.id ? `record-${record.id}` : "conversations";
  return url.toString();
}

function updateChronologyUrl() {
  if (!window.history?.replaceState) return;
  window.history.replaceState(null, "", chronologyUrl());
}

function compilerWorksheetText(record) {
  return [
    `${record.date} | ${record.kind} | ${record.title}`,
    record.counterpart ? `Counterpart: ${record.counterpart}` : "",
    `Scope: ${record.documentScope || "Unscoped"}`,
    `Identifier: ${normalizedIdentifier(record.identifier)}`,
    `Collection: ${record.collection}`,
    `Repository: ${repositoryLabel(record)}`,
    `Pages: ${pageLabel(record.pageCount)}; source PDF pp. ${record.sourcePdfPages || "pending"}; ${localExtractLabel(record)}`,
    record.dateBasis ? `Chronology note: ${record.dateBasis}` : "",
    record.annotationSheet ? `Annotation sheet: ${record.annotationSheet}` : "",
    "",
    "FRUS-style source note draft:",
    sourceNoteDraft(record),
    "",
    "Citation verification worklist:",
    citationOpenItems(record),
    "",
    "Links:",
    record.id ? `Workspace record link: ${chronologyUrl(record)}` : "",
    record.pdfUrl ? `Review PDF: ${record.pdfUrl}` : "",
    distinctSourcePacketUrl(record) ? `Original source packet PDF: ${distinctSourcePacketUrl(record)}` : "",
    record.url ? `Record locator: ${record.url}` : ""
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function chronologyFilterLabel() {
  return [
    `Scope: ${state.conversationScope}`,
    `Focus: ${conversationFocusOption(state.conversationFocus).label}`,
    `Form: ${state.conversationKind}`,
    `Year: ${state.conversationYear}`,
    `Month: ${monthLabel(state.conversationMonth)}`,
    state.conversationSearch ? `Search: ${state.conversationSearch}` : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function markdownLineBreak(value = "") {
  return String(value).replace(/\n/g, "\n\n");
}

function markdownRecordWorksheet(record, index) {
  return [
    `## ${index + 1}. ${record.date} | ${record.kind} | ${record.title}`,
    "",
    `- Scope: ${record.documentScope || "Unscoped"}`,
    record.counterpart ? `- Counterpart: ${record.counterpart}` : "",
    `- Identifier: ${normalizedIdentifier(record.identifier)}`,
    `- Collection: ${record.collection}`,
    `- Repository: ${repositoryLabel(record)}`,
    `- Page accounting: ${pageLabel(record.pageCount)}; source PDF pp. ${record.sourcePdfPages || "pending"}; ${localExtractLabel(record)}`,
    record.dateBasis ? `- Chronology note: ${record.dateBasis}` : "",
    record.annotationSheet ? `- Annotation sheet: ${record.annotationSheet}` : "",
    "",
    "### FRUS-style source note draft",
    "",
    markdownLineBreak(sourceNoteDraft(record)),
    "",
    "### Citation verification worklist",
    "",
    markdownLineBreak(citationOpenItems(record)),
    "",
    "### Compiler relevance",
    "",
    markdownLineBreak(record.compilerUse || "Relevance note pending."),
    "",
    "### Links",
    "",
    record.id ? `- Workspace record link: ${chronologyUrl(record)}` : "",
    record.pdfUrl ? `- Review PDF: ${record.pdfUrl}` : "",
    distinctSourcePacketUrl(record) ? `- Original source packet PDF: ${distinctSourcePacketUrl(record)}` : "",
    record.url ? `- Record locator: ${record.url}` : ""
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function filteredWorksheetMarkdown(data) {
  const records = filteredConversations(data);
  const direct = records.filter(isDirectPdf).length;
  const extracted = records.filter(isExtractedDocument).length;
  const annotated = records.filter((record) => record.annotationSheet).length;
  return [
    "# Balkans 1993-1995 Chronology Worksheet Export",
    "",
    "This export is a working provenance packet for compiler review. It is not a recommendation about inclusion or volume structure.",
    "",
    `Exported: ${new Date().toISOString()}`,
    `Active filters: ${chronologyFilterLabel()}`,
    `Records: ${formatNumber(records.length)} of ${formatNumber(conversationRecords(data).length)}; pages: ${formatNumber(sumPages(records))}; direct PDFs: ${formatNumber(direct)}; extracted PDFs: ${formatNumber(extracted)}; annotation sheets: ${formatNumber(annotated)}.`,
    "",
    ...records.map(markdownRecordWorksheet)
  ].join("\n");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Unable to copy text");
}

function createCopyButton(label, copiedLabel, textForCopy) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "source-action";
  button.textContent = label;
  button.addEventListener("click", async () => {
    const original = button.textContent;
    try {
      await copyTextToClipboard(textForCopy());
      button.textContent = copiedLabel;
      button.classList.add("copied");
    } catch {
      button.textContent = "Copy failed";
      button.classList.add("copy-failed");
    } finally {
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copied", "copy-failed");
      }, 2200);
    }
  });
  return button;
}

function createConversationLinks(record) {
  const links = document.createElement("div");
  links.className = "conversation-links";

  for (const [label, url] of [
    [isExtractedDocument(record) ? "Open review PDF" : "Open PDF", record.pdfUrl],
    ["Open source packet", distinctSourcePacketUrl(record)],
    ["Open record", record.url]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  links.append(createCopyButton("Copy worksheet", "Worksheet copied", () => compilerWorksheetText(record)));
  links.append(createCopyButton("Copy record link", "Record link copied", () => chronologyUrl(record)));
  return links;
}

function sourceNoteDetails(record) {
  const details = document.createElement("details");
  details.className = "source-note-details";
  const summary = document.createElement("summary");
  summary.textContent = "FRUS-style source note";

  const draft = document.createElement("p");
  draft.className = "source-note-draft";
  draft.textContent = sourceNoteDraft(record);

  const ledger = document.createElement("dl");
  ledger.className = "citation-ledger";

  for (const row of citationRows(record)) {
    const item = document.createElement("div");
    item.className = "citation-ledger-row";
    const term = document.createElement("dt");
    term.textContent = row.label;
    const definition = document.createElement("dd");
    const status = document.createElement("span");
    status.className = `citation-status ${row.status.toLowerCase()}`;
    status.textContent = row.status;
    definition.append(status, document.createTextNode(row.value));
    item.append(term, definition);
    ledger.append(item);
  }

  details.append(summary, draft, ledger);
  return details;
}

function conversationTextMatch(record) {
  if (!state.conversationSearch) return true;
  const haystack = [
    record.title,
    record.counterpart,
    record.identifier,
    record.collection,
    record.repository,
    record.compilerUse,
    record.documentScope,
    record.documentType,
    record.dateBasis,
    record.kind,
    ...(record.subjects || []),
    ...(record.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.conversationSearch.toLowerCase());
}

function conversationYear(record) {
  return (record.sortDate || "").slice(0, 4);
}

function conversationMonth(record) {
  return (record.sortDate || "").slice(0, 7);
}

const MONTH_NAMES = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

function monthLabel(value) {
  if (value === "All") return "All months";
  const [year, month] = String(value).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return value || "Unsorted";
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

function isPublicPaperRecord(record) {
  return record.documentScope === "Public statement";
}

function isConversationRecord(record) {
  return ["Memcon", "Telcon"].includes(record.kind) || /conversation/i.test(record.documentScope || "");
}

const CONVERSATION_SCOPES = ["Declassified", "All", "Presidential conversations", "Public Papers"];

function matchesConversationScope(record) {
  if (state.conversationScope === "All") return true;
  if (state.conversationScope === "Public Papers") return isPublicPaperRecord(record);
  if (state.conversationScope === "Presidential conversations") return isConversationRecord(record);
  return !isPublicPaperRecord(record);
}

function isPcDcRecord(record) {
  const haystack = [record.kind, record.title, record.collection, record.compilerUse, ...(record.tags || [])].join(" ");
  return /NSC|Principals|Deputies|Summary of Conclusions|PC\/DC|P\/DC|PCDC/i.test(haystack);
}

function isIntelligenceRecord(record) {
  const haystack = [record.documentScope, record.kind, record.title, record.collection, ...(record.tags || [])].join(" ");
  return /Intelligence|CIA|NIC|NIE|Estimate|Office of European Analysis|Office of Slavic/i.test(haystack);
}

function isStateFoiaRecord(record) {
  const haystack = [record.kind, record.repository, record.collection, record.identifier, record.title].join(" ");
  return /State FOIA|FOIA Virtual Reading Room|Cable|Dissent Channel/i.test(haystack);
}

function isInferredDateRecord(record) {
  return record.dateCertainty === "inferred" || Boolean(record.dateBasis) || /inferred/i.test(record.date || "");
}

const CONVERSATION_FOCUS_OPTIONS = [
  { value: "All", label: "All records in scope", match: () => true },
  { value: "Conversations", label: "Memcons and telcons", match: isConversationRecord },
  { value: "NSC / PC-DC", label: "NSC / PC-DC records", match: isPcDcRecord },
  { value: "Intelligence", label: "Intelligence records", match: isIntelligenceRecord },
  { value: "State FOIA / cables", label: "State FOIA / cables", match: isStateFoiaRecord },
  { value: "Extracted PDFs", label: "Extracted packet PDFs", match: isExtractedDocument },
  { value: "Inferred dates", label: "Inferred-date records", match: isInferredDateRecord }
];

function applyChronologyUrlState(data) {
  const params = new URLSearchParams(window.location.search);
  const documents = conversationRecords(data);
  const scope = params.get("scope");
  const focus = params.get("focus");
  const form = params.get("form");
  const year = params.get("year");
  const month = params.get("month");
  const search = params.get("q");

  if (CONVERSATION_SCOPES.includes(scope)) state.conversationScope = scope;
  if (CONVERSATION_FOCUS_OPTIONS.some((option) => option.value === focus)) state.conversationFocus = focus;
  if (form === "All" || documents.some((record) => record.kind === form)) state.conversationKind = form;
  if (year === "All" || documents.some((record) => conversationYear(record) === year)) state.conversationYear = year;
  if (month === "All" || documents.some((record) => conversationMonth(record) === month)) state.conversationMonth = month;
  if (search !== null) state.conversationSearch = search.trim();

  const hashId = window.location.hash.startsWith("#record-") ? window.location.hash.slice("#record-".length) : "";
  const hashRecord = documents.find((record) => record.id === hashId);
  if (hashRecord && !params.has("scope")) {
    state.conversationScope = isPublicPaperRecord(hashRecord) ? "Public Papers" : "Declassified";
  }

  nodes.conversationSearch.value = state.conversationSearch;
}

function conversationFocusOption(value) {
  return CONVERSATION_FOCUS_OPTIONS.find((option) => option.value === value) || CONVERSATION_FOCUS_OPTIONS[0];
}

function matchesConversationFocus(record) {
  return conversationFocusOption(state.conversationFocus).match(record);
}

function filteredConversations(data) {
  return conversationRecords(data)
    .filter(matchesConversationScope)
    .filter(matchesConversationFocus)
    .filter((record) => state.conversationKind === "All" || record.kind === state.conversationKind)
    .filter((record) => state.conversationYear === "All" || conversationYear(record) === state.conversationYear)
    .filter((record) => state.conversationMonth === "All" || conversationMonth(record) === state.conversationMonth)
    .filter(conversationTextMatch)
    .sort(byDateThenType);
}

function renderButtonGroup(root, values, activeValue, onSelect) {
  root.replaceChildren();

  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.setAttribute("aria-pressed", value === activeValue ? "true" : "false");
    button.addEventListener("click", () => onSelect(value));
    root.append(button);
  }
}

function renderSelect(root, options, activeValue, onSelect) {
  root.replaceChildren();

  for (const option of options) {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    const item = document.createElement("option");
    item.value = value;
    item.textContent = label;
    item.selected = value === activeValue;
    root.append(item);
  }

  root.onchange = (event) => onSelect(event.target.value);
}

function renderConversationFilters(data) {
  const conversations = conversationRecords(data);
  const scopes = CONVERSATION_SCOPES;
  const scopeRecords = conversations.filter(matchesConversationScope);
  const focusOptions = CONVERSATION_FOCUS_OPTIONS.filter(
    (option) => option.value === "All" || scopeRecords.some((record) => option.match(record))
  );
  if (!focusOptions.some((option) => option.value === state.conversationFocus)) state.conversationFocus = "All";

  const focusRecords = scopeRecords.filter(matchesConversationFocus);
  const kinds = ["All", ...new Set(focusRecords.map((record) => record.kind).sort())];
  if (!kinds.includes(state.conversationKind)) state.conversationKind = "All";

  const kindRecords = focusRecords.filter(
    (record) => state.conversationKind === "All" || record.kind === state.conversationKind
  );
  const years = ["All", ...new Set(kindRecords.map(conversationYear).filter(Boolean).sort())];
  if (!years.includes(state.conversationYear)) state.conversationYear = "All";

  const yearRecords = kindRecords.filter(
    (record) => state.conversationYear === "All" || conversationYear(record) === state.conversationYear
  );
  const monthValues = ["All", ...new Set(yearRecords.map(conversationMonth).filter(Boolean).sort())];
  if (!monthValues.includes(state.conversationMonth)) state.conversationMonth = "All";
  const months = monthValues.map((value) => ({ value, label: monthLabel(value) }));

  renderButtonGroup(nodes.conversationScopeFilters, scopes, state.conversationScope, (value) => {
    state.conversationScope = value;
    state.conversationFocus = "All";
    state.conversationMonth = "All";
    refreshChronology(data);
  });

  renderSelect(nodes.conversationFocus, focusOptions, state.conversationFocus, (value) => {
    state.conversationFocus = value;
    state.conversationMonth = "All";
    refreshChronology(data);
  });

  renderSelect(nodes.conversationKind, kinds, state.conversationKind, (value) => {
    state.conversationKind = value;
    state.conversationMonth = "All";
    refreshChronology(data);
  });

  renderSelect(nodes.conversationYear, years, state.conversationYear, (value) => {
    state.conversationYear = value;
    state.conversationMonth = "All";
    refreshChronology(data);
  });

  renderSelect(nodes.conversationMonth, months, state.conversationMonth, (value) => {
    state.conversationMonth = value;
    refreshChronology(data);
  });
}

function chronologyIndexRecords(data) {
  return conversationRecords(data)
    .filter(matchesConversationScope)
    .filter(matchesConversationFocus)
    .filter((record) => state.conversationKind === "All" || record.kind === state.conversationKind)
    .filter((record) => state.conversationYear === "All" || conversationYear(record) === state.conversationYear)
    .filter(conversationTextMatch)
    .sort(byDateThenType);
}

function renderChronologyIndex(data) {
  const records = chronologyIndexRecords(data);
  const months = groupCounts(records, conversationMonth)
    .filter((item) => item.label)
    .sort((a, b) => a.label.localeCompare(b.label));

  const heading = document.createElement("div");
  heading.className = "chronology-index-heading";
  const title = document.createElement("strong");
  title.textContent = "Month index";
  const note = document.createElement("span");
  note.textContent = `${formatNumber(records.length)} records before month drilldown.`;
  heading.append(title, note);

  const chips = document.createElement("div");
  chips.className = "chronology-month-list";

  if (!months.length) {
    const empty = document.createElement("span");
    empty.className = "chronology-empty";
    empty.textContent = "No dated records for the current filters.";
    chips.append(empty);
  } else {
    const all = document.createElement("button");
    all.type = "button";
    all.textContent = "All months";
    all.setAttribute("aria-pressed", state.conversationMonth === "All" ? "true" : "false");
    all.addEventListener("click", () => {
      state.conversationMonth = "All";
      refreshChronology(data);
    });
    chips.append(all);

    for (const item of months) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", state.conversationMonth === item.label ? "true" : "false");
      button.textContent = `${monthLabel(item.label)} | ${formatNumber(item.count)} / ${formatNumber(item.pages)} pp.`;
      button.addEventListener("click", () => {
        state.conversationMonth = item.label;
        refreshChronology(data);
      });
      chips.append(button);
    }
  }

  nodes.chronologyIndexRoot.replaceChildren(heading, chips);
}

function renderConversations(data) {
  nodes.conversationRoot.replaceChildren();

  const records = filteredConversations(data);
  const direct = records.filter(isDirectPdf).length;
  const extracted = records.filter(isExtractedDocument).length;
  const annotated = records.filter((record) => record.annotationSheet).length;
  nodes.conversationSummary.textContent = `Showing ${formatNumber(records.length)} of ${formatNumber(
    conversationRecords(data).length
  )} records, ${formatNumber(sumPages(records))} pages, ${formatNumber(direct)} direct PDFs, ${formatNumber(
    extracted
  )} extracted PDFs, ${formatNumber(annotated)} with annotation sheets.`;
  renderChronologyIndex(data);

  if (!records.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No records match the current filters.";
    nodes.conversationRoot.append(empty);
    return;
  }

  for (const record of records) {
    const card = document.createElement("article");
    card.className = "conversation-card";
    card.id = `record-${record.id}`;

    const date = document.createElement("time");
    date.className = "conversation-date";
    date.dateTime = record.sortDate;
    date.textContent = record.date;

    const body = document.createElement("div");

    const top = document.createElement("div");
    top.className = "conversation-top";
    const heading = document.createElement("h3");
    heading.textContent = record.title;
    const badges = document.createElement("div");
    badges.className = "conversation-badges";
    const kind = document.createElement("span");
    kind.className = `source-type ${record.kind.toLowerCase().replace(/\s+/g, "-")}`;
    kind.textContent = record.kind;
    const provenance = document.createElement("span");
    provenance.className = `source-type ${isExtractedDocument(record) ? "extracted" : "direct"}`;
    provenance.textContent = isExtractedDocument(record) ? "Extracted PDF" : "Direct PDF";
    badges.append(kind, provenance);
    if (record.dateCertainty === "inferred") {
      const inferred = document.createElement("span");
      inferred.className = "source-type inferred";
      inferred.textContent = "Inferred date";
      badges.append(inferred);
    }
    top.append(heading, badges);

    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [
      record.counterpart,
      record.documentScope,
      record.identifier,
      record.collection,
      pageLabel(record.pageCount),
      record.sourcePdfPages ? `source pp. ${record.sourcePdfPages}` : ""
    ]
      .filter(Boolean)
      .join(" | ");

    const use = document.createElement("p");
    use.textContent = record.compilerUse || "";

    const subjects = document.createElement("p");
    subjects.className = "conversation-subjects";
    subjects.textContent = (record.subjects || []).join(" / ");

    const extraction = document.createElement("p");
    extraction.className = "conversation-provenance";
    extraction.textContent = record.extractionStatus || "PDF provenance recorded in source metadata.";

    body.append(top, meta);
    if (use.textContent) body.append(use);
    if (subjects.textContent) body.append(subjects);
    if (record.dateBasis) {
      const dateBasis = document.createElement("p");
      dateBasis.className = "conversation-provenance";
      dateBasis.textContent = `Chronology note: ${record.dateBasis}`;
      body.append(dateBasis);
    }
    body.append(extraction, sourceNoteDetails(record), createTagRow(record.tags));

    card.append(date, body, createConversationLinks(record));
    nodes.conversationRoot.append(card);
  }
}

function scrollToRecordHash() {
  if (!window.location.hash.startsWith("#record-")) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (!target) return;
  window.setTimeout(() => {
    target.scrollIntoView({ block: "start" });
    target.classList.add("target-record");
    window.setTimeout(() => target.classList.remove("target-record"), 2400);
  }, 100);
}

function refreshChronology(data, syncUrl = true) {
  renderConversationFilters(data);
  renderConversations(data);
  if (syncUrl) updateChronologyUrl();
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function safeFilenameSegment(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function chronologyExportStem() {
  const parts = [
    state.conversationScope,
    state.conversationFocus,
    state.conversationKind === "All" ? "" : state.conversationKind,
    state.conversationYear === "All" ? "" : state.conversationYear,
    state.conversationMonth === "All" ? "" : state.conversationMonth,
    state.conversationSearch ? `search-${state.conversationSearch}` : ""
  ]
    .map(safeFilenameSegment)
    .filter(Boolean);
  return `balkans-93-95-${parts.join("-") || "chronology"}`;
}

function exportFilteredConversations(data) {
  const fields = [
    "date",
    "kind",
    "title",
    "counterpart",
    "documentScope",
    "identifier",
    "collection",
    "pageCount",
    "localPdfPageCount",
    "sourcePdfPages",
    "sourcePdfUrl",
    "pdfUrl",
    "recordUrl",
    "frusStyleSourceNoteDraft",
    "citationOpenItems",
    "compilerUse"
  ];
  const rows = filteredConversations(data).map((record) => [
    record.date,
    record.kind,
    record.title,
    record.counterpart,
    record.documentScope,
    record.identifier,
    record.collection,
    record.pageCount,
    record.localPdfPageCount || "",
    record.sourcePdfPages,
    record.sourcePdfUrl || "",
    record.pdfUrl,
    record.url,
    sourceNoteDraft(record),
    citationOpenItems(record),
    record.compilerUse
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile(`${chronologyExportStem()}-records.csv`, `${csv}\n`, "text/csv;charset=utf-8");
}

function exportFilteredWorksheetMarkdown(data) {
  downloadTextFile(
    `${chronologyExportStem()}-worksheets.md`,
    `${filteredWorksheetMarkdown(data)}\n`,
    "text/markdown;charset=utf-8"
  );
}

function renderFilters(data) {
  const types = ["All", ...new Set(data.sources.map(sourceTypeLabel))];
  nodes.sourceFilters.replaceChildren();

  for (const type of types) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = type;
    button.setAttribute("aria-pressed", type === state.filter ? "true" : "false");
    button.addEventListener("click", () => {
      state.filter = type;
      renderSources(data);
      renderFilters(data);
    });
    nodes.sourceFilters.append(button);
  }
}

function renderSources(data) {
  nodes.sourcesRoot.replaceChildren();

  const sources = data.sources
    .filter((source) => state.filter === "All" || sourceTypeLabel(source) === state.filter)
    .filter(textMatch)
    .sort(byPriority);

  if (!sources.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No source leads match the current search.";
    nodes.sourcesRoot.append(empty);
    return;
  }

  for (const source of sources) {
    const card = document.createElement("article");
    card.className = "source-card";

    const top = document.createElement("div");
    top.className = "source-top";

    const headingWrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = sourceTitle(source);
    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [source.identifier, source.institution].filter(Boolean).join(" | ");
    headingWrap.append(heading, meta);

    const priority = document.createElement("span");
    priority.className = `priority ${priorityClass(source.priority)}`;
    priority.textContent = source.priority || source.status || "Source";

    top.append(headingWrap, priority);

    const type = document.createElement("span");
    type.className = "source-type";
    type.textContent = sourceTypeLabel(source);

    const description = document.createElement("p");
    description.textContent = source.description;

    const use = document.createElement("p");
    use.textContent = source.compilerUse;

    const link = document.createElement("a");
    link.className = "source-link";
    link.href = source.url;
    link.rel = "noreferrer";
    link.textContent = "Open source";

    card.append(top, type, description, use, createTagRow(source.tags), link);
    nodes.sourcesRoot.append(card);
  }
}

function renderQueue(data) {
  nodes.queueRoot.replaceChildren();

  for (const item of data.harvestQueue) {
    const row = document.createElement("tr");

    for (const value of [item.target, item.why, item.nextAction, item.status]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    nodes.queueRoot.append(row);
  }
}

function bindSearch(data) {
  nodes.sourceSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderSources(data);
  });

  nodes.conversationSearch.addEventListener("input", (event) => {
    state.conversationSearch = event.target.value.trim();
    renderConversations(data);
    updateChronologyUrl();
  });

  nodes.conversationReset.addEventListener("click", () => {
    state.conversationScope = "Declassified";
    state.conversationFocus = "All";
    state.conversationKind = "All";
    state.conversationYear = "All";
    state.conversationMonth = "All";
    state.conversationSearch = "";
    nodes.conversationSearch.value = "";
    refreshChronology(data);
  });

  nodes.conversationViewLink.addEventListener("click", async () => {
    const original = nodes.conversationViewLink.textContent;
    try {
      await copyTextToClipboard(chronologyUrl());
      nodes.conversationViewLink.textContent = "Link copied";
      nodes.conversationViewLink.classList.add("copied");
    } catch {
      nodes.conversationViewLink.textContent = "Copy failed";
      nodes.conversationViewLink.classList.add("copy-failed");
    } finally {
      window.setTimeout(() => {
        nodes.conversationViewLink.textContent = original;
        nodes.conversationViewLink.classList.remove("copied", "copy-failed");
      }, 2200);
    }
  });

  nodes.conversationExport.addEventListener("click", () => {
    exportFilteredConversations(data);
  });

  nodes.conversationMdExport.addEventListener("click", () => {
    exportFilteredWorksheetMarkdown(data);
  });
}

function bindResearchSearch(report) {
  if (!report) return;

  nodes.researchSearch.addEventListener("input", (event) => {
    state.researchSearch = event.target.value.trim();
    renderResearchFiles(report);
  });

  nodes.researchReset.addEventListener("click", () => {
    state.researchRelationship = "All";
    state.researchSearch = "";
    nodes.researchSearch.value = "";
    renderResearchRelationshipFilters(report);
    renderResearchFiles(report);
  });

  nodes.researchExport.addEventListener("click", () => {
    exportResearchFiles(report);
  });
}

function bindLibrarySearch(report) {
  if (!report) return;

  nodes.librarySearch.addEventListener("input", (event) => {
    state.librarySearch = event.target.value.trim();
    renderLibraryTargets(report);
  });

  nodes.libraryReset.addEventListener("click", () => {
    state.libraryPriority = "Critical + High";
    state.librarySearch = "";
    nodes.librarySearch.value = "";
    renderLibraryPriorityFilters(report);
    renderLibraryTargets(report);
  });

  nodes.libraryExport.addEventListener("click", () => {
    exportLibraryTargets(report);
  });
}

function bindPddSearch(report, data) {
  if (!report || !nodes.pddSearch) return;

  nodes.pddSearch.addEventListener("input", (event) => {
    state.pddSearch = event.target.value.trim();
    renderPddReferences(report, data);
  });

  nodes.pddReset.addEventListener("click", () => {
    state.pddConfidence = "All";
    state.pddSearch = "";
    nodes.pddSearch.value = "";
    renderPddConfidenceFilters(report, data);
    renderPddReferences(report, data);
  });

  nodes.pddExport.addEventListener("click", () => {
    exportPddReferences(report, data);
  });
}

function bindStateFoiaSearch(report) {
  if (!report || !nodes.stateFoiaSearch) return;

  nodes.stateFoiaSearch.addEventListener("input", (event) => {
    state.stateFoiaSearch = event.target.value.trim();
    renderStateFoiaDocuments(report);
  });

  nodes.stateFoiaReset.addEventListener("click", () => {
    state.stateFoiaRoute = "All";
    state.stateFoiaSearch = "";
    nodes.stateFoiaSearch.value = "";
    renderStateFoiaRouteFilters(report);
    renderStateFoiaDocuments(report);
  });

  nodes.stateFoiaExport.addEventListener("click", () => {
    exportStateFoiaDocuments(report);
  });
}

function bindDefenseJcsSearch(report) {
  if (!report || !nodes.defenseJcsSearch) return;

  nodes.defenseJcsSearch.addEventListener("input", (event) => {
    state.defenseJcsSearch = event.target.value.trim();
    renderDefenseJcsDocuments(report);
  });

  nodes.defenseJcsReset.addEventListener("click", () => {
    state.defenseJcsTopic = "All";
    state.defenseJcsSource = "All";
    state.defenseJcsSearch = "";
    nodes.defenseJcsSearch.value = "";
    renderDefenseJcsFilters(report);
    renderDefenseJcsDocuments(report);
  });

  nodes.defenseJcsExport.addEventListener("click", () => {
    exportDefenseJcsDocuments(report);
  });
}

function bindNaraCrosscheckSearch(report) {
  if (!report || !nodes.naraCrosscheckSearch) return;

  nodes.naraCrosscheckSearch.addEventListener("input", (event) => {
    state.naraCrosscheckSearch = event.target.value.trim();
    renderNaraCrosscheckDocuments(report);
  });

  nodes.naraCrosscheckReset.addEventListener("click", () => {
    state.naraCrosscheckSource = "All";
    state.naraCrosscheckYear = "All";
    state.naraCrosscheckSearch = "";
    nodes.naraCrosscheckSearch.value = "";
    renderNaraCrosscheckFilters(report);
    renderNaraCrosscheckDocuments(report);
  });

  nodes.naraCrosscheckExport.addEventListener("click", () => {
    exportNaraCrosscheckDocuments(report);
  });
}

function bindPromotionSearch(report) {
  if (!report || !nodes.promotionSearch) return;

  nodes.promotionSearch.addEventListener("input", (event) => {
    state.promotionSearch = event.target.value.trim();
    renderPromotionQueue(report);
  });

  nodes.promotionReset.addEventListener("click", () => {
    state.promotionPriority = "All";
    state.promotionSource = "All";
    state.promotionSearch = "";
    nodes.promotionSearch.value = "";
    renderPromotionPriorityFilters(report);
    renderPromotionSourceOptions(report);
    renderPromotionQueue(report);
  });

  nodes.promotionExport.addEventListener("click", () => {
    exportPromotionQueue(report);
  });
}

async function loadOptionalJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function loadReports() {
  const [
    documents,
    conversations,
    nara,
    talbott,
    researchCollections,
    publicPapers,
    sourceCrosscheck,
    stateFoia,
    btfDocuments,
    defenseJcs,
    conversationReconciliation,
    sourceNoteAudit,
    presidentialDailyDiary,
    gapRegister,
    libraryVisit
  ] = await Promise.all([
    loadOptionalJson(REPORT_URLS.documents),
    loadOptionalJson(REPORT_URLS.conversations),
    loadOptionalJson(REPORT_URLS.nara),
    loadOptionalJson(REPORT_URLS.talbott),
    loadOptionalJson(REPORT_URLS.researchCollections),
    loadOptionalJson(REPORT_URLS.publicPapers),
    loadOptionalJson(REPORT_URLS.sourceCrosscheck),
    loadOptionalJson(REPORT_URLS.stateFoia),
    loadOptionalJson(REPORT_URLS.btfDocuments),
    loadOptionalJson(REPORT_URLS.defenseJcs),
    loadOptionalJson(REPORT_URLS.conversationReconciliation),
    loadOptionalJson(REPORT_URLS.sourceNoteAudit),
    loadOptionalJson(REPORT_URLS.presidentialDailyDiary),
    loadOptionalJson(REPORT_URLS.gapRegister),
    loadOptionalJson(REPORT_URLS.libraryVisit)
  ]);

  return {
    documents,
    conversations,
    nara,
    talbott,
    researchCollections,
    publicPapers,
    sourceCrosscheck,
    stateFoia,
    btfDocuments,
    defenseJcs,
    conversationReconciliation,
    sourceNoteAudit,
    presidentialDailyDiary,
    gapRegister,
    libraryVisit
  };
}

async function loadData() {
  if (window.COMPILER_MAP_DATA) return window.COMPILER_MAP_DATA;
  if (window.COMPILER_DATA) return window.COMPILER_DATA;

  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Unable to load ${DATA_URL}: ${response.status}`);
  return response.json();
}

async function init() {
  try {
    const [data, reports] = await Promise.all([loadData(), loadReports()]);
    const researchReport = combineResearchReports(
      reports.researchCollections,
      reports.sourceCrosscheck,
      reports.stateFoia,
      reports.btfDocuments,
      reports.presidentialDailyDiary
    );
    applyChronologyUrlState(data);
    renderStats(data);
    renderAudit(data, reports);
    renderCompilerGaps(reports.gapRegister);
    renderPresidentialDailyDiary(reports.presidentialDailyDiary, data);
    renderStateFoiaQueue(reports.stateFoia);
    renderDefenseJcsQueue(reports.defenseJcs);
    renderNaraCrosscheckQueue(reports.sourceCrosscheck);
    renderClintonLibraryVisit(reports.libraryVisit);
    renderFrusMethod(data, reports);
    renderResearchCollections(researchReport);
    renderConversationFilters(data);
    renderConversations(data);
    scrollToRecordHash();
    renderFilters(data);
    renderSources(data);
    renderQueue(data);
    bindSearch(data);
    bindPromotionSearch(reports.gapRegister);
    bindPddSearch(reports.presidentialDailyDiary, data);
    bindStateFoiaSearch(reports.stateFoia);
    bindDefenseJcsSearch(reports.defenseJcs);
    bindNaraCrosscheckSearch(reports.sourceCrosscheck);
    bindResearchSearch(researchReport);
    bindLibrarySearch(reports.libraryVisit);
  } catch (error) {
    console.error(error);
    nodes.sourcesRoot.innerHTML = '<p class="empty-state">Compiler data could not be loaded.</p>';
  }
}

init();
