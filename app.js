const DATA_URL = "data/compiler-map.json";
const REPORT_URLS = {
  documents: "reports/document-page-counts.json",
  conversations: "reports/conversation-page-counts.json",
  nara: "reports/nara-scout-memcon-telcon-search.json",
  talbott: "reports/strobe-talbott-manifest-search.json",
  researchCollections: "reports/research-collection-search.json",
  publicPapers: "reports/public-papers-balkans-search.json",
  sourceCrosscheck: "reports/source-crosscheck-potential-documents.json"
};

const state = {
  filter: "All",
  search: "",
  conversationKind: "All",
  conversationYear: "All",
  conversationSearch: "",
  researchRelationship: "All",
  researchSearch: ""
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
  frusMethodRoot: document.querySelector("#frus-method-root"),
  readinessRoot: document.querySelector("#readiness-root"),
  sourceNoteRoot: document.querySelector("#source-note-root"),
  conversationRoot: document.querySelector("#conversation-root"),
  conversationSearch: document.querySelector("#conversation-search"),
  conversationKindFilters: document.querySelector("#conversation-kind-filters"),
  conversationYearFilters: document.querySelector("#conversation-year-filters"),
  conversationReset: document.querySelector("#conversation-reset"),
  conversationExport: document.querySelector("#conversation-export"),
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
    source.identifier,
    source.institution,
    source.description,
    source.compilerUse,
    source.type,
    ...(source.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.search.toLowerCase());
}

function byPriority(a, b) {
  const order = { Anchor: 0, Core: 1, High: 2, Contextual: 3 };
  return (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || a.title.localeCompare(b.title);
}

function priorityClass(priority) {
  return (priority || "").toLowerCase();
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
    return `direct PDF, pp. ${record.sourcePdfPages || `1-${record.pageCount || "?"}`}`;
  }

  if (record.sourcePdfPages) {
    return `source packet PDF, pp. ${record.sourcePdfPages}; document-level PDF extracted for review`;
  }

  return "PDF locator recorded; source page range pending";
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
  const reviewClause =
    "Original classification/handling, drafting or notetaker data, distribution/clearance, annotations, attachments, and excisions require PDF-level verification before compiler review.";

  return `Source: ${citationStem}. ${sourcePdf}. ${reviewClause}`;
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
  nodes.status.textContent = data.volume.status;
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
      `${formatNumber(naraRecords + talbottHits + publicPaperRecords + sourceCrosscheckRecords)} leads`,
      `${formatNumber(naraRecords)} declassified NARA Scout records from ${formatNumber(naraUnique)} unique hits; ${formatNumber(talbottHits)} Strobe Talbott full-text hits from ${formatNumber(talbottRows)} rows; ${formatNumber(publicPaperRecords)} Clinton Public Papers records from ${formatNumber(publicPaperRows)} GovInfo granules; ${formatNumber(sourceCrosscheckRecords)} NARA source-family potential documents.`,
      `${formatNumber(talbottStandalone)} reviewed Talbott standalone records total ${formatNumber(talbottStandalonePages)} pages; Public Papers add ${formatNumber(publicStatementPages)} counted pages; source-family leads add ${formatNumber(sourceCrosscheckPages)} counted pages.`
    ),
    auditCard(
      "Highest Density",
      denseYear ? denseYear.label : "N/A",
      denseYear
        ? `${formatNumber(denseYear.value)} documents and ${formatNumber(denseYear.pages)} pages cluster in ${denseYear.label}.`
        : "No document dates available.",
      `${formatNumber(conversations.length)} records remain in the memcon/telcon subset.`
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

function renderFrusMethod(data) {
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
      "Draft notes begin with repository, collection, control number, item or NAID, and the record URL in the order used by FRUS source notes."
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

function researchFiles(report = {}) {
  return [...(report.digitizedFiles || []), ...(report.sourceCrosscheckFiles || [])];
}

function relationshipLabel(value = "") {
  const labels = {
    "exact-folder-title": "Folder-title match",
    "strong-subject-match": "Subject lead",
    "regional-topic-match": "Regional lead",
    "topic-match": "Topic lead",
    "nara-catalog-7388808": "NARA 7388808 cross-check",
    "nara-scout-europe-scopes": "NARA Scout cross-check"
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
  const exactFiles = researchFiles(report).filter((file) =>
    (file.targets || []).some((target) => target.relationship === "exact-folder-title")
  ).length;
  const totalFiles = researchFiles(report).length;
  const totalPages = researchFiles(report).reduce((sum, file) => sum + (file.pageCount || 0), 0);
  const baseFiles = summary.uniqueDigitizedFiles || (report.digitizedFiles || []).length;
  const basePages = summary.countedPages || (report.digitizedFiles || []).reduce((sum, file) => sum + (file.pageCount || 0), 0);
  const crosscheckFiles = sourceCrosscheck.addedPotentialDocuments || 0;
  const crosscheckPages = sourceCrosscheck.countedPages || 0;

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
      `${formatNumber(baseFiles)} Clinton Digital Library research-plan leads plus ${formatNumber(crosscheckFiles)} NARA source-family potential documents.`,
      `${formatNumber(exactFiles)} files have folder-title matches.`
    ),
    auditCard(
      "Page Accounting",
      formatNumber(totalPages),
      `${formatNumber(basePages)} pages counted from the Clinton Digital Library sweep; ${formatNumber(crosscheckPages)} pages counted from the NARA source-family cross-check.`,
      "Large folder PDFs and source-family leads are kept as research leads, not converted into chronology entries here."
    ),
    auditCard(
      "Source Check",
      formatNumber(crosscheckFiles),
      "Checked the companion-page NARA Catalog collection 7388808 and NARA Scout scopes 7386505, 7386739, and 7388773 for in-period Balkans PDF leads.",
      "Potential documents only; this does not recommend inclusion or volume structure."
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
    ["Open PDF", file.pdfUrl],
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

function combineResearchReports(researchCollections, sourceCrosscheck) {
  if (!researchCollections) return null;
  return {
    ...researchCollections,
    sourceCrosscheck,
    sourceCrosscheckSummary: sourceCrosscheck?.summary || null,
    sourceCrosscheckFiles: sourceCrosscheck?.potentialDocuments || []
  };
}

function byDateThenType(a, b) {
  return (a.sortDate || "").localeCompare(b.sortDate || "") || a.title.localeCompare(b.title);
}

function pageLabel(pageCount) {
  if (!pageCount) return "Pages pending";
  return pageCount === 1 ? "1 page" : `${pageCount} pages`;
}

function createConversationLinks(record) {
  const links = document.createElement("div");
  links.className = "conversation-links";

  for (const [label, url] of [
    ["Open PDF", record.pdfUrl],
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

function filteredConversations(data) {
  return conversationRecords(data)
    .filter((record) => state.conversationKind === "All" || record.kind === state.conversationKind)
    .filter((record) => state.conversationYear === "All" || conversationYear(record) === state.conversationYear)
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

function renderConversationFilters(data) {
  const conversations = conversationRecords(data);
  const kinds = ["All", ...new Set(conversations.map((record) => record.kind).sort())];
  const years = ["All", ...new Set(conversations.map(conversationYear).filter(Boolean).sort())];

  renderButtonGroup(nodes.conversationKindFilters, kinds, state.conversationKind, (value) => {
    state.conversationKind = value;
    renderConversationFilters(data);
    renderConversations(data);
  });

  renderButtonGroup(nodes.conversationYearFilters, years, state.conversationYear, (value) => {
    state.conversationYear = value;
    renderConversationFilters(data);
    renderConversations(data);
  });
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

  if (!records.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No declassified records match the current filters.";
    nodes.conversationRoot.append(empty);
    return;
  }

  for (const record of records) {
    const card = document.createElement("article");
    card.className = "conversation-card";

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

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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
  const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "balkans-93-95-filtered-declassified-documents.csv";
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function renderFilters(data) {
  const types = ["All", ...new Set(data.sources.map((source) => source.type))];
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
    .filter((source) => state.filter === "All" || source.type === state.filter)
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
    heading.textContent = source.title;
    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [source.identifier, source.institution].filter(Boolean).join(" | ");
    headingWrap.append(heading, meta);

    const priority = document.createElement("span");
    priority.className = `priority ${priorityClass(source.priority)}`;
    priority.textContent = source.priority;

    top.append(headingWrap, priority);

    const type = document.createElement("span");
    type.className = "source-type";
    type.textContent = source.type;

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
  });

  nodes.conversationReset.addEventListener("click", () => {
    state.conversationKind = "All";
    state.conversationYear = "All";
    state.conversationSearch = "";
    nodes.conversationSearch.value = "";
    renderConversationFilters(data);
    renderConversations(data);
  });

  nodes.conversationExport.addEventListener("click", () => {
    exportFilteredConversations(data);
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
  const [documents, conversations, nara, talbott, researchCollections, publicPapers, sourceCrosscheck] = await Promise.all([
    loadOptionalJson(REPORT_URLS.documents),
    loadOptionalJson(REPORT_URLS.conversations),
    loadOptionalJson(REPORT_URLS.nara),
    loadOptionalJson(REPORT_URLS.talbott),
    loadOptionalJson(REPORT_URLS.researchCollections),
    loadOptionalJson(REPORT_URLS.publicPapers),
    loadOptionalJson(REPORT_URLS.sourceCrosscheck)
  ]);

  return { documents, conversations, nara, talbott, researchCollections, publicPapers, sourceCrosscheck };
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
    const researchReport = combineResearchReports(reports.researchCollections, reports.sourceCrosscheck);
    renderStats(data);
    renderAudit(data, reports);
    renderFrusMethod(data);
    renderResearchCollections(researchReport);
    renderConversationFilters(data);
    renderConversations(data);
    renderFilters(data);
    renderSources(data);
    renderQueue(data);
    bindSearch(data);
    bindResearchSearch(researchReport);
  } catch (error) {
    nodes.sourcesRoot.innerHTML = '<p class="empty-state">Compiler data could not be loaded.</p>';
  }
}

init();
